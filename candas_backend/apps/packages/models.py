from django.db import models
from django.conf import settings
import uuid
from .managers import PackageManager

# Create your models here.


class Package(models.Model):
    STATUS_CHOICES = [
        ('NO_RECEPTADO', 'No Receptado'),
        ('EN_BODEGA', 'En Bodega'),
        ('EN_TRANSITO', 'En Tránsito'),
        ('ENTREGADO', 'Entregado'),
        ('DEVUELTO', 'Devuelto'),
        ('RETENIDO', 'Retenido'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pull = models.ForeignKey(
        'logistics.Pull',
        on_delete=models.CASCADE,
        related_name='packages',
        null=True,
        blank=True
    )
    transport_agency = models.ForeignKey(
        'catalog.TransportAgency',
        on_delete=models.SET_NULL,
        related_name='packages_by_agency',
        null=True,
        blank=True,
        verbose_name='Agencia de Transporte'
    )
    delivery_agency = models.ForeignKey(
        'catalog.DeliveryAgency',
        on_delete=models.SET_NULL,
        related_name='packages_delivered',
        null=True,
        blank=True,
        verbose_name='Agencia de Reparto'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='children',
        null=True,
        blank=True
    )
    package_import = models.ForeignKey(
        'PackageImport',
        on_delete=models.SET_NULL,
        related_name='imported_packages',
        null=True,
        blank=True,
        verbose_name='Importación',
        help_text='Importación desde la cual se creó este paquete'
    )
    nro_master = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        verbose_name='Número Master'
    )
    guide_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Número de Guía'
    )
    agency_guide_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Número de Guía de Agencia',
        help_text='Número de guía asignado por la Agencia de Transporte (si aplica)'
    )
    guide_history = models.TextField(
        blank=True,
        verbose_name='Historial de Guías',
        help_text='Registro automático de cambios de número de guía'
    )
    status_history = models.TextField(
        blank=True,
        verbose_name='Historial de Estados',
        help_text='Registro automático de cambios de estado con fecha'
    )
    notes_history = models.TextField(
        blank=True,
        verbose_name='Historial de Notas',
        help_text='Registro automático de cambios de notas con fecha'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='NO_RECEPTADO'
    )
    notes = models.TextField(blank=True)
    hashtags = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Hashtags',
        help_text='Etiquetas separadas por espacios (ej: #urgente #fragil #express)'
    )
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = PackageManager()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Paquete'
        verbose_name_plural = 'Paquetes'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['transport_agency', '-created_at']),
            models.Index(fields=['delivery_agency', '-created_at']),
            models.Index(fields=['pull', '-created_at']),
            models.Index(fields=['hashtags']),
        ]
    
    def get_hashtags_list(self):
        """Retorna una lista de hashtags del paquete."""
        if not self.hashtags:
            return []
        return [tag.strip() for tag in self.hashtags.split() if tag.strip().startswith('#')]
    
    def add_hashtag(self, hashtag):
        """Agrega un hashtag al paquete si no existe."""
        if not hashtag.startswith('#'):
            hashtag = f'#{hashtag}'
        
        tags = self.get_hashtags_list()
        if hashtag not in tags:
            tags.append(hashtag)
            self.hashtags = ' '.join(tags)
            self.save()
    
    def remove_hashtag(self, hashtag):
        """Elimina un hashtag del paquete."""
        if not hashtag.startswith('#'):
            hashtag = f'#{hashtag}'
        
        tags = self.get_hashtags_list()
        if hashtag in tags:
            tags.remove(hashtag)
            self.hashtags = ' '.join(tags)
            self.save()
    
    def is_individual_shipment(self):
        """Retorna True si el paquete se envía individualmente (sin saca)."""
        return self.pull is None
    
    def get_shipping_guide_number(self):
        """
        Retorna el número de guía efectivo para el envío.
        Prioridad: pull.batch.guide_number > pull.guide_number > agency_guide_number
        """
        if self.pull:
            # Usar el método del Pull que ya maneja la jerarquía
            return self.pull.get_effective_guide_number()
        return self.agency_guide_number
    
    def get_shipping_agency(self):
        """
        Retorna la agencia de transporte efectiva del paquete.
        Prioridad: pull.batch.transport_agency > pull.transport_agency > transport_agency
        """
        if self.pull:
            # Usar el método del Pull que ya maneja la jerarquía
            return self.pull.get_effective_agency()
        return self.transport_agency
    
    def get_effective_destiny(self):
        """
        Retorna el destino efectivo del paquete.
        Prioridad: pull.batch.destiny > pull.common_destiny > city/province
        """
        if self.pull:
            return self.pull.get_effective_destiny()
        return f"{self.city}, {self.province}"
    
    def get_batch(self):
        """Retorna el lote al que pertenece el paquete (si está en una saca que pertenece a un lote)."""
        if self.pull and self.pull.batch:
            return self.pull.batch
        return None
    
    def get_data_source(self):
        """
        Retorna un diccionario indicando el origen de cada dato de envío.
        Útil para mostrar en el frontend de dónde vienen los datos.
        """
        if self.pull:
            pull_sources = self.pull.get_data_source()
            return {
                'destiny_source': pull_sources['destiny_source'],
                'agency_source': pull_sources['agency_source'] if self.pull.get_effective_agency() else 'package',
                'guide_source': pull_sources['guide_source'] if self.pull.get_effective_guide_number() else 'package',
            }
        return {
            'destiny_source': 'package',
            'agency_source': 'package',
            'guide_source': 'package',
        }
    
    def clean(self):
        """Validación del modelo Package."""
        super().clean()
        # Nota: Se eliminó la validación de ciudad vs destino de saca/lote
        # para permitir mayor flexibilidad en la asignación de paquetes
    
    def get_shipment_type(self):
        """
        Retorna el tipo de envío del paquete.
        Returns: 'sin_asignar', 'individual', 'saca', o 'lote'
        """
        # Si tiene pull (saca), determinar si es lote o saca
        if self.pull is not None:
            if self.pull.batch is not None:
                return 'lote'
            else:
                return 'saca'
        
        # Si no tiene pull, verificar si tiene agencia de transporte
        # "sin asignar": no tiene pull, no tiene agencia de transporte, y no tiene guía de agencia
        if self.transport_agency is None and (not self.agency_guide_number or self.agency_guide_number.strip() == ''):
            return 'sin_asignar'
        
        # "individual": no tiene pull pero tiene agencia de transporte (guía puede o no estar)
        if self.transport_agency is not None:
            return 'individual'
        
        # Por defecto, sin asignar
        return 'sin_asignar'
    
    def get_shipment_type_display(self):
        """Retorna el nombre de visualización para el tipo de envío"""
        type_map = {
            'sin_asignar': 'Sin Asignar',
            'individual': 'Envío Individual',
            'saca': 'Envío en Saca',
            'lote': 'Envío en Lote'
        }
        return type_map.get(self.get_shipment_type(), 'Desconocido')
    
    # Métodos para verificar jerarquía de paquetes
    
    def is_child(self):
        """
        Verifica si el paquete es hijo (tiene un padre).
        
        Returns:
            bool: True si el paquete tiene un padre asignado, False en caso contrario.
        """
        return self.parent is not None
    
    def is_parent(self):
        """
        Verifica si el paquete es padre (tiene hijos).
        
        Returns:
            bool: True si el paquete tiene al menos un hijo, False en caso contrario.
        """
        return self.children.exists()
    
    def has_hierarchy(self):
        """
        Verifica si el paquete tiene jerarquía (es padre o es hijo).
        
        Returns:
            bool: True si el paquete es padre O es hijo, False si no tiene jerarquía.
        """
        return self.is_child() or self.is_parent()
    
    def get_children_count(self):
        """
        Retorna el número de hijos del paquete.
        
        Returns:
            int: Número de paquetes hijos.
        """
        return self.children.count()
    
    def can_add_child(self, child_package):
        """
        Verifica si se puede agregar un paquete como hijo.
        
        Args:
            child_package: Instancia de Package o ID del paquete a verificar.
            
        Returns:
            tuple: (bool, str) - (True, '') si se puede agregar, (False, 'mensaje_error') si no.
        """
        from django.core.exceptions import ValidationError
        
        # Obtener instancia si es ID
        if isinstance(child_package, str):
            try:
                child_package = Package.objects.get(id=child_package)
            except Package.DoesNotExist:
                return False, 'El paquete hijo no existe'
        
        # No se puede agregar a sí mismo como hijo
        if child_package.id == self.id:
            return False, 'Un paquete no puede ser hijo de sí mismo'
        
        # Verificar si el hijo ya tiene un padre
        if child_package.parent is not None:
            return False, f'El paquete {child_package.guide_number} ya tiene un padre asignado'
        
        # Verificar que no se cree un ciclo
        if self._would_create_cycle(child_package):
            return False, 'No se puede agregar este paquete porque se crearía un ciclo en la jerarquía'
        
        return True, ''
    
    def _would_create_cycle(self, child_package):
        """
        Verifica si agregar child_package como hijo crearía un ciclo.
        
        Args:
            child_package: Instancia de Package que se quiere agregar como hijo.
            
        Returns:
            bool: True si se crearía un ciclo, False en caso contrario.
        """
        # Si el hijo es el padre actual, hay ciclo
        if child_package.id == self.id:
            return True
        
        # Verificar toda la cadena de ancestros del hijo
        visited = set()
        current = child_package
        
        while current:
            # Si encontramos el paquete actual en la cadena, hay ciclo
            if current.id == self.id:
                return True
            
            # Si ya visitamos este paquete, hay ciclo
            if current.id in visited:
                return True
            
            visited.add(current.id)
            
            # Seguir la cadena de padres
            if current.parent:
                current = current.parent
            else:
                break
        
        return False
    
    def can_set_parent(self, parent_package):
        """
        Verifica si se puede asignar un paquete como padre.
        
        Args:
            parent_package: Instancia de Package o ID del paquete padre a verificar.
            
        Returns:
            tuple: (bool, str) - (True, '') si se puede asignar, (False, 'mensaje_error') si no.
        """
        # Obtener instancia si es ID
        if isinstance(parent_package, str):
            try:
                parent_package = Package.objects.get(id=parent_package)
            except Package.DoesNotExist:
                return False, 'El paquete padre no existe'
        
        # No se puede asignar a sí mismo como padre
        if parent_package.id == self.id:
            return False, 'Un paquete no puede ser su propio padre'
        
        # Verificar que no se cree un ciclo
        if parent_package._would_create_cycle(self):
            return False, 'No se puede asignar este padre porque se crearía un ciclo en la jerarquía'
        
        return True, ''
    
    def get_hierarchy_level(self):
        """
        Retorna el nivel de jerarquía del paquete (0 = raíz, 1 = hijo, 2 = nieto, etc.).
        
        Returns:
            int: Nivel de jerarquía (0 si no tiene padre).
        """
        level = 0
        current = self
        
        while current.parent:
            level += 1
            current = current.parent
            # Protección contra ciclos infinitos
            if level > 100:
                break
        
        return level
    
    def get_root_parent(self):
        """
        Retorna el paquete raíz (el ancestro más antiguo sin padre).
        
        Returns:
            Package: El paquete raíz, o self si no tiene padre.
        """
        current = self
        visited = set()
        
        while current.parent:
            # Protección contra ciclos
            if current.id in visited:
                break
            visited.add(current.id)
            current = current.parent
        
        return current
    
    def get_all_descendants(self):
        """
        Retorna todos los descendientes del paquete (hijos, nietos, etc.).
        
        Returns:
            QuerySet: Todos los paquetes descendientes.
        """
        descendants = []
        children = self.children.all()
        
        for child in children:
            descendants.append(child)
            descendants.extend(child.get_all_descendants())
        
        return descendants

    def save(self, *args, **kwargs):
        """Sobrescribe save para registrar cambios de estado"""
        # Detectar cambio de estado
        if self.pk:
            try:
                old_package = Package.objects.get(pk=self.pk)
                if old_package.status != self.status:
                    # Registrar cambio en historial después de guardar
                    self._old_status = old_package.status
                    self._status_changed = True
                else:
                    self._status_changed = False
            except Package.DoesNotExist:
                self._status_changed = False
        else:
            self._status_changed = False
        
        super().save(*args, **kwargs)
        
        # Crear registro de historial si hubo cambio
        if self._status_changed:
            # Importar aquí para evitar problemas de importación circular
            PackageStatusHistory.objects.create(
                package=self,
                old_status=self._old_status,
                new_status=self.status
            )

    def __str__(self):
        return f"{self.nro_master} - {self.name}"


