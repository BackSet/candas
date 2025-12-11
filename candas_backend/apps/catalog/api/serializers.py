"""
Serializers para el módulo de Catalog
"""
from rest_framework import serializers
from ..models import Location, TransportAgency, DeliveryAgency


class LocationSerializer(serializers.ModelSerializer):
    """Serializer para Location"""
    
    class Meta:
        model = Location
        fields = [
            'id',
            'city',
            'province',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class TransportAgencyListSerializer(serializers.ModelSerializer):
    """Serializer para lista de TransportAgency con estadísticas"""
    total_packages = serializers.SerializerMethodField()
    total_pulls = serializers.SerializerMethodField()
    total_batches = serializers.SerializerMethodField()
    
    class Meta:
        model = TransportAgency
        fields = [
            'id',
            'name',
            'phone_number',
            'email',
            'active',
            'date_registration',
            'total_packages',
            'total_pulls',
            'total_batches',
        ]
        read_only_fields = ['id', 'date_registration']
    
    def get_total_packages(self, obj):
        """Total de paquetes asignados"""
        return obj.get_total_packages()
    
    def get_total_pulls(self, obj):
        """Total de sacas asignadas"""
        return obj.get_total_pulls()
    
    def get_total_batches(self, obj):
        """Total de lotes asignados"""
        return obj.get_total_batches()


class TransportAgencyDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para TransportAgency"""
    total_packages = serializers.SerializerMethodField()
    total_pulls = serializers.SerializerMethodField()
    total_batches = serializers.SerializerMethodField()
    last_shipment_date = serializers.SerializerMethodField()
    
    class Meta:
        model = TransportAgency
        fields = [
            'id',
            'name',
            'phone_number',
            'email',
            'address',
            'contact_person',
            'notes',
            'active',
            'date_registration',
            'updated_at',
            'total_packages',
            'total_pulls',
            'total_batches',
            'last_shipment_date',
        ]
        read_only_fields = ['id', 'date_registration', 'updated_at']
    
    def get_total_packages(self, obj):
        return obj.get_total_packages()
    
    def get_total_pulls(self, obj):
        return obj.get_total_pulls()
    
    def get_total_batches(self, obj):
        return obj.get_total_batches()
    
    def get_last_shipment_date(self, obj):
        """Última fecha de envío"""
        from apps.packages.models import Package
        from apps.logistics.models import Pull, Batch
        
        # Buscar la fecha más reciente entre paquetes, sacas y lotes
        last_package = Package.objects.filter(
            transport_agency=obj
        ).order_by('-created_at').first()
        
        last_pull = Pull.objects.filter(
            transport_agency=obj
        ).order_by('-created_at').first()
        
        last_batch = Batch.objects.filter(
            transport_agency=obj
        ).order_by('-created_at').first()
        
        dates = []
        if last_package:
            dates.append(last_package.created_at)
        if last_pull:
            dates.append(last_pull.created_at)
        if last_batch:
            dates.append(last_batch.created_at)
        
        if dates:
            return max(dates)
        return None


class TransportAgencyCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/editar TransportAgency"""
    
    class Meta:
        model = TransportAgency
        fields = [
            'id',
            'name',
            'phone_number',
            'email',
            'address',
            'contact_person',
            'notes',
            'active',
        ]
        read_only_fields = ['id']
    
    def validate_email(self, value):
        """Validar unicidad de email"""
        if value:
            existing = TransportAgency.objects.filter(email=value)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError('Ya existe una agencia con este email')
        return value
    
    def validate_name(self, value):
        """Validar unicidad de nombre"""
        existing = TransportAgency.objects.filter(name=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError('Ya existe una agencia con este nombre')
        return value


# Mantener el serializer original para compatibilidad
class TransportAgencySerializer(TransportAgencyListSerializer):
    """Alias para compatibilidad con código existente"""
    pass


class DeliveryAgencySerializer(serializers.ModelSerializer):
    """Serializer para DeliveryAgency"""
    location_info = serializers.SerializerMethodField()
    
    class Meta:
        model = DeliveryAgency
        fields = [
            'id',
            'name',
            'location',
            'location_info',
            'address',
            'phone_number',
            'contact_person',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_location_info(self, obj):
        if obj.location:
            return LocationSerializer(obj.location).data
        return None

