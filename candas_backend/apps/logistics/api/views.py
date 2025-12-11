"""
ViewSets para el módulo de Logistics
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import FileResponse, HttpResponse
from datetime import datetime
from ..models import Pull, Batch, Dispatch
from ..services import PullService, PDFService, QRService, BatchManifestGenerator, BatchLabelsGenerator
from .serializers import (
    PullListSerializer,
    PullDetailSerializer,
    PullCreateSerializer,
    PullBulkCreateSerializer,
    BatchSerializer,
    BatchListSerializer,
    BatchDetailSerializer,
    BatchCreateSerializer,
    BatchWithPullsCreateSerializer,
    BatchAutoDistributeSerializer,
    DispatchSerializer,
)


class PullViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Pulls
    """
    queryset = Pull.objects.select_related(
        'transport_agency',
        'batch'
    ).prefetch_related('packages')
    permission_classes = [IsAuthenticated]
    search_fields = ['common_destiny', 'guide_number']
    ordering_fields = ['created_at', 'updated_at', 'common_destiny']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PullListSerializer
        elif self.action == 'create':
            return PullCreateSerializer
        return PullDetailSerializer
    
    def get_queryset(self):
        """Filtrar queryset"""
        queryset = Pull.objects.all()
        
        # Filtro por batch
        batch_id = self.request.query_params.get('batch', None)
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        
        # Filtro por agencia
        agency_id = self.request.query_params.get('agency', None)
        if agency_id:
            queryset = queryset.filter(transport_agency_id=agency_id)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def add_packages(self, request, pk=None):
        """
        Agregar paquetes a un Pull
        POST /api/v1/pulls/{id}/add_packages/
        Body: {"package_ids": ["uuid1", "uuid2", ...]}
        """
        pull = self.get_object()
        package_ids = request.data.get('package_ids', [])
        
        if not package_ids:
            return Response(
                {'error': 'package_ids es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.packages.models import Package
            packages = Package.objects.filter(id__in=package_ids, pull__isnull=True)
            
            if packages.count() != len(package_ids):
                return Response(
                    {'error': 'Algunos paquetes no están disponibles'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Asignar paquetes
            packages.update(pull=pull)
            
            pull.refresh_from_db()
            serializer = PullDetailSerializer(pull, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_packages(self, request, pk=None):
        """
        Remover paquetes de un Pull
        POST /api/v1/pulls/{id}/remove_packages/
        Body: {"package_ids": ["uuid1", "uuid2", ...]}
        """
        pull = self.get_object()
        package_ids = request.data.get('package_ids', [])
        
        if not package_ids:
            return Response(
                {'error': 'package_ids es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.packages.models import Package
        packages = Package.objects.filter(id__in=package_ids, pull=pull)
        packages.update(pull=None)
        
        pull.refresh_from_db()
        serializer = PullDetailSerializer(pull, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='change-packages-status')
    def change_packages_status(self, request, pk=None):
        """
        Cambiar el estado de todos los paquetes de una saca.
        POST /api/v1/pulls/{id}/change-packages-status/
        Body: {"status": "EN_TRANSITO"}
        """
        pull = self.get_object()
        new_status = request.data.get('status', '').strip()
        
        if not new_status:
            return Response(
                {'error': 'El campo status es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que el estado sea válido
        from apps.packages.models import Package
        valid_statuses = [choice[0] for choice in Package.STATUS_CHOICES]
        
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Estado inválido. Estados válidos: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Obtener todos los paquetes de la saca
            packages = Package.objects.filter(pull=pull)
            total_packages = packages.count()
            
            if total_packages == 0:
                return Response(
                    {'error': 'La saca no tiene paquetes asociados'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Cambiar el estado de todos los paquetes
            # Usamos un loop para que se disparen los signals/save de cada paquete
            updated_count = 0
            for package in packages:
                if package.status != new_status:
                    package.status = new_status
                    package.save()
                    updated_count += 1
            
            return Response({
                'message': f'Estado actualizado a {new_status}',
                'total_packages': total_packages,
                'updated_count': updated_count,
                'already_in_status': total_packages - updated_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al actualizar estados: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """
        Obtener estadísticas de un Pull
        GET /api/v1/pulls/{id}/statistics/
        """
        pull = self.get_object()
        stats = PullService.get_pull_statistics(pull)
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def generate_barcode(self, request, pk=None):
        """
        Generar código de barras para un Pull
        POST /api/v1/pulls/{id}/generate_barcode/
        """
        pull = self.get_object()
        try:
            PullService.create_barcode(pull)
            pull.refresh_from_db()
            serializer = PullDetailSerializer(pull, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Crear múltiples sacas con el mismo destino
        POST /api/v1/pulls/bulk_create/
        Body: {
            "common_destiny": "CIUDAD - DESTINO",
            "transport_agency": "uuid",
            "guide_number": "GUIA-001",
            "pulls": [
                {"size": "PEQUENO", "package_ids": ["uuid1", "uuid2"]},
                {"size": "MEDIANO", "package_ids": ["uuid3", "uuid4"]}
            ]
        }
        """
        serializer = PullBulkCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            created_pulls = serializer.save()
            
            # Serializar las sacas creadas
            pulls_data = PullListSerializer(
                created_pulls,
                many=True,
                context={'request': request}
            ).data
            
            return Response({
                'message': f'{len(created_pulls)} saca(s) creada(s) exitosamente',
                'pulls': pulls_data,
                'count': len(created_pulls)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def generate_manifest(self, request, pk=None):
        """
        Generar PDF con manifiesto de paquetes
        GET /api/v1/pulls/{id}/generate_manifest/
        """
        pull = self.get_object()
        
        try:
            # Generar PDF
            pdf_buffer = PDFService.generate_pull_manifest(pull)
            
            # Nombre del archivo
            filename = f"manifiesto_saca_{pull.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # Retornar PDF
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar manifiesto: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def generate_manifest_excel(self, request, pk=None):
        """
        Generar Excel con manifiesto de la saca.
        GET /api/v1/pulls/{id}/generate_manifest_excel/
        """
        pull = self.get_object()
        
        try:
            # Generar Excel
            excel_buffer = PDFService.generate_pull_manifest_excel(pull)
            
            # Nombre del archivo
            filename = f"manifiesto_saca_{pull.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            # Retornar Excel
            response = HttpResponse(
                excel_buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar manifiesto Excel: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def generate_label(self, request, pk=None):
        """
        Generar PDF con etiqueta de saca (1/3 de hoja A4)
        GET /api/v1/pulls/{id}/generate_label/
        """
        pull = self.get_object()
        
        try:
            # Generar PDF
            pdf_buffer = PDFService.generate_pull_label(pull)
            
            # Nombre del archivo
            filename = f"etiqueta_saca_{pull.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # Retornar PDF
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar etiqueta: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def qr_code(self, request, pk=None):
        """
        Generar código QR en base64
        GET /api/v1/pulls/{id}/qr_code/
        """
        pull = self.get_object()
        
        try:
            # Generar QR en base64
            qr_base64 = QRService.generate_pull_qr_base64(pull)
            
            return Response({
                'qr_code': qr_base64,
                'pull_id': str(pull.id),
                'common_destiny': pull.common_destiny
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar código QR: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BatchViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Batches
    """
    queryset = Batch.objects.select_related('transport_agency').prefetch_related('pulls')
    permission_classes = [IsAuthenticated]
    search_fields = ['destiny', 'guide_number']
    ordering_fields = ['created_at', 'destiny']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Usar serializer diferente según la acción"""
        if self.action == 'list':
            return BatchListSerializer
        elif self.action == 'retrieve':
            return BatchDetailSerializer
        elif self.action == 'create':
            return BatchCreateSerializer
        return BatchSerializer
    
    def get_queryset(self):
        """Filtrar queryset según parámetros"""
        queryset = Batch.objects.select_related('transport_agency').prefetch_related('pulls')
        
        # Filtro por agencia
        agency_id = self.request.query_params.get('transport_agency', None)
        if agency_id:
            queryset = queryset.filter(transport_agency_id=agency_id)
        
        # Filtro por destino
        destiny = self.request.query_params.get('destiny', None)
        if destiny:
            queryset = queryset.filter(destiny__icontains=destiny)
        
        # Búsqueda general
        search = self.request.query_params.get('search', None)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(destiny__icontains=search) |
                Q(guide_number__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def create_with_pulls(self, request):
        """
        Crear lote y múltiples sacas en una operación
        POST /api/v1/batches/create_with_pulls/
        Body: {
            "destiny": "CIUDAD",
            "transport_agency": "uuid",
            "guide_number": "LOTE-001",
            "pulls": [
                {"size": "PEQUENO", "package_ids": [...]},
                {"size": "MEDIANO", "package_ids": [...]}
            ]
        }
        """
        serializer = BatchWithPullsCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            batch = serializer.save()
            
            # Serializar el batch creado
            batch_data = BatchSerializer(batch, context={'request': request}).data
            
            # Agregar información de las sacas creadas
            pulls_data = PullListSerializer(
                batch.created_pulls,
                many=True,
                context={'request': request}
            ).data
            
            return Response({
                'message': f'Lote creado con {len(batch.created_pulls)} saca(s)',
                'batch': batch_data,
                'pulls': pulls_data,
                'pulls_count': len(batch.created_pulls)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def auto_distribute(self, request):
        """
        Crear lote y distribuir paquetes automáticamente
        POST /api/v1/batches/auto_distribute/
        Body: {
            "destiny": "CIUDAD",
            "transport_agency": "uuid",
            "guide_number": "LOTE-001",
            "package_ids": ["uuid1", "uuid2", ...],
            "pulls_config": [
                {"size": "PEQUENO", "max_packages": 10},
                {"size": "MEDIANO", "max_packages": 20}
            ]
        }
        """
        serializer = BatchAutoDistributeSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            batch = serializer.save()
            
            # Serializar el batch creado
            batch_data = BatchSerializer(batch, context={'request': request}).data
            
            # Agregar información de las sacas creadas
            pulls_data = PullListSerializer(
                batch.created_pulls,
                many=True,
                context={'request': request}
            ).data
            
            return Response({
                'message': f'Lote creado con {len(batch.created_pulls)} saca(s)',
                'batch': batch_data,
                'pulls': pulls_data,
                'pulls_count': len(batch.created_pulls),
                'distributed_packages': batch.distributed_packages,
                'total_packages': len(request.data.get('package_ids', []))
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def packages_summary(self, request, pk=None):
        """
        Obtener resumen de paquetes del lote agrupados por estado
        GET /api/v1/batches/{id}/packages_summary/
        """
        batch = self.get_object()
        
        from apps.packages.models import Package
        packages = Package.objects.filter(pull__batch=batch)
        
        # Resumen por estado
        status_summary = {}
        for status_code, status_name in Package.STATUS_CHOICES:
            count = packages.filter(status=status_code).count()
            status_summary[status_code] = {
                'name': status_name,
                'count': count
            }
        
        return Response({
            'batch_id': str(batch.id),
            'total_packages': packages.count(),
            'total_pulls': batch.pulls.count(),
            'status_summary': status_summary
        })
    
    @action(detail=True, methods=['post'], url_path='change-packages-status')
    def change_packages_status(self, request, pk=None):
        """
        Cambiar el estado de todos los paquetes de un lote (todas las sacas).
        POST /api/v1/batches/{id}/change-packages-status/
        Body: {"status": "EN_TRANSITO"}
        """
        batch = self.get_object()
        new_status = request.data.get('status', '').strip()
        
        if not new_status:
            return Response(
                {'error': 'El campo status es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que el estado sea válido
        from apps.packages.models import Package
        valid_statuses = [choice[0] for choice in Package.STATUS_CHOICES]
        
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Estado inválido. Estados válidos: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Obtener todos los paquetes de todas las sacas del lote
            packages = Package.objects.filter(pull__batch=batch)
            total_packages = packages.count()
            
            if total_packages == 0:
                return Response(
                    {'error': 'El lote no tiene paquetes asociados'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Cambiar el estado de todos los paquetes
            # Usamos un loop para que se disparen los signals/save de cada paquete
            updated_count = 0
            for package in packages:
                if package.status != new_status:
                    package.status = new_status
                    package.save()
                    updated_count += 1
            
            return Response({
                'message': f'Estado actualizado a {new_status}',
                'total_packages': total_packages,
                'updated_count': updated_count,
                'already_in_status': total_packages - updated_count,
                'pulls_affected': batch.pulls.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al actualizar estados: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def add_pull(self, request, pk=None):
        """
        Agregar saca existente al lote
        POST /api/v1/batches/{id}/add_pull/
        Body: {"pull_id": "uuid"}
        """
        batch = self.get_object()
        pull_id = request.data.get('pull_id')
        
        if not pull_id:
            return Response(
                {'error': 'pull_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            pull = get_object_or_404(Pull, pk=pull_id)
            
            # Validar que la saca no esté en otro lote
            if pull.batch and pull.batch.id != batch.id:
                return Response(
                    {'error': f'La saca ya pertenece al lote {pull.batch.id}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que el destino coincida
            if pull.common_destiny != batch.destiny:
                return Response(
                    {'error': f'El destino de la saca ({pull.common_destiny}) no coincide con el destino del lote ({batch.destiny})'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Asignar al lote
            pull.batch = batch
            pull.save()
            
            batch.refresh_from_db()
            serializer = BatchDetailSerializer(batch, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Pull.DoesNotExist:
            return Response(
                {'error': 'Saca no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_pull(self, request, pk=None):
        """
        Quitar saca del lote
        POST /api/v1/batches/{id}/remove_pull/
        Body: {"pull_id": "uuid"}
        """
        batch = self.get_object()
        pull_id = request.data.get('pull_id')
        
        if not pull_id:
            return Response(
                {'error': 'pull_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            pull = get_object_or_404(Pull, pk=pull_id, batch=batch)
            pull.batch = None
            pull.save()
            
            batch.refresh_from_db()
            serializer = BatchDetailSerializer(batch, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Pull.DoesNotExist:
            return Response(
                {'error': 'Saca no encontrada en este lote'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """
        Exportar lista de lotes a Excel
        POST /api/v1/batches/export/
        Body: {"format": "excel"}
        """
        export_format = request.data.get('format', 'excel')
        queryset = self.get_queryset()
        
        from openpyxl import Workbook
        from io import BytesIO
        
        wb = Workbook()
        ws = wb.active
        ws.title = "Lotes"
        
        # Headers
        headers = ['ID', 'Destino', 'Agencia', 'Nº Guía', 'Sacas', 'Paquetes', 'Fecha Creación']
        ws.append(headers)
        
        # Datos
        for batch in queryset:
            ws.append([
                str(batch.id)[:8],
                batch.destiny,
                batch.transport_agency.name if batch.transport_agency else 'N/A',
                batch.guide_number or '',
                batch.pulls.count(),
                batch.get_total_packages(),
                batch.created_at.strftime('%Y-%m-%d %H:%M'),
            ])
        
        # Auto-ajustar columnas
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if cell.value:
                        max_length = max(max_length, len(str(cell.value)))
                except:
                    pass
            ws.column_dimensions[column_letter].width = min(max_length + 2, 50)
        
        # Respuesta
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"lotes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    @action(detail=True, methods=['get'])
    def generate_manifest_pdf(self, request, pk=None):
        """
        Generar PDF con manifiesto del lote.
        Incluye: info del lote, lista de sacas con totales, y lista básica de paquetes.
        
        GET /api/v1/batches/{id}/generate_manifest_pdf/
        """
        batch = self.get_object()
        
        try:
            # Generar PDF
            pdf_buffer = BatchManifestGenerator.generate_pdf(batch)
            
            # Nombre del archivo
            filename = f"manifiesto_lote_{str(batch.id)[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # Retornar PDF
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar manifiesto PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def generate_manifest_excel(self, request, pk=None):
        """
        Generar Excel con manifiesto del lote.
        Incluye: info del lote, lista de sacas con totales, y lista básica de paquetes.
        
        GET /api/v1/batches/{id}/generate_manifest_excel/
        """
        batch = self.get_object()
        
        try:
            # Generar Excel
            excel_buffer = BatchManifestGenerator.generate_excel(batch)
            
            # Nombre del archivo
            filename = f"manifiesto_lote_{str(batch.id)[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            # Retornar Excel
            response = HttpResponse(
                excel_buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar manifiesto Excel: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def generate_labels(self, request, pk=None):
        """
        Generar PDF con etiquetas de todas las sacas del lote.
        4 etiquetas por página (2x2).
        Cada etiqueta incluye: número de saca (1/5, 2/5...), destino, agencia, 
        guía, cantidad de paquetes y código QR.
        
        GET /api/v1/batches/{id}/generate_labels/
        """
        batch = self.get_object()
        
        try:
            # Generar PDF con etiquetas
            pdf_buffer = BatchLabelsGenerator.generate_pdf(batch)
            
            # Nombre del archivo
            filename = f"etiquetas_lote_{str(batch.id)[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # Retornar PDF
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar etiquetas: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DispatchViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Dispatches
    """
    serializer_class = DispatchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna el queryset de despachos ordenado"""
        return Dispatch.objects.prefetch_related('pulls', 'packages').order_by('-dispatch_date', '-created_at')