class PackageImport(models.Model):
    """Registro de importaciones de paquetes desde archivos Excel."""
    IMPORT_STATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PROCESANDO', 'Procesando'),
        ('COMPLETADO', 'Completado'),
        ('ERROR', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='package_imports/%Y/%m/%d/')
    status = models.CharField(
        max_length=20,
        choices=IMPORT_STATUS_CHOICES,
        default='PENDIENTE'
    )
    total_rows = models.IntegerField(default=0)
    successful_imports = models.IntegerField(default=0)
    failed_imports = models.IntegerField(default=0)
    error_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Importación de Paquetes'
        verbose_name_plural = 'Importaciones de Paquetes'
    
    def __str__(self):
        return f"Importación {self.id} - {self.status} ({self.successful_imports}/{self.total_rows})"


class PackageStatusHistory(models.Model):
    """Historial de cambios de estado de paquetes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    package = models.ForeignKey(
        Package,
        on_delete=models.CASCADE,
        related_name='state_changes',
        verbose_name='Paquete'
    )
    old_status = models.CharField(
        max_length=20,
        choices=Package.STATUS_CHOICES,
        verbose_name='Estado Anterior'
    )
    new_status = models.CharField(
        max_length=20,
        choices=Package.STATUS_CHOICES,
        verbose_name='Estado Nuevo'
    )
    changed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Fecha de Cambio'
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Cambiado por'
    )
    notes = models.TextField(blank=True, verbose_name='Notas')
    
    class Meta:
        ordering = ['-changed_at']
        verbose_name = 'Historial de Estado'
        verbose_name_plural = 'Historial de Estados'
        db_table = 'packages_status_history'
        indexes = [
            models.Index(fields=['package', 'changed_at']),
            models.Index(fields=['old_status', 'new_status', 'changed_at']),
        ]
    
    def __str__(self):
        return f"{self.package.guide_number}: {self.old_status} → {self.new_status}"
