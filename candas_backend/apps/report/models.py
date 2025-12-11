from django.db import models
from django.conf import settings
import uuid


class ReportConfig(models.Model):
    """Configuración de reportes personalizada por usuario"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='report_configs')
    name = models.CharField(max_length=200, verbose_name="Nombre de Configuración")
    report_type = models.CharField(max_length=50, verbose_name="Tipo de Reporte", choices=[
        ('packages', 'Paquetes'),
        ('statistics', 'Estadísticas'),
        ('agencies', 'Agencias'),
        ('destinations', 'Destinos'),
        ('custom', 'Personalizado'),
    ])
    config = models.JSONField(default=dict, verbose_name="Configuración JSON", help_text="Filtros, columnas, formato, etc.")
    is_default = models.BooleanField(default=False, verbose_name="Configuración por Defecto")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Configuración de Reporte'
        verbose_name_plural = 'Configuraciones de Reportes'
        unique_together = [['user', 'name']]

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class ReportSchedule(models.Model):
    """Reportes programados para generación automática"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='report_schedules')
    name = models.CharField(max_length=200, verbose_name="Nombre del Reporte Programado")
    report_type = models.CharField(max_length=50, verbose_name="Tipo de Reporte", choices=[
        ('packages', 'Paquetes'),
        ('statistics', 'Estadísticas'),
        ('agencies', 'Agencias'),
        ('destinations', 'Destinos'),
    ])
    frequency = models.CharField(max_length=20, verbose_name="Frecuencia", choices=[
        ('DAILY', 'Diario'),
        ('WEEKLY', 'Semanal'),
        ('MONTHLY', 'Mensual'),
        ('CUSTOM', 'Personalizado'),
    ])
    config = models.JSONField(default=dict, verbose_name="Configuración del Reporte", help_text="Filtros, columnas, etc.")
    active = models.BooleanField(default=True, verbose_name="Activo")
    last_run = models.DateTimeField(null=True, blank=True, verbose_name="Última Ejecución")
    next_run = models.DateTimeField(verbose_name="Próxima Ejecución")
    recipients = models.JSONField(default=list, verbose_name="Destinatarios", help_text="Lista de emails")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['next_run']
        verbose_name = 'Reporte Programado'
        verbose_name_plural = 'Reportes Programados'

    def __str__(self):
        return f"{self.name} - {self.get_frequency_display()}"


class Report(models.Model):
    """
    Informe de Paquetes, Sacas y Lotes enviados.
    Soporta informes diarios y mensuales con múltiples formatos de exportación.
    """
    REPORT_TYPE_CHOICES = [
        ('DAILY', 'Informe Diario'),
        ('DAILY_DISPATCH', 'Informe Diario - Despachos'),
        ('DAILY_RECEPTION', 'Informe Diario - Recepciones'),
        ('MONTHLY', 'Informe Mensual'),
    ]
    
    REPORT_STATUS_CHOICES = [
        ('GENERATING', 'Generando'),
        ('COMPLETED', 'Completado'),
        ('FAILED', 'Fallido'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_type = models.CharField(
        max_length=30,
        choices=REPORT_TYPE_CHOICES,
        verbose_name='Tipo de Informe'
    )
    report_date = models.DateField(
        verbose_name='Fecha del Informe',
        help_text='Para informes diarios: la fecha específica. Para informes mensuales: primer día del mes'
    )
    status = models.CharField(
        max_length=20,
        choices=REPORT_STATUS_CHOICES,
        default='GENERATING',
        verbose_name='Estado'
    )
    
    # Archivos generados
    pdf_file = models.FileField(
        upload_to='reports/pdf/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Archivo PDF'
    )
    excel_file = models.FileField(
        upload_to='reports/excel/%Y/%m/',
        blank=True,
        null=True,
        verbose_name='Archivo Excel'
    )
    json_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name='Datos JSON',
        help_text='Datos estructurados del informe en formato JSON'
    )
    
    # Resumen estadístico
    total_packages = models.IntegerField(
        default=0,
        verbose_name='Total de Paquetes'
    )
    total_sacas = models.IntegerField(
        default=0,
        verbose_name='Total de Sacas'
    )
    total_lotes = models.IntegerField(
        default=0,
        verbose_name='Total de Lotes'
    )
    total_individual_packages = models.IntegerField(
        default=0,
        verbose_name='Total de Paquetes Individuales',
        help_text='Paquetes enviados sin saca'
    )
    
    # Metadata
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_reports',
        verbose_name='Generado por'
    )
    is_automatic = models.BooleanField(
        default=False,
        verbose_name='Generación Automática',
        help_text='True si fue generado automáticamente por una tarea programada'
    )
    error_message = models.TextField(
        blank=True,
        verbose_name='Mensaje de Error'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-report_date', '-created_at']
        verbose_name = 'Informe'
        verbose_name_plural = 'Informes'
        db_table = 'report_report'
        indexes = [
            models.Index(fields=['report_type', 'report_date']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['is_automatic', '-report_date']),
        ]
        unique_together = [('report_type', 'report_date')]  # Un solo informe por tipo y fecha
    
    def __str__(self):
        type_display = self.get_report_type_display()
        if self.report_type == 'DAILY':
            return f"{type_display} - {self.report_date.strftime('%d/%m/%Y')}"
        else:  # MONTHLY
            return f"{type_display} - {self.report_date.strftime('%m/%Y')}"
    
    def get_filename_base(self):
        """Retorna el nombre base para los archivos del informe."""
        if self.report_type == 'DAILY':
            return f"informe_diario_{self.report_date.strftime('%Y%m%d')}"
        else:  # MONTHLY
            return f"informe_mensual_{self.report_date.strftime('%Y%m')}"
    
    def is_completed(self):
        """Retorna True si el informe se completó exitosamente."""
        return self.status == 'COMPLETED'
    
    def has_pdf(self):
        """Retorna True si tiene archivo PDF generado."""
        return bool(self.pdf_file)
    
    def has_excel(self):
        """Retorna True si tiene archivo Excel generado."""
        return bool(self.excel_file)
    
    def has_json(self):
        """Retorna True si tiene datos JSON generados."""
        return bool(self.json_data)


class ReportDetail(models.Model):
    """
    Detalle del informe: información agregada por agencia, destino y estado.
    Útil para cachear cálculos complejos y mejorar el rendimiento.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name='details',
        verbose_name='Informe'
    )
    
    # Agrupación
    transport_agency = models.ForeignKey(
        'catalog.TransportAgency',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Agencia de Transporte'
    )
    destination = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Destino'
    )
    package_status = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Estado de Paquetes'
    )
    
    # Métricas
    packages_count = models.IntegerField(
        default=0,
        verbose_name='Cantidad de Paquetes'
    )
    sacas_count = models.IntegerField(
        default=0,
        verbose_name='Cantidad de Sacas'
    )
    lotes_count = models.IntegerField(
        default=0,
        verbose_name='Cantidad de Lotes'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['report', 'transport_agency', 'destination']
        verbose_name = 'Detalle de Informe'
        verbose_name_plural = 'Detalles de Informes'
        db_table = 'report_detail'
        indexes = [
            models.Index(fields=['report', 'transport_agency']),
            models.Index(fields=['report', 'destination']),
        ]
    
    def __str__(self):
        parts = [str(self.report)]
        if self.transport_agency:
            parts.append(str(self.transport_agency))
        if self.destination:
            parts.append(self.destination)
        return ' - '.join(parts)
