from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from apps.report.models import Report, ReportDetail
from apps.report.api.serializers import (
    ReportSerializer,
    ReportDetailedSerializer,
    ReportDetailSerializer,
    GenerateReportSerializer,
    GenerateMonthlyReportSerializer,
)
from apps.report.services import ReportGenerator as ReportGeneratorService
from apps.report.services.pdf_exporter import PDFExporter
from apps.report.services.excel_exporter import ExcelExporter
from apps.report.services.daily_report_service import DailyReportService
from apps.report.tasks import generate_report_files
from django.core.files.base import ContentFile
from datetime import datetime

import logging

logger = logging.getLogger(__name__)


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar informes de paquetes, sacas y lotes.
    
    list: Listar todos los informes
    retrieve: Obtener un informe específico con todos sus detalles
    create: No permitido (usar generate_daily o generate_monthly)
    update: No permitido
    delete: Eliminar un informe
    
    Acciones adicionales:
    - generate_daily: Genera un informe diario
    - generate_monthly: Genera un informe mensual
    - download_pdf: Descarga el PDF del informe
    - download_excel: Descarga el Excel del informe
    - download_json: Descarga los datos JSON del informe
    - regenerate_files: Regenera los archivos PDF y Excel
    """
    
    queryset = Report.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['report_type', 'status', 'is_automatic']
    ordering_fields = ['report_date', 'created_at', 'updated_at']
    ordering = ['-report_date', '-created_at']
    search_fields = ['error_message']
    
    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción."""
        if self.action == 'retrieve':
            return ReportDetailedSerializer
        elif self.action == 'generate_daily':
            return GenerateReportSerializer
        elif self.action == 'generate_monthly':
            return GenerateMonthlyReportSerializer
        return ReportSerializer
    
    def create(self, request, *args, **kwargs):
        """No permitir creación directa, usar generate_daily o generate_monthly."""
        return Response(
            {
                'detail': 'Use /reports/generate_daily/ o /reports/generate_monthly/ para crear informes.'
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def update(self, request, *args, **kwargs):
        """No permitir actualización de informes."""
        return Response(
            {'detail': 'No se pueden modificar informes existentes.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def partial_update(self, request, *args, **kwargs):
        """No permitir actualización parcial de informes."""
        return Response(
            {'detail': 'No se pueden modificar informes existentes.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    @action(detail=False, methods=['post'])
    def generate_daily(self, request):
        """
        Genera un informe diario manualmente.
        
        Body:
        {
            "report_date": "2024-01-15",
            "generate_files": true
        }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        report_date = serializer.validated_data['report_date']
        generate_files_flag = serializer.validated_data.get('generate_files', True)
        
        try:
            # Generar informe
            generator = ReportGenerator(user=request.user)
            report = generator.generate_daily_report(report_date)
            
            # Generar archivos si se solicita
            if generate_files_flag and report.status == 'COMPLETED':
                # Ejecutar generación de archivos de forma asíncrona
                generate_report_files.delay(str(report.id))
            
            # Serializar y retornar
            output_serializer = ReportDetailedSerializer(
                report,
                context={'request': request}
            )
            
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Error generando informe diario: {str(e)}")
            return Response(
                {'detail': f'Error generando informe: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def generate_monthly(self, request):
        """
        Genera un informe mensual manualmente.
        
        Body:
        {
            "year": 2024,
            "month": 1,
            "generate_files": true
        }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        year = serializer.validated_data['year']
        month = serializer.validated_data['month']
        generate_files_flag = serializer.validated_data.get('generate_files', True)
        
        try:
            # Generar informe
            generator = ReportGenerator(user=request.user)
            report = generator.generate_monthly_report(year, month)
            
            # Generar archivos si se solicita
            if generate_files_flag and report.status == 'COMPLETED':
                # Ejecutar generación de archivos de forma asíncrona
                generate_report_files.delay(str(report.id))
            
            # Serializar y retornar
            output_serializer = ReportDetailedSerializer(
                report,
                context={'request': request}
            )
            
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Error generando informe mensual: {str(e)}")
            return Response(
                {'detail': f'Error generando informe: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Descarga el archivo PDF del informe."""
        report = self.get_object()
        
        if not report.pdf_file:
            return Response(
                {'detail': 'Este informe no tiene archivo PDF generado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            response = FileResponse(
                report.pdf_file.open('rb'),
                content_type='application/pdf'
            )
            filename = f"{report.get_filename_base()}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            logger.error(f"Error descargando PDF del informe {pk}: {str(e)}")
            return Response(
                {'detail': f'Error descargando PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download_excel(self, request, pk=None):
        """Descarga el archivo Excel del informe."""
        report = self.get_object()
        
        if not report.excel_file:
            return Response(
                {'detail': 'Este informe no tiene archivo Excel generado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            response = FileResponse(
                report.excel_file.open('rb'),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            filename = f"{report.get_filename_base()}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            logger.error(f"Error descargando Excel del informe {pk}: {str(e)}")
            return Response(
                {'detail': f'Error descargando Excel: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download_json(self, request, pk=None):
        """Descarga los datos JSON del informe."""
        report = self.get_object()
        
        if not report.json_data:
            return Response(
                {'detail': 'Este informe no tiene datos JSON generados.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            import json
            
            response = HttpResponse(
                json.dumps(report.json_data, indent=2, ensure_ascii=False),
                content_type='application/json'
            )
            filename = f"{report.get_filename_base()}.json"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            logger.error(f"Error descargando JSON del informe {pk}: {str(e)}")
            return Response(
                {'detail': f'Error descargando JSON: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def regenerate_files(self, request, pk=None):
        """Regenera los archivos PDF y Excel del informe."""
        report = self.get_object()
        
        if report.status != 'COMPLETED':
            return Response(
                {'detail': 'Solo se pueden regenerar archivos de informes completados.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Ejecutar generación de archivos de forma asíncrona
            task = generate_report_files.delay(str(report.id))
            
            return Response(
                {
                    'detail': 'Generación de archivos iniciada.',
                    'task_id': task.id
                },
                status=status.HTTP_202_ACCEPTED
            )
            
        except Exception as e:
            logger.error(f"Error regenerando archivos del informe {pk}: {str(e)}")
            return Response(
                {'detail': f'Error regenerando archivos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def packages_report(self, request):
        """
        Generar reporte personalizado de paquetes
        POST /api/v1/reports/packages_report/
        Body: {
            "filters": {
                "date_from": "2024-01-01",
                "date_to": "2024-12-31",
                "status": "DELIVERED",
                "transport_agency": "uuid",
                "shipment_type": "individual|saca|lote"
            },
            "format": "json|excel|pdf|csv"
        }
        """
        from datetime import datetime
        
        filters = request.data.get('filters', {})
        export_format = request.data.get('format', 'json')
        
        # Convertir fechas string a objetos date/datetime
        if filters.get('date_from'):
            filters['date_from'] = datetime.fromisoformat(filters['date_from'].replace('Z', '+00:00'))
        if filters.get('date_to'):
            filters['date_to'] = datetime.fromisoformat(filters['date_to'].replace('Z', '+00:00'))
        # status_change_date se maneja como string en el servicio (se convierte allí)
        # No necesitamos convertirlo aquí porque el servicio lo maneja
        
        try:
            result = ReportGeneratorService.generate_packages_report(filters, export_format)
            
            if export_format == 'json':
                return Response(result, status=status.HTTP_200_OK)
            else:
                # Para Excel, PDF, CSV devuelve HttpResponse directamente
                return result
                
        except Exception as e:
            logger.error(f"Error generando reporte de paquetes: {str(e)}")
            return Response(
                {'detail': f'Error generando reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def statistics_report(self, request):
        """
        Generar reporte estadístico general
        POST /api/v1/reports/statistics_report/
        Body: {
            "date_from": "2024-01-01",
            "date_to": "2024-12-31"
        }
        """
        from datetime import datetime
        
        date_from_str = request.data.get('date_from')
        date_to_str = request.data.get('date_to')
        
        if not date_from_str or not date_to_str:
            return Response(
                {'detail': 'date_from y date_to son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date_from = datetime.fromisoformat(date_from_str.replace('Z', '+00:00')).date()
            date_to = datetime.fromisoformat(date_to_str.replace('Z', '+00:00')).date()
            
            result = ReportGeneratorService.generate_statistics_report(date_from, date_to)
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generando reporte estadístico: {str(e)}")
            return Response(
                {'detail': f'Error generando reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def agencies_performance(self, request):
        """
        Generar reporte de rendimiento de agencias
        POST /api/v1/reports/agencies_performance/
        Body: {
            "date_from": "2024-01-01",
            "date_to": "2024-12-31"
        }
        """
        from datetime import datetime
        
        date_from_str = request.data.get('date_from')
        date_to_str = request.data.get('date_to')
        
        if not date_from_str or not date_to_str:
            return Response(
                {'detail': 'date_from y date_to son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date_from = datetime.fromisoformat(date_from_str.replace('Z', '+00:00')).date()
            date_to = datetime.fromisoformat(date_to_str.replace('Z', '+00:00')).date()
            
            result = ReportGeneratorService.generate_agencies_performance(date_from, date_to)
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generando reporte de agencias: {str(e)}")
            return Response(
                {'detail': f'Error generando reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def destinations_report(self, request):
        """
        Generar reporte de distribución por destinos
        POST /api/v1/reports/destinations_report/
        Body: {
            "date_from": "2024-01-01",
            "date_to": "2024-12-31"
        }
        """
        from datetime import datetime
        
        date_from_str = request.data.get('date_from')
        date_to_str = request.data.get('date_to')
        
        if not date_from_str or not date_to_str:
            return Response(
                {'detail': 'date_from y date_to son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date_from = datetime.fromisoformat(date_from_str.replace('Z', '+00:00')).date()
            date_to = datetime.fromisoformat(date_to_str.replace('Z', '+00:00')).date()
            
            result = ReportGeneratorService.generate_destinations_report(date_from, date_to)
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generando reporte de destinos: {str(e)}")
            return Response(
                {'detail': f'Error generando reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def chart_data(self, request):
        """
        Obtener datos para gráficos del dashboard
        GET /api/v1/reports/chart_data/?days=30
        """
        from datetime import datetime, timedelta
        from apps.packages.models import Package
        from apps.logistics.models import Pull, Batch
        
        days = int(request.query_params.get('days', 30))
        date_to = datetime.now().date()
        date_from = date_to - timedelta(days=days)
        
        try:
            # Paquetes por día
            packages_by_day = []
            current_date = date_from
            while current_date <= date_to:
                count = Package.objects.filter(
                    created_at__date=current_date
                ).count()
                packages_by_day.append({
                    'date': current_date.isoformat(),
                    'count': count
                })
                current_date += timedelta(days=1)
            
            # Distribución por estado
            packages_by_status = []
            for status_code, status_name in Package.STATUS_CHOICES:
                count = Package.objects.filter(
                    created_at__date__gte=date_from,
                    created_at__date__lte=date_to,
                    status=status_code
                ).count()
                if count > 0:
                    packages_by_status.append({
                        'name': status_name,
                        'value': count
                    })
            
            # Top agencias
            from apps.catalog.models import TransportAgency
            from django.db.models import Count, Q
            
            top_agencies = []
            for agency in TransportAgency.objects.filter(active=True)[:10]:
                count = Package.objects.filter(
                    Q(transport_agency=agency) |
                    Q(pull__transport_agency=agency) |
                    Q(pull__batch__transport_agency=agency),
                    created_at__date__gte=date_from,
                    created_at__date__lte=date_to
                ).count()
                if count > 0:
                    top_agencies.append({
                        'name': agency.name,
                        'value': count
                    })
            
            top_agencies = sorted(top_agencies, key=lambda x: x['value'], reverse=True)[:10]
            
            # Top destinos
            top_destinations = list(Package.objects.filter(
                created_at__date__gte=date_from,
                created_at__date__lte=date_to
            ).values('city').annotate(
                value=Count('id')
            ).order_by('-value')[:10])
            
            for dest in top_destinations:
                dest['name'] = dest.pop('city')
            
            return Response({
                'period': {'from': date_from.isoformat(), 'to': date_to.isoformat()},
                'packages_by_day': packages_by_day,
                'packages_by_status': packages_by_status,
                'top_agencies': top_agencies,
                'top_destinations': top_destinations,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error obteniendo datos de gráficos: {str(e)}")
            return Response(
                {'detail': f'Error obteniendo datos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='generate-daily-dispatch')
    def generate_daily_dispatch(self, request):
        """
        Genera reporte diario de despachos (EN_BODEGA → EN_TRANSITO)
        
        Body params:
            - report_date: Fecha del reporte (formato: YYYY-MM-DD)
        
        Returns:
            Report: Reporte generado
        """
        try:
            report_date_str = request.data.get('report_date')
            if not report_date_str:
                return Response(
                    {'error': 'Debe proporcionar una fecha (report_date)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            report_date = datetime.strptime(report_date_str, '%Y-%m-%d').date()
            
            # Verificar si ya existe
            existing = Report.objects.filter(
                report_type='DAILY_DISPATCH',
                report_date=report_date
            ).first()
            
            if existing:
                return Response({
                    'message': 'Ya existe un reporte de despachos para esta fecha',
                    'report': ReportSerializer(existing).data
                }, status=status.HTTP_200_OK)
            
            # Generar reporte
            report = DailyReportService.generate_dispatch_report(
                report_date,
                user=request.user
            )
            
            # Generar archivos PDF y Excel en background
            generate_report_files.delay(str(report.id))
            
            logger.info(f"Reporte de despachos generado para {report_date} por {request.user}")
            
            return Response({
                'message': 'Reporte de despachos generado exitosamente',
                'report': ReportSerializer(report).data
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response(
                {'error': f'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error generando reporte de despachos: {str(e)}")
            return Response(
                {'error': f'Error al generar reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='generate-daily-reception')
    def generate_daily_reception(self, request):
        """
        Genera reporte diario de recepciones (NO_RECEPTADO → EN_BODEGA)
        
        Body params:
            - report_date: Fecha del reporte (formato: YYYY-MM-DD)
        
        Returns:
            Report: Reporte generado
        """
        try:
            report_date_str = request.data.get('report_date')
            if not report_date_str:
                return Response(
                    {'error': 'Debe proporcionar una fecha (report_date)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            report_date = datetime.strptime(report_date_str, '%Y-%m-%d').date()
            
            # Verificar si ya existe
            existing = Report.objects.filter(
                report_type='DAILY_RECEPTION',
                report_date=report_date
            ).first()
            
            if existing:
                return Response({
                    'message': 'Ya existe un reporte de recepciones para esta fecha',
                    'report': ReportSerializer(existing).data
                }, status=status.HTTP_200_OK)
            
            # Generar reporte
            report = DailyReportService.generate_reception_report(
                report_date,
                user=request.user
            )
            
            # Generar archivos PDF y Excel en background
            generate_report_files.delay(str(report.id))
            
            logger.info(f"Reporte de recepciones generado para {report_date} por {request.user}")
            
            return Response({
                'message': 'Reporte de recepciones generado exitosamente',
                'report': ReportSerializer(report).data
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response(
                {'error': f'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error generando reporte de recepciones: {str(e)}")
            return Response(
                {'error': f'Error al generar reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReportDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para los detalles de informes.
    """
    
    queryset = ReportDetail.objects.all()
    serializer_class = ReportDetailSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['report', 'transport_agency', 'destination']
    ordering_fields = ['packages_count', 'sacas_count', 'lotes_count']
    ordering = ['-packages_count']
