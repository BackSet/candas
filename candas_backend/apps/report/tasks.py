from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

from apps.report.services import ReportGenerator
from apps.report.services.pdf_exporter import PDFExporter
from apps.report.services.excel_exporter import ExcelExporter
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)


@shared_task(name='apps.report.tasks.generate_daily_report_task')
def generate_daily_report_task():
    """
    Tarea programada para generar automáticamente el informe diario del día anterior.
    Se ejecuta todos los días a la 1:00 AM.
    """
    yesterday = timezone.now().date() - timedelta(days=1)
    
    try:
        logger.info(f"Iniciando generación automática de informe diario para {yesterday}")
        
        # Generar informe con el generador (sin usuario, es automático)
        generator = ReportGenerator(user=None)
        report = generator.generate_daily_report(yesterday)
        
        # Generar archivos PDF y Excel
        if report.status == 'COMPLETED':
            generate_report_files.delay(str(report.id))
        
        logger.info(f"Informe diario para {yesterday} generado exitosamente: {report.id}")
        return {
            'success': True,
            'report_id': str(report.id),
            'date': str(yesterday)
        }
        
    except Exception as e:
        logger.error(f"Error en generación automática de informe diario para {yesterday}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'date': str(yesterday)
        }


@shared_task(name='apps.report.tasks.generate_monthly_report_task')
def generate_monthly_report_task():
    """
    Tarea programada para generar automáticamente el informe mensual del mes anterior.
    Se ejecuta el primer día de cada mes a las 2:00 AM.
    """
    today = timezone.now().date()
    
    # Calcular el mes anterior
    if today.month == 1:
        year = today.year - 1
        month = 12
    else:
        year = today.year
        month = today.month - 1
    
    try:
        logger.info(f"Iniciando generación automática de informe mensual para {month}/{year}")
        
        # Generar informe con el generador (sin usuario, es automático)
        generator = ReportGenerator(user=None)
        report = generator.generate_monthly_report(year, month)
        
        # Generar archivos PDF y Excel
        if report.status == 'COMPLETED':
            generate_report_files.delay(str(report.id))
        
        logger.info(f"Informe mensual para {month}/{year} generado exitosamente: {report.id}")
        return {
            'success': True,
            'report_id': str(report.id),
            'year': year,
            'month': month
        }
        
    except Exception as e:
        logger.error(f"Error en generación automática de informe mensual para {month}/{year}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'year': year,
            'month': month
        }


@shared_task(name='apps.report.tasks.generate_report_files')
def generate_report_files(report_id):
    """
    Tarea asíncrona para generar los archivos PDF y Excel de un informe.
    
    Args:
        report_id: UUID del informe
        
    Returns:
        dict: Resultado de la generación
    """
    from apps.report.models import Report
    
    try:
        report = Report.objects.get(id=report_id)
        logger.info(f"Generando archivos para informe {report_id}")
        
        # Generar PDF
        try:
            pdf_exporter = PDFExporter(report)
            pdf_buffer = pdf_exporter.generate()
            
            filename = f"{report.get_filename_base()}.pdf"
            report.pdf_file.save(filename, ContentFile(pdf_buffer.read()), save=False)
            logger.info(f"PDF generado para informe {report_id}")
        except Exception as e:
            logger.error(f"Error generando PDF para informe {report_id}: {str(e)}")
        
        # Generar Excel
        try:
            excel_exporter = ExcelExporter(report)
            excel_buffer = excel_exporter.generate()
            
            filename = f"{report.get_filename_base()}.xlsx"
            report.excel_file.save(filename, ContentFile(excel_buffer.read()), save=False)
            logger.info(f"Excel generado para informe {report_id}")
        except Exception as e:
            logger.error(f"Error generando Excel para informe {report_id}: {str(e)}")
        
        # Guardar el informe con los archivos
        report.save()
        
        return {
            'success': True,
            'report_id': report_id,
            'has_pdf': report.has_pdf(),
            'has_excel': report.has_excel()
        }
        
    except Report.DoesNotExist:
        logger.error(f"Informe {report_id} no encontrado")
        return {
            'success': False,
            'error': f"Informe {report_id} no encontrado"
        }
    except Exception as e:
        logger.error(f"Error generando archivos para informe {report_id}: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


@shared_task(name='apps.report.tasks.cleanup_old_reports')
def cleanup_old_reports(days=90):
    """
    Tarea opcional para limpiar informes antiguos.
    
    Args:
        days: Cantidad de días para considerar un informe como antiguo
        
    Returns:
        dict: Resultado de la limpieza
    """
    from apps.report.models import Report
    from django.utils import timezone
    
    try:
        cutoff_date = timezone.now() - timedelta(days=days)
        old_reports = Report.objects.filter(created_at__lt=cutoff_date)
        count = old_reports.count()
        
        logger.info(f"Eliminando {count} informes antiguos (más de {days} días)")
        old_reports.delete()
        
        return {
            'success': True,
            'deleted_count': count,
            'days': days
        }
        
    except Exception as e:
        logger.error(f"Error limpiando informes antiguos: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
