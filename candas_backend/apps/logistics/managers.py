from django.db import models


class PullQuerySet(models.QuerySet):
    """QuerySet personalizado para Pull"""
    
    def pending(self):
        """Pulls pendientes"""
        return self.filter(status='PENDIENTE')
    
    def in_progress(self):
        """Pulls en proceso"""
        return self.filter(status='EN_PROCESO')
    
    def completed(self):
        """Pulls completados"""
        return self.filter(status='COMPLETADO')
    
    def cancelled(self):
        """Pulls cancelados"""
        return self.filter(status='CANCELADO')
    
    def by_priority(self, priority):
        """Pulls por prioridad"""
        return self.filter(priority=priority)
    
    def by_size(self, size):
        """Pulls por tamaño"""
        return self.filter(size=size)
    
    def by_destination(self, destiny):
        """Pulls por destino"""
        return self.filter(common_destiny__icontains=destiny)
    
    def recent(self, days=7):
        """Pulls creados en los últimos N días"""
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(created_at__gte=cutoff)


class PullManager(models.Manager):
    """Manager para queries complejas de Pull"""
    
    def get_queryset(self):
        return PullQuerySet(self.model, using=self._db)
    
    def pending(self):
        return self.get_queryset().pending()
    
    def in_progress(self):
        return self.get_queryset().in_progress()
    
    def completed(self):
        return self.get_queryset().completed()
    
    def cancelled(self):
        return self.get_queryset().cancelled()
    
    def by_priority(self, priority):
        return self.get_queryset().by_priority(priority)
    
    def by_size(self, size):
        return self.get_queryset().by_size(size)
    
    def by_destination(self, destiny):
        return self.get_queryset().by_destination(destiny)
    
    def recent(self, days=7):
        return self.get_queryset().recent(days)
