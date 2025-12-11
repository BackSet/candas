from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    barcode_scan_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Configuracion de campos visibles y editables en busqueda rapida"
    )
    export_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Configuracion de columnas para exportacion de paquetes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Preferences'
        verbose_name_plural = 'User Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.username}"
