from django.db import models


class LocationQuerySet(models.QuerySet):
    """QuerySet personalizado para Location"""
    
    def by_province(self, province):
        """Ubicaciones por provincia"""
        return self.filter(province=province)
    
    def by_city(self, city):
        """Ubicaciones por ciudad"""
        return self.filter(city__icontains=city)


class LocationManager(models.Manager):
    """Manager para queries complejas de Location"""
    
    def get_queryset(self):
        return LocationQuerySet(self.model, using=self._db)
    
    def by_province(self, province):
        return self.get_queryset().by_province(province)
    
    def by_city(self, city):
        return self.get_queryset().by_city(city)


class TransportAgencyQuerySet(models.QuerySet):
    """QuerySet personalizado para TransportAgency"""
    
    def active(self):
        """Agencias activas"""
        return self.filter(active=True)
    
    def inactive(self):
        """Agencias inactivas"""
        return self.filter(active=False)
    
    def by_type(self, agency_type):
        """Agencias por tipo"""
        return self.filter(agency_type=agency_type)
    
    def covers_location(self, location):
        """Agencias que cubren una ubicación específica"""
        return self.filter(coverage=location)
    
    def covers_city(self, city):
        """Agencias que cubren una ciudad específica"""
        return self.filter(coverage__city=city)


class TransportAgencyManager(models.Manager):
    """Manager para queries complejas de TransportAgency"""
    
    def get_queryset(self):
        return TransportAgencyQuerySet(self.model, using=self._db)
    
    def active(self):
        return self.get_queryset().active()
    
    def inactive(self):
        return self.get_queryset().inactive()
    
    def by_type(self, agency_type):
        return self.get_queryset().by_type(agency_type)
    
    def covers_location(self, location):
        return self.get_queryset().covers_location(location)
    
    def covers_city(self, city):
        return self.get_queryset().covers_city(city)
