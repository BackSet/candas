import os
from celery import Celery
from celery.schedules import crontab

# Configurar el módulo de configuración de Django para Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Crear instancia de Celery
app = Celery('candas')

# Usar una cadena aquí significa que el worker no tiene que serializar
# el objeto de configuración a los procesos hijo.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Cargar módulos de tareas desde todas las apps de Django registradas
app.autodiscover_tasks()

# Configuración de Celery
app.conf.update(
    # Broker URL (Redis)
    broker_url='redis://localhost:6379/0',
    # Backend de resultados
    result_backend='redis://localhost:6379/0',
    # Timezone
    timezone='America/Guayaquil',  # Ajustar según tu zona horaria
    enable_utc=True,
    # Serialización
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    # Configuración de tareas
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutos
)

# Configuración de tareas periódicas (Celery Beat)
app.conf.beat_schedule = {
    # Informe diario - Se ejecuta todos los días a la 1:00 AM
    'generate-daily-report': {
        'task': 'apps.report.tasks.generate_daily_report_task',
        'schedule': crontab(hour=1, minute=0),
        'options': {
            'description': 'Genera el informe diario del día anterior'
        }
    },
    # Informe mensual - Se ejecuta el primer día de cada mes a las 2:00 AM
    'generate-monthly-report': {
        'task': 'apps.report.tasks.generate_monthly_report_task',
        'schedule': crontab(day_of_month=1, hour=2, minute=0),
        'options': {
            'description': 'Genera el informe mensual del mes anterior'
        }
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Tarea de prueba para verificar que Celery está funcionando."""
    print(f'Request: {self.request!r}')
