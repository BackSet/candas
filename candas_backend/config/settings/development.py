"""
Development settings - inherits from base.
"""

from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-u=oj+^**8!vw=dq6=*$5%+bs(@3a(4l@&x$%^+2del2ocynq=v'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']


# Database
# Opción 1: Usar usuario del sistema (backset) - más fácil, sin contraseña
# Opción 2: Usar usuario postgres con contraseña (descomenta y configura)
import os
DB_USER = os.environ.get('DB_USER', 'backset')  # Cambia a 'postgres' si prefieres
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')  # Vacío para autenticación peer

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'candas_db'),
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD if DB_USER == 'postgres' else '',
        # Usar '' (vacío) para socket Unix (autenticación peer) en lugar de 'localhost' (TCP/IP)
        # Esto evita problemas de autenticación en WSL
        'HOST': os.environ.get('DB_HOST', ''),
        'PORT': os.environ.get('DB_PORT', '5433'),
    }
}


# Debug toolbar (opcional - instalar si necesitas)
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
# INTERNAL_IPS = ['127.0.0.1']


# Email backend para desarrollo (imprime en consola)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# Logging para desarrollo
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    # Suprimir warnings de pkg_resources deprecado (viene de drf_yasg)
    'filters': {
        'suppress_pkg_resources': {
            '()': 'django.utils.log.CallbackFilter',
            'callback': lambda record: 'pkg_resources is deprecated' not in str(record.getMessage()),
        },
    },
}

# Suprimir warnings de UserWarning sobre pkg_resources
import warnings
warnings.filterwarnings('ignore', message='pkg_resources is deprecated', category=UserWarning)
