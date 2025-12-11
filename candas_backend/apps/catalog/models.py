from django.db import models
import uuid
from .managers import LocationManager, TransportAgencyManager


class Location(models.Model):
    """
    Catálogo de ciudades o destinos a nivel nacional.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    city = models.CharField(max_length=100, verbose_name="Ciudad", unique=True)
    province = models.CharField(max_length=100, verbose_name="Provincia/Departamento")
    created_at = models.DateTimeField(auto_now_add=True)
    
    objects = LocationManager()

    class Meta:
        ordering = ['province', 'city']
        verbose_name = 'Ubicación'
        verbose_name_plural = 'Ubicaciones'
        unique_together = ('city', 'province')
        db_table = 'dispatch_location'  # Mantener nombre de tabla original

    def __str__(self):
        return f"{self.city}, {self.province}"


class TransportAgency(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name="Nombre de la Agencia", unique=True)
    phone_number = models.CharField(max_length=20, verbose_name="Teléfono")
    email = models.EmailField(max_length=100, blank=True, verbose_name="Email")
    address = models.CharField(max_length=200, blank=True, verbose_name="Dirección")
    contact_person = models.CharField(max_length=100, blank=True, verbose_name="Persona de Contacto")
    notes = models.TextField(blank=True, verbose_name="Notas")
    active = models.BooleanField(default=True, verbose_name="Activa")
    date_registration = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Registro")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")
    
    objects = TransportAgencyManager()

    class Meta:
        ordering = ['name']
        verbose_name = 'Agencia de Transporte'
        verbose_name_plural = 'Agencias de Transporte'
        indexes = [
            models.Index(fields=['active', 'name']),
        ]
        db_table = 'dispatch_transportagency'  # Mantener nombre de tabla original

    def __str__(self):
        return self.name
    
    def clean(self):
        """Validaciones del modelo"""
        from django.core.exceptions import ValidationError
        super().clean()
        
        # Validar email único si existe
        if self.email:
            existing = TransportAgency.objects.filter(email=self.email).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError({'email': 'Ya existe una agencia con este email'})
    
    def get_total_packages(self):
        """Retorna total de paquetes asignados directamente o por herencia"""
        from apps.packages.models import Package
        # Paquetes directos + paquetes en sacas + paquetes en lotes
        direct = Package.objects.filter(transport_agency=self).count()
        in_pulls = Package.objects.filter(pull__transport_agency=self).count()
        in_batches = Package.objects.filter(pull__batch__transport_agency=self).count()
        return direct + in_pulls + in_batches
    
    def get_total_pulls(self):
        """Retorna total de sacas asignadas"""
        return self.pulls.count()
    
    def get_total_batches(self):
        """Retorna total de lotes asignados"""
        return self.batches.count()


class DeliveryAgency(models.Model):
    """
    Agencia de Reparto Local - Distribuye paquetes a clientes finales en una ciudad específica.
    Diferente de TransportAgency que transporta entre ciudades.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name="Nombre de la Agencia")
    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name='delivery_agencies',
        verbose_name='Ubicación'
    )
    address = models.CharField(max_length=200, verbose_name="Dirección", blank=True)
    phone_number = models.CharField(max_length=20, verbose_name="Teléfono", blank=True)
    contact_person = models.CharField(max_length=100, verbose_name="Persona de Contacto", blank=True)
    active = models.BooleanField(default=True, verbose_name="Activa")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")

    class Meta:
        ordering = ['location__city', 'name']
        verbose_name = 'Agencia de Reparto'
        verbose_name_plural = 'Agencias de Reparto'
        indexes = [
            models.Index(fields=['location', 'active']),
            models.Index(fields=['active', 'name']),
        ]

    def __str__(self):
        return f"{self.name} - {self.location.city}"

