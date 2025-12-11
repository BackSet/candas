from django.db import models
import uuid
from .managers import PullManager


class Batch(models.Model):
    """
    Lote - Agrupa múltiples sacas (Pulls) con características comunes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    destiny = models.CharField(
        max_length=200,
        verbose_name='Destino Común'
    )
    transport_agency = models.ForeignKey(
        'catalog.TransportAgency',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='batches',
        verbose_name='Agencia de Transporte'
    )
    guide_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Número de Guía del Lote',
        help_text='Número de guía común para todas las sacas del lote'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Lote'
        verbose_name_plural = 'Lotes'
        db_table = 'dispatch_batch'
        indexes = [
            models.Index(fields=['destiny']),
            models.Index(fields=['transport_agency']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Lote {str(self.id)[:8]} - {self.destiny}"
    
    def get_total_packages(self):
        """Retorna el total de paquetes en todas las sacas del lote."""
        from apps.packages.models import Package
        return sum(
            Package.objects.filter(pull=pull).count()
            for pull in self.pulls.all()
        )
    
    def get_pull_count(self):
        """Retorna el número de sacas en el lote."""
        return self.pulls.count()
    
    def clean(self):
        """Validación para asegurar consistencia del lote."""
        from django.core.exceptions import ValidationError
        super().clean()
        
        # Si hay sacas asociadas, validar que compartan el mismo destino
        if self.pk:  # Solo validar si ya existe
            pulls_with_different_destiny = self.pulls.exclude(
                common_destiny=self.destiny
            ).exists()
            if pulls_with_different_destiny:
                raise ValidationError({
                    'destiny': 'Todas las sacas del lote deben tener el mismo destino.'
                })


class Pull(models.Model):
    """
    Saca - Agrupación de paquetes con destino común.
    """
    SIZE_CHOICES = [
        ('PEQUENO', 'Pequeño'),
        ('MEDIANO', 'Mediano'),
        ('GRANDE', 'Grande'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    barcode_image = models.ImageField(
        upload_to='pull_barcodes/',
        blank=True,
        null=True,
        verbose_name='Código de Barras'
    )
    common_destiny = models.CharField(max_length=200, verbose_name="Destino Común")
    size = models.CharField(max_length=10, choices=SIZE_CHOICES, verbose_name="Tamaño")
    
    # Lote al que pertenece esta saca
    batch = models.ForeignKey(
        Batch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pulls',
        verbose_name='Lote'
    )
    
    # Agencia de transporte asignada
    transport_agency = models.ForeignKey(
        'catalog.TransportAgency',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pulls',
        verbose_name='Agencia de Transporte'
    )
    
    # Número de guía de la agencia
    guide_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Número de Guía'
    )
    
    objects = PullManager()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Pull (Saca)'
        verbose_name_plural = 'Pulls (Sacas)'
        db_table = 'dispatch_pull'  # Mantener nombre de tabla original

    def __str__(self):
        return f"Pull {self.id} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
    
    def save(self, *args, **kwargs):
        """Sincroniza el guide_number con el Batch si pertenece a uno."""
        if self.batch and self.batch.guide_number:
            self.guide_number = self.batch.guide_number
        super().save(*args, **kwargs)
    
    def clean(self):
        """Validación para asegurar consistencia entre Pull y Batch."""
        from django.core.exceptions import ValidationError
        super().clean()
        
        # Si pertenece a un lote, validar que compartan el mismo destino
        if self.batch and self.batch.destiny != self.common_destiny:
            raise ValidationError({
                'batch': f'El destino de la saca debe coincidir con el destino del lote: {self.batch.destiny}'
            })
        
        # Validar que los paquetes asociados tengan city compatible con el destino
        if self.pk:  # Solo si ya existe en la BD
            from apps.packages.models import Package
            packages = Package.objects.filter(pull=self)
            for package in packages:
                if package.city.upper() not in self.common_destiny.upper():
                    raise ValidationError({
                        'common_destiny': f'El paquete {package.guide_number} tiene ciudad "{package.city}" que no coincide con el destino "{self.common_destiny}"'
                    })
    
    def get_effective_destiny(self):
        """
        Retorna el destino efectivo de la saca.
        Prioridad: batch.destiny > common_destiny
        """
        if self.batch:
            return self.batch.destiny
        return self.common_destiny
    
    def get_effective_agency(self):
        """
        Retorna la agencia de transporte efectiva.
        Prioridad: batch.transport_agency > transport_agency
        """
        if self.batch and self.batch.transport_agency:
            return self.batch.transport_agency
        return self.transport_agency
    
    def get_effective_guide_number(self):
        """
        Retorna el número de guía efectivo.
        Prioridad: batch.guide_number > guide_number
        """
        if self.batch and self.batch.guide_number:
            return self.batch.guide_number
        return self.guide_number
    
    def get_data_source(self):
        """
        Retorna un diccionario indicando el origen de cada dato.
        Útil para mostrar en el frontend de dónde vienen los datos.
        """
        return {
            'destiny_source': 'batch' if self.batch else 'pull',
            'agency_source': 'batch' if (self.batch and self.batch.transport_agency) else 'pull',
            'guide_source': 'batch' if (self.batch and self.batch.guide_number) else 'pull',
        }


class Dispatch(models.Model):
    """
    Día de Despacho - agrupa Pulls y Paquetes para un envío específico por fecha.
    """
    STATUS_CHOICES = [
        ('PLANIFICADO', 'Planificado'),
        ('EN_CURSO', 'En Curso'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispatch_date = models.DateField(verbose_name='Fecha de Despacho', db_index=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PLANIFICADO',
        verbose_name='Estado'
    )
    notes = models.TextField(blank=True, verbose_name='Notas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Relación con Pulls que se despachan este día
    pulls = models.ManyToManyField(
        Pull,
        related_name='dispatches',
        blank=True,
        verbose_name='Sacas Asociadas'
    )
    
    # Relación con Packages individuales (sin Pull asignado)
    packages = models.ManyToManyField(
        'packages.Package',
        related_name='dispatches',
        blank=True,
        verbose_name='Paquetes Individuales'
    )
    
    class Meta:
        ordering = ['-dispatch_date', '-created_at']
        verbose_name = 'Despacho'
        verbose_name_plural = 'Despachos'
        indexes = [
            models.Index(fields=['dispatch_date', 'status']),
        ]
        db_table = 'dispatch_dispatch'  # Mantener nombre de tabla original
    
    def __str__(self):
        return f"Despacho {self.dispatch_date.strftime('%d/%m/%Y')} - {self.get_status_display()}"
    
    def get_total_packages(self):
        """Retorna el total de paquetes en pulls + paquetes individuales."""
        from apps.packages.models import Package
        return sum(
            Package.objects.filter(pull=pull).count()
            for pull in self.pulls.all()
        ) + self.packages.count()
    
    def get_packages_by_agency(self):
        """Retorna diccionario {TransportAgency: [packages]} incluyendo pulls y paquetes individuales."""
        from apps.packages.models import Package
        from collections import defaultdict
        
        agency_packages = defaultdict(list)
        
        # Paquetes de pulls - usar agencia efectiva
        for pull in self.pulls.select_related('transport_agency', 'batch__transport_agency').all():
            packages = Package.objects.filter(pull=pull).select_related('transport_agency')
            for pkg in packages:
                agency = pkg.get_shipping_agency()
                agency_packages[agency].append(pkg)
        
        # Paquetes individuales
        for pkg in self.packages.select_related('transport_agency'):
            agency = pkg.get_shipping_agency()
            agency_packages[agency].append(pkg)
        
        return dict(agency_packages)
