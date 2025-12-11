from django.contrib import admin
from .models import Package, PackageImport
from .services import PackageService


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ('nro_master', 'guide_number', 'name', 'status', 'city', 'created_at')
    list_filter = ('status', 'city', 'created_at')
    search_fields = ('nro_master', 'guide_number', 'name', 'address', 'city', 'phone_number', 'guide_history')
    readonly_fields = ('id', 'created_at', 'updated_at', 'guide_history')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'nro_master', 'guide_number', 'name', 'pull', 'parent', 'transport_agency')
        }),
        ('Dirección', {
            'fields': ('address', 'city', 'province', 'phone_number')
        }),
        ('Estado', {
            'fields': ('status',)
        }),
        ('Historial de Guías', {
            'fields': ('guide_history',),
            'classes': ('collapse',)
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ('-created_at',)

    def save_model(self, request, obj, form, change):
        """Usa el service para cambios de guide_number"""
        if change and 'guide_number' in form.changed_data:
            # Obtener la instancia anterior
            old_instance = Package.objects.get(pk=obj.pk)
            if old_instance.guide_number != obj.guide_number:
                # Usar el service para cambiar el guide_number
                PackageService.change_guide_number(obj, obj.guide_number)
        else:
            obj.save()


@admin.register(PackageImport)
class PackageImportAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'status', 'total_rows', 'successful_imports', 'failed_imports')
    list_filter = ('status', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at', 'error_log', 'total_rows', 'successful_imports', 'failed_imports')
    
    fieldsets = (
        ('Información', {
            'fields': ('id', 'file', 'status')
        }),
        ('Estadísticas', {
            'fields': ('total_rows', 'successful_imports', 'failed_imports')
        }),
        ('Errores', {
            'fields': ('error_log',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ('-created_at',)
    
    def has_add_permission(self, request):
        """No permitir agregar importaciones desde el admin"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Permitir eliminar solo importaciones fallidas"""
        if obj and obj.status == 'ERROR':
            return True
        return False

