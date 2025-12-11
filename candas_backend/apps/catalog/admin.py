from django.contrib import admin
from .models import Location, TransportAgency, DeliveryAgency


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('city', 'province', 'created_at')
    search_fields = ('city', 'province')
    list_filter = ('province',)
    ordering = ('province', 'city')


@admin.register(TransportAgency)
class TransportAgencyAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone_number', 'active', 'date_registration')
    search_fields = ('name', 'phone_number')
    list_filter = ('active',)
    ordering = ('name',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'phone_number', 'active')
        }),
    )


@admin.register(DeliveryAgency)
class DeliveryAgencyAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_location', 'phone_number', 'contact_person', 'active', 'created_at')
    search_fields = ('name', 'location__city', 'location__province', 'phone_number', 'contact_person', 'address')
    list_filter = ('location__city', 'active', 'created_at')
    ordering = ('location__city', 'name')
    autocomplete_fields = ('location',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'location', 'active')
        }),
        ('Datos de Contacto', {
            'fields': ('address', 'phone_number', 'contact_person')
        }),
    )
    
    def get_location(self, obj):
        return f"{obj.location.city}, {obj.location.province}"
    get_location.short_description = 'Ubicación'
    get_location.admin_order_field = 'location__city'
