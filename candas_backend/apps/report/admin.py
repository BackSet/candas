from django.contrib import admin
from apps.report.models import Report, ReportDetail


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Administración de Informes en Django Admin."""
    
    list_display = [
        'id',
        'report_type',
        'report_date',
        'status',
        'total_packages',
        'total_sacas',
        'total_lotes',
        'is_automatic',
        'has_pdf',
        'has_excel',
        'created_at',
    ]
    
    list_filter = [
        'report_type',
        'status',
        'is_automatic',
        'report_date',
        'created_at',
    ]
    
    search_fields = [
        'id',
        'error_message',
    ]
    
    readonly_fields = [
        'id',
        'status',
        'total_packages',
        'total_sacas',
        'total_lotes',
        'total_individual_packages',
        'error_message',
        'created_at',
        'updated_at',
        'json_data',
    ]
    
    fieldsets = (
        ('Información General', {
            'fields': (
                'id',
                'report_type',
                'report_date',
                'status',
            )
        }),
        ('Estadísticas', {
            'fields': (
                'total_packages',
                'total_sacas',
                'total_lotes',
                'total_individual_packages',
            )
        }),
        ('Archivos Generados', {
            'fields': (
                'pdf_file',
                'excel_file',
            )
        }),
        ('Metadata', {
            'fields': (
                'generated_by',
                'is_automatic',
                'error_message',
                'created_at',
                'updated_at',
            )
        }),
        ('Datos JSON', {
            'fields': ('json_data',),
            'classes': ('collapse',),
        }),
    )
    
    def has_add_permission(self, request):
        """No permitir creación desde el admin."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """No permitir edición desde el admin."""
        return False


@admin.register(ReportDetail)
class ReportDetailAdmin(admin.ModelAdmin):
    """Administración de Detalles de Informes en Django Admin."""
    
    list_display = [
        'id',
        'report',
        'transport_agency',
        'destination',
        'packages_count',
        'sacas_count',
        'lotes_count',
    ]
    
    list_filter = [
        'report__report_type',
        'transport_agency',
    ]
    
    search_fields = [
        'destination',
        'transport_agency__name',
    ]
    
    readonly_fields = [
        'id',
        'report',
        'transport_agency',
        'destination',
        'package_status',
        'packages_count',
        'sacas_count',
        'lotes_count',
        'created_at',
    ]
    
    def has_add_permission(self, request):
        """No permitir creación desde el admin."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """No permitir edición desde el admin."""
        return False
