"""
ViewSets para el módulo de Catalog
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from ..models import Location, TransportAgency, DeliveryAgency
from .serializers import (
    LocationSerializer,
    TransportAgencySerializer,
    TransportAgencyListSerializer,
    TransportAgencyDetailSerializer,
    TransportAgencyCreateSerializer,
    DeliveryAgencySerializer,
)


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Locations
    """
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['city', 'province']
    ordering = ['province', 'city']


class TransportAgencyViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar TransportAgencies
    """
    queryset = TransportAgency.objects.all()
    permission_classes = [IsAuthenticated]
    search_fields = ['name', 'phone_number', 'email', 'contact_person']
    ordering_fields = ['name', 'date_registration', 'active']
    ordering = ['name']
    
    def get_serializer_class(self):
        """Usar serializer diferente según la acción"""
        if self.action == 'list':
            return TransportAgencyListSerializer
        elif self.action == 'retrieve':
            return TransportAgencyDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TransportAgencyCreateSerializer
        return TransportAgencySerializer
    
    def get_queryset(self):
        """Filtrar queryset según parámetros"""
        queryset = TransportAgency.objects.all()
        
        # Filtro por activas
        active_filter = self.request.query_params.get('active', None)
        if active_filter is not None:
            queryset = queryset.filter(active=active_filter.lower() == 'true')
        
        # Búsqueda general
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(email__icontains=search) |
                Q(contact_person__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """
        Obtener estadísticas detalladas de la agencia
        GET /api/v1/transport-agencies/{id}/statistics/
        """
        agency = self.get_object()
        
        from apps.packages.models import Package
        from apps.logistics.models import Pull, Batch
        
        # Paquetes por estado
        packages_by_status = {}
        for status_code, status_name in Package.STATUS_CHOICES:
            count = Package.objects.filter(
                Q(transport_agency=agency) |
                Q(pull__transport_agency=agency) |
                Q(pull__batch__transport_agency=agency)
            ).filter(status=status_code).count()
            
            packages_by_status[status_code] = {
                'name': status_name,
                'count': count
            }
        
        # Estadísticas generales
        stats = {
            'total_packages': agency.get_total_packages(),
            'total_pulls': agency.get_total_pulls(),
            'total_batches': agency.get_total_batches(),
            'packages_by_status': packages_by_status,
            'active_pulls': Pull.objects.filter(transport_agency=agency).count(),
            'active_batches': Batch.objects.filter(transport_agency=agency).count(),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def shipments(self, request, pk=None):
        """
        Listar envíos de la agencia (paquetes, sacas, lotes)
        GET /api/v1/transport-agencies/{id}/shipments/?type=packages|pulls|batches
        """
        agency = self.get_object()
        shipment_type = request.query_params.get('type', 'packages')
        
        from apps.packages.models import Package
        from apps.packages.api.serializers import PackageListSerializer
        from apps.logistics.models import Pull, Batch
        from apps.logistics.api.serializers import PullListSerializer, BatchSerializer
        
        if shipment_type == 'packages':
            packages = Package.objects.filter(
                Q(transport_agency=agency) |
                Q(pull__transport_agency=agency) |
                Q(pull__batch__transport_agency=agency)
            ).order_by('-created_at')
            
            page = self.paginate_queryset(packages)
            if page is not None:
                serializer = PackageListSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = PackageListSerializer(packages, many=True)
            return Response(serializer.data)
        
        elif shipment_type == 'pulls':
            pulls = Pull.objects.filter(transport_agency=agency).order_by('-created_at')
            page = self.paginate_queryset(pulls)
            if page is not None:
                serializer = PullListSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = PullListSerializer(pulls, many=True)
            return Response(serializer.data)
        
        elif shipment_type == 'batches':
            batches = Batch.objects.filter(transport_agency=agency).order_by('-created_at')
            page = self.paginate_queryset(batches)
            if page is not None:
                serializer = BatchSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = BatchSerializer(batches, many=True)
            return Response(serializer.data)
        
        return Response({'error': 'Tipo de envío inválido'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """
        Exportar lista de agencias a Excel o PDF
        POST /api/v1/transport-agencies/export/
        Body: {"format": "excel" | "pdf", "active_only": true}
        """
        export_format = request.data.get('format', 'excel')
        active_only = request.data.get('active_only', False)
        
        queryset = self.get_queryset()
        if active_only:
            queryset = queryset.filter(active=True)
        
        # Usar el servicio de exportación de paquetes como base
        from apps.packages.services import PackageExportService
        
        if export_format == 'excel':
            # Implementar exportación de agencias (similar a paquetes)
            from openpyxl import Workbook
            from django.http import HttpResponse
            from io import BytesIO
            from datetime import datetime
            
            wb = Workbook()
            ws = wb.active
            ws.title = "Agencias de Transporte"
            
            # Headers
            headers = ['Nombre', 'Teléfono', 'Email', 'Dirección', 'Contacto', 'Estado', 'Total Paquetes', 'Total Sacas', 'Total Lotes']
            ws.append(headers)
            
            # Datos
            for agency in queryset:
                ws.append([
                    agency.name,
                    agency.phone_number,
                    agency.email or '',
                    agency.address or '',
                    agency.contact_person or '',
                    'Activa' if agency.active else 'Inactiva',
                    agency.get_total_packages(),
                    agency.get_total_pulls(),
                    agency.get_total_batches(),
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
            
            filename = f"agencias_transporte_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        return Response({'error': 'Formato no soportado'}, status=status.HTTP_400_BAD_REQUEST)


class DeliveryAgencyViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar DeliveryAgencies
    """
    queryset = DeliveryAgency.objects.select_related('location').all()
    serializer_class = DeliveryAgencySerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name', 'location__city']
    ordering = ['location__city', 'name']
    
    def get_queryset(self):
        """Filtrar por ubicación o activas si se solicita"""
        queryset = DeliveryAgency.objects.all()
        
        location_id = self.request.query_params.get('location', None)
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        
        active_only = self.request.query_params.get('active_only', None)
        if active_only == 'true':
            queryset = queryset.filter(active=True)
        
        return queryset

