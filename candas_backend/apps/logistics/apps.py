from django.apps import AppConfig


class LogisticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.logistics'
    verbose_name = 'Logística'
    
    def ready(self):
        """Import signals if any"""
        try:
            import apps.logistics.signals
        except ImportError:
            pass
