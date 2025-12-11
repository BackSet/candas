"""
URLs para la API de Logistics
"""
from rest_framework.routers import DefaultRouter
from .views import PullViewSet, BatchViewSet, DispatchViewSet

router = DefaultRouter()
router.register(r'pulls', PullViewSet, basename='pull')
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'dispatches', DispatchViewSet, basename='dispatch')

urlpatterns = router.urls

