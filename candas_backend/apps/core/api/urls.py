"""
URLs para la API de Core (Autenticación)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'core_api'

router = DefaultRouter()
router.register(r'preferences', views.UserPreferencesViewSet, basename='preferences')

urlpatterns = [
    path('auth/csrf/', views.get_csrf_token, name='get_csrf_token'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/user/', views.user_view, name='user'),
    path('', include(router.urls)),
]
