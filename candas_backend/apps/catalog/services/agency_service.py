from django.db import transaction
from apps.catalog.models import TransportAgency, Location
from apps.packages.models import Package


class TransportAgencyService:
    """Servicio para operaciones de negocio sobre TransportAgency"""
    
    @staticmethod
    @transaction.atomic
    def create_agency(name, phone_number, agency_type='MIXTO', location_ids=None):
        """
        Crea una nueva agencia de transporte.
        
        Args:
            name (str): Nombre de la agencia
            phone_number (str): Teléfono
            agency_type (str): Tipo de agencia
            location_ids (list): IDs de ubicaciones a cubrir
            
        Returns:
            TransportAgency: Nueva agencia creada
            
        Raises:
            ValueError: Si el tipo de agencia no es válido
        """
        valid_types = [choice[0] for choice in TransportAgency.AGENCY_TYPE_CHOICES]
        if agency_type not in valid_types:
            raise ValueError(f"Tipo de agencia inválido: {agency_type}")
        
        agency = TransportAgency.objects.create(
            name=name,
            phone_number=phone_number,
            agency_type=agency_type
        )
        
        if location_ids:
            locations = Location.objects.filter(id__in=location_ids)
            agency.coverage.set(locations)
        
        return agency
    
    @staticmethod
    @transaction.atomic
    def update_coverage(agency, location_ids):
        """
        Actualiza la cobertura de una agencia.
        
        Args:
            agency (TransportAgency): Instancia de la agencia
            location_ids (list): IDs de ubicaciones
            
        Returns:
            TransportAgency: Agencia actualizada
        """
        locations = Location.objects.filter(id__in=location_ids)
        agency.coverage.set(locations)
        return agency
    
    @staticmethod
    def get_agency_statistics(agency):
        """
        Obtiene estadísticas de una agencia.
        
        Args:
            agency (TransportAgency): Instancia de la agencia
            
        Returns:
            dict: Estadísticas de la agencia
        """
        packages = Package.objects.filter(transport_agency=agency)
        
        return {
            'total_packages': packages.count(),
            'in_transit': packages.filter(status='EN_TRANSITO').count(),
            'delivered': packages.filter(status='ENTREGADO').count(),
            'pending': packages.filter(status='RECIBIDO').count(),
            'coverage_count': agency.coverage.count(),
        }
    
    @staticmethod
    def deactivate_agency(agency):
        """
        Desactiva una agencia.
        
        Args:
            agency (TransportAgency): Instancia de la agencia
            
        Returns:
            TransportAgency: Agencia desactivada
        """
        agency.active = False
        agency.save(update_fields=['active'])
        return agency
    
    @staticmethod
    def activate_agency(agency):
        """
        Activa una agencia.
        
        Args:
            agency (TransportAgency): Instancia de la agencia
            
        Returns:
            TransportAgency: Agencia activada
        """
        agency.active = True
        agency.save(update_fields=['active'])
        return agency
