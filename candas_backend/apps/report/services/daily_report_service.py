"""
Servicio especializado para reportes diarios
"""
from django.db.models import Q, Count
from datetime import datetime, time
import json

from apps.packages.models import Package, PackageStatusHistory
from apps.logistics.models import Pull, Batch
from apps.report.models import Report, ReportDetail


class DailyReportService:
    """Servicio especializado para reportes diarios"""
    
    @staticmethod
    def get_dispatched_packages(report_date):
        """
        Obtiene paquetes despachados: EN_BODEGA → EN_TRANSITO en la fecha
        
        Args:
            report_date (date): Fecha del reporte
        
        Returns:
            QuerySet: Paquetes que cambiaron de estado
        """
        start_datetime = datetime.combine(report_date, time.min)
        end_datetime = datetime.combine(report_date, time.max)
        
        # Buscar cambios de estado EN_BODEGA → EN_TRANSITO
        status_changes = PackageStatusHistory.objects.filter(
            old_status='EN_BODEGA',
            new_status='EN_TRANSITO',
            changed_at__gte=start_datetime,
            changed_at__lte=end_datetime
        ).select_related('package', 'package__pull', 'package__pull__batch')
        
        package_ids = [sc.package_id for sc in status_changes]
        packages = Package.objects.filter(id__in=package_ids).select_related(
            'transport_agency',
            'pull__transport_agency',
            'pull__batch__transport_agency'
        )
        
        return packages
    
    @staticmethod
    def get_received_packages(report_date):
        """
        Obtiene paquetes recepcionados: NO_RECEPTADO → EN_BODEGA en la fecha
        
        Args:
            report_date (date): Fecha del reporte
        
        Returns:
            QuerySet: Paquetes que cambiaron de estado
        """
        start_datetime = datetime.combine(report_date, time.min)
        end_datetime = datetime.combine(report_date, time.max)
        
        status_changes = PackageStatusHistory.objects.filter(
            old_status='NO_RECEPTADO',
            new_status='EN_BODEGA',
            changed_at__gte=start_datetime,
            changed_at__lte=end_datetime
        ).select_related('package')
        
        package_ids = [sc.package_id for sc in status_changes]
        packages = Package.objects.filter(id__in=package_ids).select_related(
            'transport_agency'
        )
        
        return packages
    
    @staticmethod
    def get_pulls_from_packages(packages):
        """
        Obtiene sacas únicas que contienen los paquetes
        
        Args:
            packages (QuerySet): QuerySet de paquetes
        
        Returns:
            QuerySet: Sacas únicas
        """
        pull_ids = packages.filter(pull__isnull=False).values_list('pull_id', flat=True).distinct()
        return Pull.objects.filter(id__in=pull_ids).select_related('transport_agency', 'batch')
    
    @staticmethod
    def get_batches_from_pulls(pulls):
        """
        Obtiene lotes únicos que contienen las sacas
        
        Args:
            pulls (QuerySet): QuerySet de sacas
        
        Returns:
            QuerySet: Lotes únicos
        """
        batch_ids = pulls.filter(batch__isnull=False).values_list('batch_id', flat=True).distinct()
        return Batch.objects.filter(id__in=batch_ids).select_related('transport_agency')
    
    @staticmethod
    def generate_dispatch_report(report_date, user=None):
        """
        Genera reporte de despachos del día
        
        Args:
            report_date (date): Fecha del reporte
            user: Usuario que genera el reporte (None si es automático)
        
        Returns:
            Report: Instancia del reporte generado
        """
        packages = DailyReportService.get_dispatched_packages(report_date)
        pulls = DailyReportService.get_pulls_from_packages(packages)
        batches = DailyReportService.get_batches_from_pulls(pulls)
        
        # Contar paquetes individuales (sin pull)
        individual_packages = packages.filter(pull__isnull=True).count()
        
        # Crear JSON data
        json_data = {
            'report_date': str(report_date),
            'type': 'dispatch',
            'summary': {
                'total_packages': packages.count(),
                'total_pulls': pulls.count(),
                'total_batches': batches.count(),
                'individual_packages': individual_packages,
            },
            'packages': [
                {
                    'id': str(pkg.id),
                    'guide_number': pkg.guide_number,
                    'name': pkg.name,
                    'city': pkg.city,
                    'agency': pkg.get_shipping_agency().name if pkg.get_shipping_agency() else None
                }
                for pkg in packages
            ]
        }
        
        # Crear reporte
        report = Report.objects.create(
            report_type='DAILY_DISPATCH',
            report_date=report_date,
            status='COMPLETED',
            total_packages=packages.count(),
            total_sacas=pulls.count(),
            total_lotes=batches.count(),
            total_individual_packages=individual_packages,
            json_data=json_data,
            generated_by=user,
            is_automatic=user is None
        )
        
        # Crear detalles por agencia
        DailyReportService._create_report_details(report, packages)
        
        return report
    
    @staticmethod
    def generate_reception_report(report_date, user=None):
        """
        Genera reporte de recepciones del día
        
        Args:
            report_date (date): Fecha del reporte
            user: Usuario que genera el reporte (None si es automático)
        
        Returns:
            Report: Instancia del reporte generado
        """
        packages = DailyReportService.get_received_packages(report_date)
        
        # Crear JSON data
        json_data = {
            'report_date': str(report_date),
            'type': 'reception',
            'summary': {
                'total_packages': packages.count(),
            },
            'packages': [
                {
                    'id': str(pkg.id),
                    'guide_number': pkg.guide_number,
                    'name': pkg.name,
                    'city': pkg.city,
                    'agency': pkg.get_shipping_agency().name if pkg.get_shipping_agency() else None
                }
                for pkg in packages
            ]
        }
        
        # Crear reporte (recepciones no incluyen pulls/batches)
        report = Report.objects.create(
            report_type='DAILY_RECEPTION',
            report_date=report_date,
            status='COMPLETED',
            total_packages=packages.count(),
            total_sacas=0,
            total_lotes=0,
            total_individual_packages=packages.count(),
            json_data=json_data,
            generated_by=user,
            is_automatic=user is None
        )
        
        DailyReportService._create_report_details(report, packages)
        
        return report
    
    @staticmethod
    def _create_report_details(report, packages):
        """
        Crea los detalles del reporte agrupados por agencia
        
        Args:
            report (Report): Instancia del reporte
            packages (QuerySet): QuerySet de paquetes
        """
        # Agrupar por agencia de transporte
        packages_by_agency = {}
        
        for pkg in packages.select_related('transport_agency', 'pull__transport_agency', 'pull__batch__transport_agency'):
            agency = pkg.get_shipping_agency()
            agency_name = agency.name if agency else 'Sin Agencia'
            
            if agency_name not in packages_by_agency:
                packages_by_agency[agency_name] = []
            packages_by_agency[agency_name].append(pkg)
        
        # Crear ReportDetail por cada agencia
        for agency_name, pkgs in packages_by_agency.items():
            ReportDetail.objects.create(
                report=report,
                transport_agency_name=agency_name,
                package_count=len(pkgs),
                package_list=json.dumps([str(p.id) for p in pkgs])
            )
