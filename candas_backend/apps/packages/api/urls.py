"""
URLs para la API de Packages
"""
from rest_framework.routers import DefaultRouter
from .views import PackageViewSet, PackageImportViewSet

router = DefaultRouter()
router.register(r'packages', PackageViewSet, basename='package')
router.register(r'package-imports', PackageImportViewSet, basename='package-import')

urlpatterns = router.urls

