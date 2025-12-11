from django.db import transaction
from apps.logistics.models import Dispatch


class DispatchService:
    """Servicio para operaciones de negocio sobre Dispatch"""
    
    @staticmethod
    @transaction.atomic
    def create_dispatch(dispatch_date, pull_ids=None, package_ids=None, notes=''):
        """
        Crea un nuevo Despacho.
        
        Args:
            dispatch_date (date): Fecha del despacho
            pull_ids (list): IDs de pulls a incluir
            package_ids (list): IDs de paquetes individuales
            notes (str): Notas adicionales
            
        Returns:
            Dispatch: Nuevo despacho creado
        """
        dispatch = Dispatch.objects.create(
            dispatch_date=dispatch_date,
            notes=notes
        )
        
        if pull_ids:
            from apps.logistics.models import Pull
            pulls = Pull.objects.filter(id__in=pull_ids)
            dispatch.pulls.set(pulls)
        
        if package_ids:
            from apps.packages.models import Package
            packages = Package.objects.filter(id__in=package_ids)
            dispatch.packages.set(packages)
        
        return dispatch
    
    @staticmethod
    def update_status(dispatch, new_status):
        """
        Actualiza el estado de un Despacho.
        
        Args:
            dispatch (Dispatch): Instancia del despacho
            new_status (str): Nuevo estado
            
        Returns:
            Dispatch: Despacho actualizado
            
        Raises:
            ValueError: Si el estado no es válido
        """
        valid_statuses = [choice[0] for choice in Dispatch.STATUS_CHOICES]
        if new_status not in valid_statuses:
            raise ValueError(f"Estado inválido: {new_status}")
        
        dispatch.status = new_status
        dispatch.save(update_fields=['status', 'updated_at'])
        return dispatch
    
    @staticmethod
    def get_dispatch_statistics(dispatch):
        """
        Obtiene estadísticas de un Despacho.
        
        Args:
            dispatch (Dispatch): Instancia del despacho
            
        Returns:
            dict: Estadísticas del despacho
        """
        return {
            'total_pulls': dispatch.pulls.count(),
            'total_packages': dispatch.get_total_packages(),
            'individual_packages': dispatch.packages.count(),
            'dispatch_date': dispatch.dispatch_date,
            'status': dispatch.get_status_display(),
        }
