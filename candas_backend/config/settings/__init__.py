"""
Settings package - loads appropriate configuration based on environment.
"""

import os

# Determinar entorno desde variable de entorno
ENVIRONMENT = os.environ.get('DJANGO_ENV', 'development')

if ENVIRONMENT == 'production':
    from .production import *
else:
    from .development import *
