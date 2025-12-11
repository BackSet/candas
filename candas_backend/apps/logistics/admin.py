from django.contrib import admin
from .models import Batch, Pull, Dispatch


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'destiny', 'transport_agency', 'get_pull_count', 'get_total_packages', 'created_at')
    search_fields = ('id', 'destiny', 'guide_number')
    list_filter = ('transport_agency', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Información del Lote', {
            'fields': ('id', 'destiny')
        }),
        ('Agencia de Transporte', {
            'fields': ('transport_agency', 'guide_number')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_pull_count(self, obj):
        return obj.get_pull_count()
    get_pull_count.short_description = 'Sacas'
    
    def get_total_packages(self, obj):
        return obj.get_total_packages()
    get_total_packages.short_description = 'Paquetes'


@admin.register(Pull)
class PullAdmin(admin.ModelAdmin):
    list_display = ('id', 'batch', 'common_destiny', 'size', 'transport_agency', 'guide_number', 'created_at')
    search_fields = ('common_destiny', 'guide_number', 'batch__id')
    list_filter = ('size', 'transport_agency', 'batch', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at', 'barcode_image')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'batch', 'common_destiny', 'size')
        }),
        ('Agencia de Transporte', {
            'fields': ('transport_agency', 'guide_number')
        }),
        # ('Detalles', {
        #     'fields': ( 'barcode_image')
        # }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Dispatch)
class DispatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'dispatch_date', 'status', 'created_at')
    search_fields = ('notes',)
    list_filter = ('status', 'dispatch_date')
    filter_horizontal = ('pulls', 'packages')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-dispatch_date',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'dispatch_date', 'status', 'notes')
        }),
        ('Contenido', {
            'fields': ('pulls', 'packages')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at')
        }),
    )
