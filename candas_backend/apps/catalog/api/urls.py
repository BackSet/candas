"""
URLs para la API de Catalog
"""
from rest_framework.routers import DefaultRouter
from .views import LocationViewSet, TransportAgencyViewSet, DeliveryAgencyViewSet

router = DefaultRouter()
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'transport-agencies', TransportAgencyViewSet, basename='transport-agency')
router.register(r'delivery-agencies', DeliveryAgencyViewSet, basename='delivery-agency')

urlpatterns = router.urls

