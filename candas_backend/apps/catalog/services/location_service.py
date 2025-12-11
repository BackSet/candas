from django.db import transaction
from apps.catalog.models import Location


class LocationService:
    """Servicio para operaciones de negocio sobre Location"""
    
    @staticmethod
    @transaction.atomic
    def create_location(city, province):
        """
        Crea una nueva ubicación con validaciones.
        
        Args:
            city (str): Ciudad
            province (str): Provincia
            
        Returns:
            Location: Nueva ubicación creada
            
        Raises:
            ValueError: Si la ubicación ya existe
        """
        if Location.objects.filter(city=city, province=province).exists():
            raise ValueError(f"La ubicación {city}, {province} ya existe.")
        
        return Location.objects.create(city=city, province=province)
    
    @staticmethod
    def bulk_create_locations(locations_data):
        """
        Crea múltiples ubicaciones.
        
        Args:
            locations_data (list): Lista de tuplas (city, province)
            
        Returns:
            list: Ubicaciones creadas
        """
        locations = []
        for city, province in locations_data:
            location, created = Location.objects.get_or_create(
                city=city,
                province=province
            )
            if created:
                locations.append(location)
        return locations
