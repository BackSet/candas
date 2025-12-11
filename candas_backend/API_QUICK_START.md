# ⚡ Quick Start - Implementación de API

Esta guía te muestra cómo implementar la API paso a paso, empezando con el módulo de Packages.

## 🚀 Paso 1: Instalación

```bash
# Instalar dependencias
pip install djangorestframework django-filter drf-yasg

# Agregar a requirements.txt
echo "djangorestframework>=3.14.0" >> requirements.txt
echo "django-filter>=23.0" >> requirements.txt
echo "drf-yasg>=1.21.0" >> requirements.txt
```

## 📁 Paso 2: Crear Estructura de Directorios

```bash
# Crear directorios para APIs
mkdir -p apps/packages/api
mkdir -p apps/logistics/api
mkdir -p apps/catalog/api

# Crear archivos __init__.py
touch apps/packages/api/__init__.py
touch apps/logistics/api/__init__.py
touch apps/catalog/api/__init__.py
```

## ⚙️ Paso 3: Configurar Settings

**config/settings/base.py** - Agregar al final:

```python
# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
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
}
```

**config/settings/base.py** - Agregar a INSTALLED_APPS:

```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'django_filters',
    'drf_yasg',
    # ...
]
```

## 📝 Paso 4: Crear Primer Serializer

**apps/packages/api/serializers.py:**

```python
from rest_framework import serializers
from ..models import Package

class PackageSerializer(serializers.ModelSerializer):
    """Serializer básico para Package"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Package
        fields = [
            'id',
            'guide_number',
            'nro_master',
            'name',
            'address',
            'city',
            'province',
            'status',
            'status_display',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
```

## 🎯 Paso 5: Crear Primer ViewSet

**apps/packages/api/views.py:**

```python
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..models import Package
from .serializers import PackageSerializer

class PackageViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Packages
    """
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['guide_number', 'name', 'address']
    ordering = ['-created_at']
```

## 🔗 Paso 6: Configurar URLs

**apps/packages/api/urls.py:**

```python
from rest_framework.routers import DefaultRouter
from .views import PackageViewSet

router = DefaultRouter()
router.register(r'packages', PackageViewSet, basename='package')

urlpatterns = router.urls
```

**apps/packages/urls.py** - Agregar al final:

```python
from django.urls import path, include

urlpatterns = [
    # ... tus URLs existentes ...
    
    # APIs
    path('api/', include('apps.packages.api.urls')),
]
```

**config/urls.py** - Agregar:

```python
urlpatterns = [
    # ... tus URLs existentes ...
    
    # APIs
    path('api/v1/', include('apps.packages.api.urls')),
]
```

## 🧪 Paso 7: Probar la API

```bash
# Iniciar servidor
python manage.py runserver

# Probar en el navegador (necesitas estar autenticado)
# http://localhost:8000/api/v1/packages/
```

## 📚 Paso 8: Agregar Documentación Swagger

**config/urls.py** - Agregar al inicio:

```python
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="Candas API",
        default_version='v1',
        description="API REST para el sistema de logística Candas",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)
```

**config/urls.py** - Agregar a urlpatterns:

```python
urlpatterns = [
    # ...
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    # ...
]
```

## ✅ Verificar

1. Accede a: `http://localhost:8000/api/docs/`
2. Deberías ver la documentación Swagger
3. Prueba hacer un GET a `/api/v1/packages/`

## 🎯 Siguientes Pasos

1. Agregar más serializers (Detail, Create)
2. Agregar acciones personalizadas (@action)
3. Implementar filtros avanzados
4. Agregar permisos personalizados
5. Crear APIs para otros módulos (logistics, catalog)

---

**¡Listo!** Ya tienes una API básica funcionando. Continúa con la guía completa en `API_IMPLEMENTATION_GUIDE.md` para ver todas las funcionalidades avanzadas.

