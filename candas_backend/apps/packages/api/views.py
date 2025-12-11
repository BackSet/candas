"""
ViewSets para el módulo de Packages
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db import transaction
from django.http import HttpResponse
from datetime import datetime
from django.utils import timezone
from ..models import Package, PackageImport
from ..services import (
    PackageService, 
    PackageExportService, 
    PackageImporter,
    PackageManifestGenerator,
    PackageLabelsGenerator
)
from .serializers import (
    PackageListSerializer,
    PackageDetailSerializer,
    PackageCreateSerializer,
    PackageImportSerializer,
    ImportRequestSerializer,
)


class PackageViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Packages
    
    list: Listar todos los packages
    retrieve: Obtener un package específico
    create: Crear un nuevo package
    update: Actualizar un package completo
    partial_update: Actualizar campos específicos de un package
    destroy: Eliminar un package
    """
    queryset = Package.objects.all()
    permission_classes = [IsAuthenticated]
    search_fields = ['guide_number', 'nro_master', 'name', 'address', 'city']
    ordering_fields = ['created_at', 'updated_at', 'guide_number', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Usar serializer diferente según la acción"""
        match self.action:
            case 'list':
                return PackageListSerializer
            case 'create':
                return PackageCreateSerializer
            case 'update' | 'partial_update':
                return PackageCreateSerializer
            case _:
                return PackageDetailSerializer
    
    def get_queryset(self):
        """Filtrar queryset según parámetros"""
        queryset = Package.objects.select_related(
            'pull',
            'pull__batch',
            'transport_agency',
            'delivery_agency',
            'parent'
        ).prefetch_related('children')
        
        # Filtro por status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtro por pull
        pull_id = self.request.query_params.get('pull', None)
        if pull_id:
            queryset = queryset.filter(pull_id=pull_id)
        
        # Filtro por ciudad
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Filtro por provincia
        province = self.request.query_params.get('province', None)
        if province:
            queryset = queryset.filter(province__icontains=province)
        
        # Filtro por tipo de envío
        if shipment_type := self.request.query_params.get('shipment_type', None):
            match shipment_type:
                case 'sin_envio':
                    # Paquetes sin ninguna asignación (sin pull y sin agencia)
                    queryset = queryset.filter(pull__isnull=True, transport_agency__isnull=True)
                case 'individual':
                    # Paquetes sin saca pero con agencia (envío individual)
                    queryset = queryset.filter(pull__isnull=True, transport_agency__isnull=False)
                case 'saca':
                    # Paquetes en saca pero no en lote
                    queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=True)
                case 'lote':
                    # Paquetes en lote (pull.batch no es null)
                    queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=False)
        
        # Filtro por agencia de transporte
        transport_agency = self.request.query_params.get('transport_agency', None)
        if transport_agency:
            queryset = queryset.filter(
                Q(transport_agency_id=transport_agency) |
                Q(pull__transport_agency_id=transport_agency) |
                Q(pull__batch__transport_agency_id=transport_agency)
            )
        
        # Filtro por padre (para obtener hijos de un paquete específico)
        parent_id = self.request.query_params.get('parent', None)
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        
        # Filtro para paquetes sin padre (raíz)
        parent_null = self.request.query_params.get('parent__isnull', None)
        if parent_null is not None:
            if parent_null.lower() in ('true', '1', 'yes'):
                queryset = queryset.filter(parent__isnull=True)
            elif parent_null.lower() in ('false', '0', 'no'):
                queryset = queryset.filter(parent__isnull=False)
        
        # Filtro para excluir IDs específicos - usar comprensión más eficiente
        if exclude_ids := self.request.query_params.get('exclude_ids', None):
            if ids_list := [id.strip() for id in exclude_ids.split(',') if id.strip()]:
                queryset = queryset.exclude(id__in=ids_list)
        
        # Filtro por jerarquía (Clementina): paquetes que tienen padre o tienen hijos
        has_hierarchy = self.request.query_params.get('has_hierarchy', None)
        if has_hierarchy and has_hierarchy.lower() in ('true', '1', 'yes'):
            # Paquetes que tienen parent (son hijos) O tienen children (son padres)
            # Usar Exists para verificar si tiene hijos
            from django.db.models import Exists, OuterRef
            has_children = Package.objects.filter(parent=OuterRef('pk'))
            queryset = queryset.filter(
                Q(parent__isnull=False) | Exists(has_children)
            ).distinct()
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def available_for_pull(self, request):
        """
        Listar paquetes disponibles para agregar a Pull
        GET /api/v1/packages/available_for_pull/
        """
        packages = Package.objects.filter(
            pull__isnull=True,
            status='EN_BODEGA'
        )
        
        # Aplicar filtros de búsqueda
        search = request.query_params.get('search', None)
        if search:
            packages = packages.filter(
                Q(guide_number__icontains=search) |
                Q(name__icontains=search) |
                Q(address__icontains=search)
            )
        
        page = self.paginate_queryset(packages)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(packages, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search_by_barcode(self, request):
        """
        Search package by guide_number (barcode)
        GET /api/v1/packages/search_by_barcode/?barcode=<code>
        """
        barcode = request.query_params.get('barcode', '').strip()
        
        if not barcode:
            return Response(
                {'error': 'Barcode parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            package = Package.objects.get(guide_number=barcode)
            serializer = PackageDetailSerializer(package)
            return Response(serializer.data)
        except Package.DoesNotExist:
            return Response(
                {'error': f'Paquete con codigo {barcode} no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def assign_to_pull(self, request, pk=None):
        """
        Asignar paquete a un Pull
        POST /api/v1/packages/{id}/assign_to_pull/
        Body: {"pull_id": "uuid"}
        """
        package = self.get_object()
        pull_id = request.data.get('pull_id')
        
        if not pull_id:
            return Response(
                {'error': 'pull_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.logistics.models import Pull
            pull = get_object_or_404(Pull, pk=pull_id)
            
            if package.pull:
                return Response(
                    {
                        'error': 'El paquete ya está asignado a otra saca',
                        'current_pull': {
                            'id': str(package.pull.id),
                            'common_destiny': package.pull.common_destiny,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            package.pull = pull
            package.save()
            
            serializer = PackageDetailSerializer(package, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Cambiar estado de un paquete
        POST /api/v1/packages/{id}/change_status/
        Body: {"status": "EN_TRANSITO"}
        """
        package = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = [choice[0] for choice in Package.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {
                    'error': 'Estado inválido',
                    'valid_statuses': valid_statuses
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.utils import timezone
            old_status = package.status
            package.status = new_status
            
            # Registrar en historial
            timestamp = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
            history_entry = f"[{timestamp}] {old_status} → {new_status}\n"
            package.status_history = history_entry + (package.status_history or '')
            
            package.save(update_fields=['status', 'status_history', 'updated_at'])
            serializer = PackageDetailSerializer(package, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Obtener estadísticas de packages
        GET /api/v1/packages/statistics/
        """
        from collections import Counter
        
        total = Package.objects.count()
        # Usar Counter para optimizar conteos
        status_counts = Counter(Package.objects.values_list('status', flat=True))
        
        by_status = {
            status_code: {
                'name': status_name,
                'count': status_counts.get(status_code, 0),
                'percentage': round((status_counts.get(status_code, 0) / total * 100), 2) if total > 0 else 0
            }
            for status_code, status_name in Package.STATUS_CHOICES
        }
        
        return Response({
            'total': total,
            'by_status': by_status,
        })
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """
        Exportar paquetes a Excel o PDF
        POST /api/v1/packages/export/
        Body: {
            "format": "excel" | "pdf",
            "columns": ["guide_number", "name", ...],
            "filters": {
                "status": ["EN_BODEGA", ...],
                "city": "Quito",
                "shipment_type": "individual" | "saca" | "lote",
                "transport_agency": "uuid",
                "date_from": "2024-01-01",
                "date_to": "2024-12-31",
                "search": "search term"
            },
            "scope": "all" | "page",
            "page_ids": ["uuid1", "uuid2", ...]
        }
        """
        # Parsear configuración del request
        export_format = request.data.get('format', 'excel')
        columns_config = request.data.get('columns', [])
        filters = request.data.get('filters', {})
        export_scope = request.data.get('scope', 'all')
        page_ids = request.data.get('page_ids', [])
        
        # Validar formato
        if export_format not in ['excel', 'pdf']:
            return Response(
                {'error': 'Formato inválido. Use "excel" o "pdf"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar columnas
        if not columns_config:
            return Response(
                {'error': 'Debe seleccionar al menos una columna'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Construir queryset base
            queryset = self.get_queryset()
            
            # Aplicar filtros personalizados
            if filters.get('status'):
                status_list = filters['status']
                if isinstance(status_list, list):
                    queryset = queryset.filter(status__in=status_list)
                else:
                    queryset = queryset.filter(status=status_list)
            
            if filters.get('city'):
                queryset = queryset.filter(city__icontains=filters['city'])
            
            if filters.get('province'):
                queryset = queryset.filter(province__icontains=filters['province'])
            
            # Filtrar por tipo de envío
            if shipment_type := filters.get('shipment_type'):
                match shipment_type:
                    case 'sin_envio':
                        # Paquetes sin ninguna asignación (sin pull y sin agencia)
                        queryset = queryset.filter(pull__isnull=True, transport_agency__isnull=True)
                    case 'individual':
                        # Paquetes sin saca pero con agencia (envío individual)
                        queryset = queryset.filter(pull__isnull=True, transport_agency__isnull=False)
                    case 'saca':
                        # Paquetes en saca pero no en lote
                        queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=True)
                    case 'lote':
                        # Paquetes en lote (pull.batch no es null)
                        queryset = queryset.filter(pull__isnull=False, pull__batch__isnull=False)
            
            # Filtrar por agencia de transporte
            if filters.get('transport_agency'):
                # Incluir paquetes con transport_agency directo o heredado
                from apps.logistics.models import Pull
                agency_id = filters['transport_agency']
                queryset = queryset.filter(
                    Q(transport_agency_id=agency_id) |
                    Q(pull__transport_agency_id=agency_id) |
                    Q(pull__batch__transport_agency_id=agency_id)
                )
            
            # Filtrar por rango de fechas
            if filters.get('date_from'):
                from datetime import datetime
                date_from = datetime.fromisoformat(filters['date_from'].replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__gte=date_from)
            
            if filters.get('date_to'):
                from datetime import datetime
                date_to = datetime.fromisoformat(filters['date_to'].replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__lte=date_to)
            
            # Filtro de búsqueda general
            if filters.get('search'):
                search_term = filters['search']
                queryset = queryset.filter(
                    Q(guide_number__icontains=search_term) |
                    Q(nro_master__icontains=search_term) |
                    Q(name__icontains=search_term) |
                    Q(address__icontains=search_term)
                )
            
            # Limitar a página actual si es necesario
            if export_scope == 'page' and page_ids:
                queryset = queryset.filter(id__in=page_ids)
            
            # Verificar que hay paquetes para exportar
            if not queryset.exists():
                return Response(
                    {'error': 'No hay paquetes que coincidan con los filtros'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Generar archivo según formato
            if export_format == 'excel':
                return PackageExportService.generate_excel(queryset, columns_config)
            else:
                return PackageExportService.generate_pdf(queryset, columns_config)
                
        except Exception as e:
            return Response(
                {'error': f'Error al exportar: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='download-import-template')
    def download_import_template(self, request):
        """
        Descarga plantilla Excel con campos seleccionados para importación
        
        Body params:
            - selected_fields: Lista de campos opcionales a incluir
            - field_order: Orden personalizado de campos (opcional)
        """
        try:
            selected_fields = request.data.get('selected_fields', [])
            field_order = request.data.get('field_order', None)
            
            # Validar que selected_fields sea una lista
            if not isinstance(selected_fields, list):
                return Response(
                    {'error': 'selected_fields debe ser una lista'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generar plantilla con orden personalizado
            return PackageImporter.generate_template(selected_fields, field_order)
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar plantilla: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='preview-import-file')
    def preview_import_file(self, request):
        """
        Previsualiza las columnas de un archivo sin importar
        
        Body params:
            - file: Archivo Excel o CSV
        
        Returns:
            - headers: Lista de encabezados del archivo
            - preview_rows: Primeras filas para previsualización
            - suggested_mapping: Mapeo sugerido automático
        """
        try:
            file = request.FILES.get('file')
            if not file:
                return Response(
                    {'error': 'Debe proporcionar un archivo'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Previsualizar columnas
            preview_data = PackageImporter.preview_file_columns(file)
            
            if 'error' in preview_data:
                return Response(
                    {'error': preview_data['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Sugerir mapeo automático basado en similitud de nombres
            suggested_mapping = {}
            available_fields = list(PackageImporter.FIELD_LABELS.keys())
            
            for idx, header in enumerate(preview_data['headers']):
                header_lower = header.lower().strip()
                
                # Buscar coincidencia exacta o similar
                for field, label in PackageImporter.FIELD_LABELS.items():
                    label_lower = label.lower().replace(' *', '').strip()
                    if header_lower == label_lower or header in label or label in header:
                        suggested_mapping[str(idx)] = field
                        break
            
            preview_data['suggested_mapping'] = suggested_mapping
            preview_data['available_fields'] = {
                field: PackageImporter.FIELD_LABELS[field]
                for field in available_fields
            }
            
            return Response(preview_data)
            
        except Exception as e:
            return Response(
                {'error': f'Error al previsualizar archivo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='import-packages')
    def import_packages(self, request):
        """
        Importa paquetes desde archivo Excel/CSV
        
        Body params:
            - file: Archivo Excel o CSV
            - selected_fields: Lista de campos opcionales a importar
            - column_mapping: Mapeo de columnas (opcional)
            - column_order: Orden de columnas (opcional)
            - field_order: Orden personalizado de campos (opcional)
        """
        try:
            # Obtener archivo y parámetros
            file = request.FILES.get('file')
            if not file:
                return Response(
                    {'error': 'Debe proporcionar un archivo'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            selected_fields = request.data.get('selected_fields', [])
            if isinstance(selected_fields, str):
                import json
                selected_fields = json.loads(selected_fields)
            
            column_mapping = request.data.get('column_mapping')
            if column_mapping and isinstance(column_mapping, str):
                import json
                column_mapping = json.loads(column_mapping)
            
            column_order = request.data.get('column_order')
            if column_order and isinstance(column_order, str):
                import json
                column_order = json.loads(column_order)
            
            field_order = request.data.get('field_order')
            if field_order and isinstance(field_order, str):
                import json
                field_order = json.loads(field_order)
            
            # Crear registro de importación
            import_record = PackageImport.objects.create(
                file=file,
                status='PROCESANDO'
            )
            
            # Ejecutar importación
            result = PackageImporter.import_packages(
                file,
                selected_fields,
                import_record.id,
                column_mapping,
                column_order,
                field_order
            )
            
            # Refrescar registro para obtener datos actualizados
            import_record.refresh_from_db()
            
            # Preparar respuesta con advertencias
            response_data = PackageImportSerializer(import_record).data
            if result.get('warnings'):
                response_data['warnings'] = result.get('warnings')
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED if result.get('success') else status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            return Response(
                {'error': f'Error al importar: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='import-history')
    def import_history(self, request):
        """
        Lista historial de importaciones de paquetes
        
        Query params:
            - limit: Número máximo de registros (default: 20)
        """
        try:
            limit = int(request.query_params.get('limit', 20))
            imports = PackageImport.objects.all()[:limit]
            
            serializer = PackageImportSerializer(imports, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Error al obtener historial: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='batch-update')
    def batch_update(self, request):
        """
        Actualiza un atributo en lote para múltiples paquetes
        
        Body params:
            - package_ids: Lista de IDs de paquetes
            - attribute: Atributo a cambiar (status, transport_agency, delivery_agency, notes, hashtags)
            - value: Nuevo valor para el atributo
        """
        from django.db import transaction
        from apps.catalog.models import TransportAgency, DeliveryAgency
        
        try:
            package_ids = request.data.get('package_ids', [])
            attribute = request.data.get('attribute')
            value = request.data.get('value')
            
            if not package_ids:
                return Response(
                    {'error': 'Debe proporcionar al menos un ID de paquete'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not attribute:
                return Response(
                    {'error': 'Debe especificar el atributo a cambiar'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que el atributo sea modificable
            allowed_attributes = ['status', 'transport_agency', 'delivery_agency', 'notes', 'hashtags']
            if attribute not in allowed_attributes:
                return Response(
                    {'error': f'Atributo no permitido. Opciones: {", ".join(allowed_attributes)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener paquetes
            packages = Package.objects.filter(id__in=package_ids)
            if packages.count() != len(package_ids):
                found_ids = set(str(p.id) for p in packages)
                missing_ids = [pid for pid in package_ids if pid not in found_ids]
                return Response(
                    {'error': f'Algunos paquetes no existen: {missing_ids}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            results = []
            errors = []
            
            with transaction.atomic():
                # Pre-calcular valid_statuses una vez
                valid_statuses = {choice[0] for choice in Package.STATUS_CHOICES}
                
                for package in packages:
                    try:
                        # Preparar el valor según el tipo de atributo usando match/case
                        match attribute:
                            case 'status':
                                # Validar estado
                                if value not in valid_statuses:
                                    errors.append({
                                        'package_id': str(package.id),
                                        'guide_number': package.guide_number,
                                        'error': f'Estado inválido: {value}'
                                    })
                                    continue
                                package.status = value
                                
                            case 'transport_agency':
                                if value:
                                    try:
                                        package.transport_agency = TransportAgency.objects.get(id=value, active=True)
                                    except TransportAgency.DoesNotExist:
                                        errors.append({
                                            'package_id': str(package.id),
                                            'guide_number': package.guide_number,
                                            'error': f'Agencia de transporte no encontrada: {value}'
                                        })
                                        continue
                                else:
                                    package.transport_agency = None
                                    
                            case 'delivery_agency':
                                if value:
                                    try:
                                        package.delivery_agency = DeliveryAgency.objects.get(id=value, active=True)
                                    except DeliveryAgency.DoesNotExist:
                                        errors.append({
                                            'package_id': str(package.id),
                                            'guide_number': package.guide_number,
                                            'error': f'Agencia de reparto no encontrada: {value}'
                                        })
                                        continue
                                else:
                                    package.delivery_agency = None
                                    
                            case 'notes':
                                package.notes = value or ''
                                
                            case 'hashtags':
                                package.hashtags = value or ''
                        
                        package.save()
                        results.append({
                            'package_id': str(package.id),
                            'guide_number': package.guide_number,
                            'success': True
                        })
                        
                    except Exception as e:
                        errors.append({
                            'package_id': str(package.id),
                            'guide_number': package.guide_number,
                            'error': str(e)
                        })
            
            return Response({
                'success': len(errors) == 0,
                'updated': len(results),
                'failed': len(errors),
                'results': results,
                'errors': errors
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al actualizar paquetes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def generate_manifest_pdf(self, request, pk=None):
        """
        Generar PDF con manifiesto del paquete individual.
        Incluye: información completa del paquete, destinatario, agencia, guía, estado, etc.
        
        GET /api/v1/packages/{id}/generate_manifest_pdf/
        """
        package = self.get_object()
        
        try:
            # Generar PDF
            pdf_buffer = PackageManifestGenerator.generate_pdf(package)
            
            # Nombre del archivo
            filename = f"manifiesto_paquete_{package.guide_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
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
        Generar Excel con manifiesto del paquete individual.
        Incluye: información completa del paquete, destinatario, agencia, guía, estado, etc.
        
        GET /api/v1/packages/{id}/generate_manifest_excel/
        """
        package = self.get_object()
        
        try:
            # Generar Excel
            excel_buffer = PackageManifestGenerator.generate_excel(package)
            
            # Nombre del archivo
            filename = f"manifiesto_paquete_{package.guide_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
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
        Generar PDF con etiqueta del paquete individual.
        Incluye: guía, destinatario, dirección completa, ciudad/provincia, agencia, código QR.
        
        GET /api/v1/packages/{id}/generate_label/
        """
        package = self.get_object()
        
        try:
            # Generar PDF con etiqueta
            pdf_buffer = PackageLabelsGenerator.generate_pdf(package)
            
            # Nombre del archivo
            filename = f"etiqueta_paquete_{package.guide_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # Retornar PDF
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar etiqueta: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='generate-shipping-label')
    def generate_shipping_label(self, request, pk=None):
        """
        Generar PDF con etiqueta de envío (formato de guía).
        Incluye: información de empresa, número de guía con código de barras,
        fecha, peso, dimensiones y datos del destinatario.
        
        GET /api/v1/packages/{id}/generate-shipping-label/
        """
        package = self.get_object()
        
        try:
            # Generar PDF con etiqueta de envío
            pdf_buffer = PackageLabelsGenerator.generate_shipping_label_pdf(package)
            
            # Nombre del archivo
            filename = f"guia_{package.guide_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # Retornar PDF
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar etiqueta de envío: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='create-child')
    def create_child(self, request, pk=None):
        """
        Crear un nuevo paquete hijo asociado al paquete padre.
        Si no se proporciona guide_number, se genera automáticamente con formato: {parent.guide_number}-H{N}
        
        POST /api/v1/packages/{id}/create-child/
        Body: {
            "guide_number": "opcional",
            "name": "requerido",
            "address": "requerido",
            "city": "requerido",
            "province": "requerido",
            "phone_number": "requerido",
            "status": "opcional (default: NO_RECEPTADO)",
            "nro_master": "opcional",
            "agency_guide_number": "opcional",
            "notes": "opcional",
            "hashtags": "opcional",
            "transport_agency": "opcional",
            "delivery_agency": "opcional"
        }
        """
        parent_package = self.get_object()
        
        try:
            # Extraer datos del request
            child_data = request.data.copy()
            
            # Si no se proporciona guide_number, generar automáticamente
            if not child_data.get('guide_number') or child_data.get('guide_number').strip() == '':
                # Generar nomenclatura: {parent.guide_number}-H{N}
                base_guide = parent_package.guide_number
                existing_children = Package.objects.filter(parent=parent_package)
                
                # Buscar el siguiente número disponible
                counter = 1
                while True:
                    new_guide = f"{base_guide}-H{counter}"
                    if not Package.objects.filter(guide_number=new_guide).exists():
                        child_data['guide_number'] = new_guide
                        break
                    counter += 1
                    # Protección contra bucles infinitos
                    if counter > 10000:
                        return Response(
                            {'error': 'No se pudo generar un número de guía único'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
            else:
                # Validar que el guide_number proporcionado no exista
                guide_number = child_data.get('guide_number').strip()
                if Package.objects.filter(guide_number=guide_number).exists():
                    return Response(
                        {'error': f'El número de guía {guide_number} ya existe'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Validar que se puede agregar como hijo (usando método del modelo)
            # Nota: El paquete hijo aún no existe, así que validamos después de crear
            
            # Asignar automáticamente el parent
            child_data['parent'] = str(parent_package.id)
            
            # Validar campos requeridos
            required_fields = ['name', 'address', 'city', 'province', 'phone_number']
            for field in required_fields:
                if not child_data.get(field) or child_data.get(field).strip() == '':
                    return Response(
                        {'error': f'El campo {field} es requerido'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Establecer valores por defecto
            if not child_data.get('status'):
                child_data['status'] = 'NO_RECEPTADO'
            
            # Usar el serializer para crear el paquete hijo
            serializer = PackageCreateSerializer(data=child_data)
            if serializer.is_valid():
                child_package = serializer.save()
                
                # Validar que se puede agregar como hijo (después de crear)
                can_add, error_message = parent_package.can_add_child(child_package)
                if not can_add:
                    # Si no se puede agregar, eliminar el paquete creado
                    child_package.delete()
                    return Response(
                        {'error': error_message},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Retornar el paquete creado con serializer de detalle
                detail_serializer = PackageDetailSerializer(child_package, context={'request': request})
                return Response(
                    {
                        'message': f'Paquete hijo creado exitosamente: {child_package.guide_number}',
                        'package': detail_serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': 'Error de validación', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error al crear paquete hijo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='migrate-code')
    def migrate_code(self, request, pk=None):
        """
        Migra un paquete a un nuevo código.
        Crea un nuevo paquete padre con el nuevo guide_number y convierte
        el paquete actual en hijo, preservando todos sus datos.
        
        POST /api/v1/packages/{id}/migrate-code/
        Body: {"new_guide_number": "ECA1234567890"}
        """
        package = self.get_object()
        new_guide_number = request.data.get('new_guide_number', '').strip()
        
        if not new_guide_number:
            return Response(
                {'error': 'new_guide_number es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que el nuevo código no exista
        if Package.objects.filter(guide_number=new_guide_number).exists():
            return Response(
                {'error': f'El número de guía {new_guide_number} ya existe'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que el paquete no tenga hijos (usando método del modelo)
        if package.is_parent():
            return Response(
                {'error': 'No se puede migrar un paquete que tiene hijos. Primero migre o remueva los hijos.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                old_guide = package.guide_number
                timestamp = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
                
                # 1. Registrar el cambio en guide_history del paquete original
                history_entry = f"[{timestamp}] Migrado de {old_guide} a {new_guide_number}\n"
                if package.guide_history:
                    package.guide_history = history_entry + package.guide_history
                else:
                    package.guide_history = history_entry
                
                # 2. Crear nuevo paquete padre con el nuevo guide_number
                # Copiar todos los datos del paquete original
                new_parent = Package.objects.create(
                    guide_number=new_guide_number,
                    nro_master=package.nro_master,
                    agency_guide_number=package.agency_guide_number,
                    name=package.name,
                    address=package.address,
                    city=package.city,
                    province=package.province,
                    phone_number=package.phone_number,
                    status=package.status,
                    notes=package.notes,
                    hashtags=package.hashtags,
                    transport_agency=package.transport_agency,
                    delivery_agency=package.delivery_agency,
                    pull=package.pull,
                    parent=None,  # El nuevo paquete no tiene padre
                    # Preservar historiales
                    guide_history=f"[{timestamp}] Creado como migración de {old_guide}\n",
                    status_history=package.status_history,
                    notes_history=package.notes_history,
                )
                
                # 3. Convertir el paquete original en hijo del nuevo
                package.parent = new_parent
                package.save(update_fields=['parent', 'guide_history', 'updated_at'])
                
                # Serializar ambos paquetes para la respuesta
                parent_serializer = PackageDetailSerializer(new_parent, context={'request': request})
                child_serializer = PackageDetailSerializer(package, context={'request': request})
                
                return Response({
                    'message': f'Paquete migrado exitosamente: {old_guide} → {new_guide_number}',
                    'new_parent': parent_serializer.data,
                    'old_package': child_serializer.data
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {'error': f'Error al migrar paquete: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='associate-children')
    def associate_children(self, request, pk=None):
        """
        Asociar paquetes existentes como hijos de este paquete padre.
        Usa los métodos del modelo para validar antes de asociar.
        
        POST /api/v1/packages/{id}/associate-children/
        Body: {"child_ids": ["uuid1", "uuid2", ...]}
        """
        parent_package = self.get_object()
        child_ids = request.data.get('child_ids', [])
        
        if not child_ids:
            return Response(
                {'error': 'child_ids es requerido y debe ser una lista'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(child_ids, list):
            return Response(
                {'error': 'child_ids debe ser una lista'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        errors = []
        
        try:
            with transaction.atomic():
                for child_id in child_ids:
                    try:
                        child_package = Package.objects.get(id=child_id)
                        
                        # Validar que se puede agregar como hijo usando método del modelo
                        can_add, error_message = parent_package.can_add_child(child_package)
                        
                        if not can_add:
                            errors.append({
                                'child_id': str(child_id),
                                'guide_number': child_package.guide_number,
                                'error': error_message
                            })
                            continue
                        
                        # Asignar el padre
                        child_package.parent = parent_package
                        child_package.save(update_fields=['parent', 'updated_at'])
                        
                        results.append({
                            'child_id': str(child_id),
                            'guide_number': child_package.guide_number,
                            'success': True
                        })
                        
                    except Package.DoesNotExist:
                        errors.append({
                            'child_id': str(child_id),
                            'error': 'Paquete no encontrado'
                        })
                    except Exception as e:
                        errors.append({
                            'child_id': str(child_id),
                            'error': str(e)
                        })
            
            if errors and not results:
                # Si todos fallaron
                return Response(
                    {
                        'error': 'No se pudo asociar ningún paquete',
                        'errors': errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'success': len(errors) == 0,
                'associated': len(results),
                'failed': len(errors),
                'results': results,
                'errors': errors
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error al asociar hijos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PackageImportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para PackageImport
    """
    queryset = PackageImport.objects.all()
    serializer_class = PackageImportSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-created_at']

