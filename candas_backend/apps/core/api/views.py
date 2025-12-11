"""
API Views para autenticación y utilidades
"""
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from ..models import UserPreferences
from .serializers import UserPreferencesSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """Obtener token CSRF"""
    return Response({'csrftoken': get_token(request)})


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Endpoint para iniciar sesión"""
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Usuario y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        
        # Debug
        print(f"✅ Login exitoso para {username}")
        print(f"Session Key: {request.session.session_key}")
        print(f"User ID en sesión: {request.session.get('_auth_user_id')}")
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
            }
        })
    else:
        return Response(
            {'error': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Endpoint para cerrar sesión"""
    logout(request)
    return Response({'success': True})


@api_view(['GET'])
@permission_classes([AllowAny])
def user_view(request):
    """Obtener información del usuario actual"""
    # Debug
    print(f"🔍 user_view called")
    print(f"Session Key: {request.session.session_key}")
    print(f"User ID en sesión: {request.session.get('_auth_user_id')}")
    print(f"Is Authenticated: {request.user.is_authenticated}")
    print(f"Cookies recibidas: {list(request.COOKIES.keys())}")
    
    # Verificar si el usuario está autenticado
    if not request.user.is_authenticated:
        return Response(
            {'error': 'No autenticado'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
        'first_name': user.first_name,
        'last_name': user.last_name,
    })


class UserPreferencesViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar preferencias de usuario"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserPreferencesSerializer
    
    def get_queryset(self):
        return UserPreferences.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get', 'put'])
    def barcode_config(self, request):
        """Get or update barcode scan configuration"""
        prefs, created = UserPreferences.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            return Response({
                'barcode_scan_config': prefs.barcode_scan_config or {
                    'visible_fields': ['guide_number', 'name', 'city', 'status', 'notes'],
                    'editable_fields': ['status', 'notes']
                }
            })
        
        elif request.method == 'PUT':
            config = request.data.get('barcode_scan_config', {})
            prefs.barcode_scan_config = config
            prefs.save()
            return Response({'barcode_scan_config': prefs.barcode_scan_config})
    
    @action(detail=False, methods=['get', 'put'])
    def export_config(self, request):
        """Get or update export configuration"""
        prefs, created = UserPreferences.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            default_config = {
                'columns': ['guide_number', 'name', 'city', 'status', 'shipment_type_display'],
                'format': 'excel'
            }
            return Response({
                'export_config': prefs.export_config or default_config
            })
        
        elif request.method == 'PUT':
            config = request.data.get('export_config', {})
            prefs.export_config = config
            prefs.save()
            return Response({'export_config': prefs.export_config})
