from django.db import models


class PackageQuerySet(models.QuerySet):
    """QuerySet personalizado para Package"""
    
    def active(self):
        """Paquetes en estado activo/procesamiento"""
        return self.filter(status__in=['RECIBIDO', 'EN_BODEGA', 'EN_TRANSITO'])
    
    def by_agency(self, agency):
        """Paquetes asignados a una agencia específica"""
        return self.filter(transport_agency=agency)
    
    def by_pull(self, pull):
        """Paquetes pertenecientes a un Pull específico"""
        return self.filter(pull=pull)
    
    def pending_delivery(self):
        """Paquetes en tránsito y esperando entrega"""
        return self.filter(status='EN_TRANSITO')
    
    def delivered(self):
        """Paquetes entregados"""
        return self.filter(status='ENTREGADO')
    
    def returned(self):
        """Paquetes devueltos"""
        return self.filter(status='DEVUELTO')
    
    def retained(self):
        """Paquetes retenidos"""
        return self.filter(status='RETENIDO')
    
    def without_agency(self):
        """Paquetes sin agencia asignada"""
        return self.filter(transport_agency__isnull=True)
    
    def with_children(self):
        """Paquetes que tienen sub-paquetes"""
        return self.exclude(children__isnull=True).distinct()
    
    def parent_packages(self):
        """Solo paquetes padre (sin padre)"""
        return self.filter(parent__isnull=True)


class PackageManager(models.Manager):
    """Manager para queries complejas de Package"""
    
    def get_queryset(self):
        return PackageQuerySet(self.model, using=self._db)
    
    def active(self):
        return self.get_queryset().active()
    
    def by_agency(self, agency):
        return self.get_queryset().by_agency(agency)
    
    def by_pull(self, pull):
        return self.get_queryset().by_pull(pull)
    
    def pending_delivery(self):
        return self.get_queryset().pending_delivery()
    
    def delivered(self):
        return self.get_queryset().delivered()
    
    def returned(self):
        return self.get_queryset().returned()
    
    def retained(self):
        return self.get_queryset().retained()
    
    def without_agency(self):
        return self.get_queryset().without_agency()
    
    def with_children(self):
        return self.get_queryset().with_children()
    
    def parent_packages(self):
        return self.get_queryset().parent_packages()
