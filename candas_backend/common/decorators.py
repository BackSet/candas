"""
Custom Decorators - Decoradores reutilizables
"""
from functools import wraps
from django.contrib import messages
from django.shortcuts import redirect
from django.contrib.auth.decorators import user_passes_test


def ajax_required(f):
    """Decorador que requiere que la petición sea AJAX"""
    @wraps(f)
    def wrap(request, *args, **kwargs):
        if not request.headers.get('x-requested-with') == 'XMLHttpRequest':
            messages.error(request, 'Esta acción solo está disponible via AJAX.')
            return redirect('core:dashboard')
        return f(request, *args, **kwargs)
    return wrap


def superuser_required(view_func):
    """Decorador que requiere que el usuario sea superusuario"""
    decorated_view_func = user_passes_test(
        lambda u: u.is_active and u.is_superuser,
        login_url='admin:login'
    )(view_func)
    return decorated_view_func


def group_required(*group_names):
    """Decorador que requiere que el usuario pertenezca a ciertos grupos"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if request.user.groups.filter(name__in=group_names).exists() or request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            messages.error(request, 'No tienes permisos para acceder a esta página.')
            return redirect('core:dashboard')
        return wrapper
    return decorator
