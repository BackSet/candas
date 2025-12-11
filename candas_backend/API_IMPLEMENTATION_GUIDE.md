# 🚀 Guía de Implementación de API REST para Candas

## 📋 Índice
1. [Instalación y Configuración](#instalación-y-configuración)
2. [Estructura de APIs](#estructura-de-apis)
3. [Serializers](#serializers)
4. [ViewSets y Endpoints](#viewsets-y-endpoints)
5. [Autenticación y Permisos](#autenticación-y-permisos)
6. [Filtros y Búsqueda](#filtros-y-búsqueda)
7. [Paginación](#paginación)
8. [Documentación](#documentación)
9. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🔧 Instalación y Configuración

### Paso 1: Instalar Dependencias

```bash
pip install djangorestframework
pip install django-filter  # Para filtros avanzados
pip install drf-yasg  # Para documentación Swagger/OpenAPI
```

### Paso 2: Agregar a INSTALLED_APPS

**config/settings/base.py:**
```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'django_filters',
    'drf_yasg',  # Documentación API
    # ...
]
```

### Paso 3: Configurar REST Framework

**config/settings/base.py:**
```python
# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',  # Opcional
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',  # Solo en desarrollo
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
    'DATE_FORMAT': '%Y-%m-%d',
    'TIME_FORMAT': '%H:%M:%S',
}

# Solo en desarrollo
if DEBUG:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'].append(
        'rest_framework.renderers.BrowsableAPIRenderer'
    )
```

### Paso 4: Configurar URLs Globales

**config/urls.py:**
```python
from django.urls import path, include
from rest_framework import routers
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Schema para documentación
schema_view = get_schema_view(
    openapi.Info(
        title="Candas API",
        default_version='v1',
        description="API REST para el sistema de logística Candas",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@candas.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[rest_framework.permissions.AllowAny],
)

urlpatterns = [
    # URLs de la aplicación
    path('', include('apps.core.urls')),
    path('admin/', admin.site.urls),
    path('paquetes/', include('apps.packages.urls')),
    path('logistica/', include('apps.logistics.urls')),
    path('catalog/', include('apps.catalog.urls')),
    
    # APIs
    path('api/v1/', include('apps.packages.api.urls')),
    path('api/v1/', include('apps.logistics.api.urls')),
    path('api/v1/', include('apps.catalog.api.urls')),
    
    # Documentación API
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]
```

---

## 📁 Estructura de APIs

```
apps/
├── packages/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── filters.py
│   │   ├── permissions.py
│   │   └── urls.py
│
├── logistics/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── filters.py
│   │   ├── permissions.py
│   │   └── urls.py
│
└── catalog/
    ├── api/
    │   ├── __init__.py
    │   ├── serializers.py
    │   ├── views.py
    │   ├── filters.py
    │   └── urls.py
```

---

## 📝 Serializers

### 1. Packages API

**apps/packages/api/serializers.py:**
```python
from rest_framework import serializers
from ..models import Package, PackageImport
from apps.logistics.models import Pull
from apps.catalog.models import TransportAgency, DeliveryAgency


class PackageListSerializer(serializers.ModelSerializer):
    """Serializer para listar Packages (versión ligera)"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pull_info = serializers.SerializerMethodField()
    city_province = serializers.SerializerMethodField()
    
    class Meta:
        model = Package
        fields = [
            'id',
            'guide_number',
            'nro_master',
            'name',
            'city',
            'province',
            'city_province',
            'status',
            'status_display',
            'pull',
            'pull_info',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_pull_info(self, obj):
        """Información básica del Pull asociado"""
        if obj.pull:
            return {
                'id': str(obj.pull.id),
                'common_destiny': obj.pull.common_destiny,
                'status': obj.pull.status,
            }
        return None
    
    def get_city_province(self, obj):
        """Ciudad y provincia combinadas"""
        return f"{obj.city}, {obj.province}"


class PackageDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para Package"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pull_info = serializers.SerializerMethodField()
    transport_agency_info = serializers.SerializerMethodField()
    delivery_agency_info = serializers.SerializerMethodField()
    parent_info = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Package
        fields = [
            'id',
            'guide_number',
            'nro_master',
            'agency_guide_number',
            'name',
            'address',
            'city',
            'province',
            'phone_number',
            'status',
            'status_display',
            'notes',
            'hashtags',
            'pull',
            'pull_info',
            'transport_agency',
            'transport_agency_info',
            'delivery_agency',
            'delivery_agency_info',
            'parent',
            'parent_info',
            'children_count',
            'guide_history',
            'status_history',
            'notes_history',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'guide_history',
            'status_history',
            'notes_history',
            'created_at',
            'updated_at',
        ]
    
    def get_pull_info(self, obj):
        if obj.pull:
            return {
                'id': str(obj.pull.id),
                'common_destiny': obj.pull.common_destiny,
                'size': obj.pull.size,
                'status': obj.pull.status,
            }
        return None
    
    def get_transport_agency_info(self, obj):
        if obj.transport_agency:
            return {
                'id': str(obj.transport_agency.id),
                'name': obj.transport_agency.name,
            }
        return None
    
    def get_delivery_agency_info(self, obj):
        if obj.delivery_agency:
            return {
                'id': str(obj.delivery_agency.id),
                'name': obj.delivery_agency.name,
            }
        return None
    
    def get_parent_info(self, obj):
        if obj.parent:
            return {
                'id': str(obj.parent.id),
                'guide_number': obj.parent.guide_number,
                'name': obj.parent.name,
            }
        return None
    
    def get_children_count(self, obj):
        return obj.children.count()


class PackageCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Packages"""
    
    class Meta:
        model = Package
        fields = [
            'guide_number',
            'nro_master',
            'agency_guide_number',
            'name',
            'address',
            'city',
            'province',
            'phone_number',
            'status',
            'notes',
            'hashtags',
            'transport_agency',
            'delivery_agency',
            'parent',
        ]
    
    def validate_guide_number(self, value):
        """Validar que guide_number sea único"""
        if self.instance and self.instance.guide_number == value:
            return value
        
        if Package.objects.filter(guide_number=value).exists():
            raise serializers.ValidationError(
                "Este número de guía ya existe."
            )
        return value
    
    def validate_status(self, value):
        """Validar estado"""
        valid_statuses = [choice[0] for choice in Package.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Estado inválido. Opciones: {', '.join(valid_statuses)}"
            )
        return value


class PackageImportSerializer(serializers.ModelSerializer):
    """Serializer para PackageImport"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = PackageImport
        fields = [
            'id',
            'file',
            'status',
            'status_display',
            'total_rows',
            'successful_imports',
            'failed_imports',
            'success_rate',
            'error_log',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'total_rows',
            'successful_imports',
            'failed_imports',
            'error_log',
            'created_at',
            'updated_at',
        ]
    
    def get_success_rate(self, obj):
        """Calcular tasa de éxito"""
        if obj.total_rows > 0:
            return round((obj.successful_imports / obj.total_rows) * 100, 2)
        return 0
```

### 2. Logistics API

**apps/logistics/api/serializers.py:**
```python
from rest_framework import serializers
from ..models import Pull, Batch, Dispatch
from apps.packages.models import Package


class PullListSerializer(serializers.ModelSerializer):
    """Serializer para listar Pulls"""
    size_display = serializers.CharField(source='get_size_display', read_only=True)
    packages_count = serializers.SerializerMethodField()
    transport_agency_name = serializers.CharField(
        source='transport_agency.name',
        read_only=True
    )
    
    class Meta:
        model = Pull
        fields = [
            'id',
            'common_destiny',
            'size',
            'size_display',
            'status',
            'guide_number',
            'packages_count',
            'transport_agency',
            'transport_agency_name',
            'batch',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_packages_count(self, obj):
        """Contar paquetes en el Pull"""
        return obj.packages.count()


class PullDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para Pull"""
    size_display = serializers.CharField(source='get_size_display', read_only=True)
    packages_count = serializers.SerializerMethodField()
    packages = serializers.SerializerMethodField()
    transport_agency_info = serializers.SerializerMethodField()
    batch_info = serializers.SerializerMethodField()
    barcode_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Pull
        fields = [
            'id',
            'common_destiny',
            'size',
            'size_display',
            'status',
            'guide_number',
            'packages_count',
            'packages',
            'transport_agency',
            'transport_agency_info',
            'batch',
            'batch_info',
            'barcode_image',
            'barcode_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'barcode_image',
            'created_at',
            'updated_at',
        ]
    
    def get_packages_count(self, obj):
        return obj.packages.count()
    
    def get_packages(self, obj):
        """Lista de paquetes en el Pull"""
        from apps.packages.api.serializers import PackageListSerializer
        packages = obj.packages.all()[:50]  # Limitar a 50 para no sobrecargar
        return PackageListSerializer(packages, many=True).data
    
    def get_transport_agency_info(self, obj):
        if obj.transport_agency:
            return {
                'id': str(obj.transport_agency.id),
                'name': obj.transport_agency.name,
            }
        return None
    
    def get_batch_info(self, obj):
        if obj.batch:
            return {
                'id': str(obj.batch.id),
                'destiny': obj.batch.destiny,
                'pull_count': obj.batch.pulls.count(),
            }
        return None
    
    def get_barcode_url(self, obj):
        """URL del código de barras"""
        if obj.barcode_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.barcode_image.url)
        return None


class PullCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Pulls"""
    package_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text="Lista de IDs de paquetes a asociar"
    )
    
    class Meta:
        model = Pull
        fields = [
            'common_destiny',
            'size',
            'transport_agency',
            'guide_number',
            'batch',
            'package_ids',
        ]
    
    def validate_size(self, value):
        """Validar tamaño"""
        valid_sizes = [choice[0] for choice in Pull.SIZE_CHOICES]
        if value not in valid_sizes:
            raise serializers.ValidationError(
                f"Tamaño inválido. Opciones: {', '.join(valid_sizes)}"
            )
        return value
    
    def create(self, validated_data):
        """Crear Pull y asociar paquetes"""
        package_ids = validated_data.pop('package_ids', [])
        
        # Crear Pull
        pull = Pull.objects.create(**validated_data)
        
        # Asociar paquetes si se proporcionaron
        if package_ids:
            from ..services import PullService
            PullService.create_pull(
                common_destiny=pull.common_destiny,
                size=pull.size,
                package_ids=[str(pkg_id) for pkg_id in package_ids]
            )
            # Actualizar el pull creado
            pull.refresh_from_db()
        
        return pull


class BatchSerializer(serializers.ModelSerializer):
    """Serializer para Batch"""
    pulls_count = serializers.SerializerMethodField()
    total_packages = serializers.SerializerMethodField()
    transport_agency_name = serializers.CharField(
        source='transport_agency.name',
        read_only=True
    )
    
    class Meta:
        model = Batch
        fields = [
            'id',
            'destiny',
            'transport_agency',
            'transport_agency_name',
            'guide_base',
            'pulls_count',
            'total_packages',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_pulls_count(self, obj):
        return obj.pulls.count()
    
    def get_total_packages(self, obj):
        return obj.get_total_packages()


class DispatchSerializer(serializers.ModelSerializer):
    """Serializer para Dispatch"""
    packages_count = serializers.SerializerMethodField()
    transport_agency_name = serializers.CharField(
        source='transport_agency.name',
        read_only=True
    )
    
    class Meta:
        model = Dispatch
        fields = [
            'id',
            'transport_agency',
            'transport_agency_name',
            'packages_count',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_packages_count(self, obj):
        return obj.packages.count()
```

### 3. Catalog API

**apps/catalog/api/serializers.py:**
```python
from rest_framework import serializers
from ..models import Location, TransportAgency, DeliveryAgency


class LocationSerializer(serializers.ModelSerializer):
    """Serializer para Location"""
    
    class Meta:
        model = Location
        fields = [
            'id',
            'name',
            'city',
            'province',
            'postal_code',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransportAgencySerializer(serializers.ModelSerializer):
    """Serializer para TransportAgency"""
    coverage_locations = LocationSerializer(many=True, read_only=True)
    coverage_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TransportAgency
        fields = [
            'id',
            'name',
            'contact_name',
            'phone',
            'email',
            'active',
            'coverage',
            'coverage_locations',
            'coverage_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_coverage_count(self, obj):
        return obj.coverage.count()


class DeliveryAgencySerializer(serializers.ModelSerializer):
    """Serializer para DeliveryAgency"""
    location_info = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryAgency
        fields = [
            'id',
            'name',
            'location',
            'location_info',
            'contact_name',
            'phone',
            'email',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_location_info(self, obj):
        if obj.location:
            return LocationSerializer(obj.location).data
        return None
```

---

## 🎯 ViewSets y Endpoints

### 1. Packages ViewSet

**apps/packages/api/views.py:**
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from ..models import Package, PackageImport
from ..services import PackageService
from .serializers import (
    PackageListSerializer,
    PackageDetailSerializer,
    PackageCreateSerializer,
    PackageImportSerializer,
)
from .filters import PackageFilter
from .permissions import PackagePermission


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
    permission_classes = [IsAuthenticated, PackagePermission]
    filterset_class = PackageFilter
    search_fields = ['guide_number', 'nro_master', 'name', 'address', 'city']
    ordering_fields = ['created_at', 'updated_at', 'guide_number', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Usar serializer diferente según la acción"""
        if self.action == 'list':
            return PackageListSerializer
        elif self.action == 'create':
            return PackageCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PackageCreateSerializer
        return PackageDetailSerializer
    
    def get_queryset(self):
        """Filtrar queryset según parámetros"""
        queryset = Package.objects.select_related(
            'pull',
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
            PackageService.change_status(package, new_status)
            package.refresh_from_db()
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
        total = Package.objects.count()
        by_status = {}
        
        for status_code, status_name in Package.STATUS_CHOICES:
            count = Package.objects.filter(status=status_code).count()
            by_status[status_code] = {
                'name': status_name,
                'count': count,
                'percentage': round((count / total * 100), 2) if total > 0 else 0
            }
        
        return Response({
            'total': total,
            'by_status': by_status,
        })


class PackageImportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para PackageImport
    """
    queryset = PackageImport.objects.all()
    serializer_class = PackageImportSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-created_at']
```

### 2. Logistics ViewSet

**apps/logistics/api/views.py:**
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from ..models import Pull, Batch, Dispatch
from ..services import PullService
from .serializers import (
    PullListSerializer,
    PullDetailSerializer,
    PullCreateSerializer,
    BatchSerializer,
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
        
        # Filtro por status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
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


class BatchViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Batches
    """
    queryset = Batch.objects.select_related('transport_agency').prefetch_related('pulls')
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['destiny', 'guide_base']
    ordering = ['-created_at']


class DispatchViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Dispatches
    """
    queryset = Dispatch.objects.select_related('transport_agency').prefetch_related('packages')
    serializer_class = DispatchSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-created_at']
```

---

## 🔐 Autenticación y Permisos

### Permisos Personalizados

**apps/packages/api/permissions.py:**
```python
from rest_framework import permissions

class PackagePermission(permissions.BasePermission):
    """
    Permisos personalizados para Packages
    """
    
    def has_permission(self, request, view):
        """Permisos a nivel de vista"""
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.has_perm('packages.add_package')
    
    def has_object_permission(self, request, view, obj):
        """Permisos a nivel de objeto"""
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.has_perm('packages.change_package')
```

### Autenticación por Token (Opcional)

**apps/users/api/views.py:**
```python
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'username': user.username
        })
```

---

## 🔍 Filtros y Búsqueda

**apps/packages/api/filters.py:**
```python
import django_filters
from ..models import Package

class PackageFilter(django_filters.FilterSet):
    """Filtros para Package"""
    
    status = django_filters.ChoiceFilter(choices=Package.STATUS_CHOICES)
    city = django_filters.CharFilter(field_name='city', lookup_expr='icontains')
    province = django_filters.CharFilter(field_name='province', lookup_expr='icontains')
    has_pull = django_filters.BooleanFilter(field_name='pull', lookup_expr='isnull', exclude=True)
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Package
        fields = ['status', 'city', 'province', 'has_pull']
```

---

## 📄 URLs de API

**apps/packages/api/urls.py:**
```python
from rest_framework.routers import DefaultRouter
from .views import PackageViewSet, PackageImportViewSet

router = DefaultRouter()
router.register(r'packages', PackageViewSet, basename='package')
router.register(r'package-imports', PackageImportViewSet, basename='package-import')

urlpatterns = router.urls
```

**apps/logistics/api/urls.py:**
```python
from rest_framework.routers import DefaultRouter
from .views import PullViewSet, BatchViewSet, DispatchViewSet

router = DefaultRouter()
router.register(r'pulls', PullViewSet, basename='pull')
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'dispatches', DispatchViewSet, basename='dispatch')

urlpatterns = router.urls
```

---

## 📚 Documentación con Swagger

**config/urls.py:**
```python
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="Candas API",
        default_version='v1',
        description="API REST para el sistema de logística Candas",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@candas.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # ...
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
```

---

## 💡 Ejemplos de Uso

### 1. Listar Packages

```bash
# GET /api/v1/packages/
curl -X GET "http://localhost:8000/api/v1/packages/" \
  -H "Authorization: Token YOUR_TOKEN"

# Con filtros
curl -X GET "http://localhost:8000/api/v1/packages/?status=EN_BODEGA&city=Madrid" \
  -H "Authorization: Token YOUR_TOKEN"

# Con búsqueda
curl -X GET "http://localhost:8000/api/v1/packages/?search=GUIA-001" \
  -H "Authorization: Token YOUR_TOKEN"
```

### 2. Crear Package

```bash
curl -X POST "http://localhost:8000/api/v1/packages/" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "guide_number": "GUIA-001",
    "name": "Juan Pérez",
    "address": "Calle Principal 123",
    "city": "Madrid",
    "province": "Madrid",
    "phone_number": "+34 600 000 000",
    "status": "EN_BODEGA"
  }'
```

### 3. Asignar Package a Pull

```bash
curl -X POST "http://localhost:8000/api/v1/packages/{package_id}/assign_to_pull/" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pull_id": "pull-uuid-here"
  }'
```

### 4. Agregar Packages a Pull

```bash
curl -X POST "http://localhost:8000/api/v1/pulls/{pull_id}/add_packages/" \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_ids": ["uuid1", "uuid2", "uuid3"]
  }'
```

### 5. Obtener Estadísticas

```bash
curl -X GET "http://localhost:8000/api/v1/packages/statistics/" \
  -H "Authorization: Token YOUR_TOKEN"
```

---

## ✅ Checklist de Implementación

- [ ] Instalar dependencias (djangorestframework, django-filter, drf-yasg)
- [ ] Configurar REST_FRAMEWORK en settings
- [ ] Crear estructura de directorios `api/` en cada app
- [ ] Crear serializers para cada modelo
- [ ] Crear ViewSets con acciones personalizadas
- [ ] Configurar filtros y búsqueda
- [ ] Implementar permisos personalizados
- [ ] Configurar URLs de API
- [ ] Agregar documentación Swagger
- [ ] Escribir tests para APIs
- [ ] Documentar endpoints en README

---

**Versión**: 1.0  
**Fecha**: 2025  
**Estado**: ✅ Guía Completa de Implementación

