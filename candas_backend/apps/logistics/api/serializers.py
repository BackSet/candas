"""
Serializers para el módulo de Logistics
"""
from rest_framework import serializers
from ..models import Pull, Batch, Dispatch


class PullListSerializer(serializers.ModelSerializer):
    """Serializer para listar Pulls"""
    size_display = serializers.CharField(source='get_size_display', read_only=True)
    packages_count = serializers.SerializerMethodField()
    transport_agency_name = serializers.CharField(
        source='transport_agency.name',
        read_only=True
    )
    
    class Meta:
        model = Pull
        fields = [
            'id',
            'common_destiny',
            'size',
            'size_display',
            'guide_number',
            'packages_count',
            'transport_agency',
            'transport_agency_name',
            'batch',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_packages_count(self, obj):
        """Contar paquetes en el Pull"""
        return obj.packages.count()


class PullDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para Pull"""
    size_display = serializers.CharField(source='get_size_display', read_only=True)
    packages_count = serializers.SerializerMethodField()
    packages = serializers.SerializerMethodField()
    transport_agency_info = serializers.SerializerMethodField()
    batch_info = serializers.SerializerMethodField()
    barcode_url = serializers.SerializerMethodField()
    
    # Campos efectivos (heredados o propios)
    effective_destiny = serializers.SerializerMethodField()
    effective_agency = serializers.SerializerMethodField()
    effective_guide_number = serializers.SerializerMethodField()
    data_source = serializers.SerializerMethodField()
    
    class Meta:
        model = Pull
        fields = [
            'id',
            'common_destiny',
            'size',
            'size_display',
            'guide_number',
            'packages_count',
            'packages',
            'transport_agency',
            'transport_agency_info',
            'batch',
            'batch_info',
            'barcode_image',
            'barcode_url',
            'effective_destiny',
            'effective_agency',
            'effective_guide_number',
            'data_source',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'barcode_image',
            'created_at',
            'updated_at',
        ]
    
    def get_packages_count(self, obj):
        return obj.packages.count()
    
    def get_packages(self, obj):
        """Lista de paquetes en el Pull"""
        from apps.packages.api.serializers import PackageListSerializer
        packages = obj.packages.all()[:50]  # Limitar a 50 para no sobrecargar
        return PackageListSerializer(packages, many=True).data
    
    def get_transport_agency_info(self, obj):
        if obj.transport_agency:
            return {
                'id': str(obj.transport_agency.id),
                'name': obj.transport_agency.name,
            }
        return None
    
    def get_batch_info(self, obj):
        if obj.batch:
            return {
                'id': str(obj.batch.id),
                'destiny': obj.batch.destiny,
                'pull_count': obj.batch.pulls.count(),
            }
        return None
    
    def get_barcode_url(self, obj):
        """URL del código de barras"""
        if obj.barcode_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.barcode_image.url)
        return None
    
    def get_effective_destiny(self, obj):
        """Retorna el destino efectivo (heredado o propio)"""
        return obj.get_effective_destiny()
    
    def get_effective_agency(self, obj):
        """Retorna la agencia efectiva con información completa"""
        agency = obj.get_effective_agency()
        if agency:
            return {
                'id': str(agency.id),
                'name': agency.name,
            }
        return None
    
    def get_effective_guide_number(self, obj):
        """Retorna el número de guía efectivo"""
        return obj.get_effective_guide_number()
    
    def get_data_source(self, obj):
        """Retorna el origen de cada dato (batch o pull)"""
        return obj.get_data_source()


class PullCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Pulls"""
    package_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text="Lista de IDs de paquetes a asociar"
    )
    
    class Meta:
        model = Pull
        fields = [
            'common_destiny',
            'size',
            'transport_agency',
            'guide_number',
            'batch',
            'package_ids',
        ]
    
    def validate_size(self, value):
        """Validar tamaño"""
        valid_sizes = [choice[0] for choice in Pull.SIZE_CHOICES]
        if value not in valid_sizes:
            raise serializers.ValidationError(
                f"Tamaño inválido. Opciones: {', '.join(valid_sizes)}"
            )
        return value
    
    def validate(self, data):
        """Validar que no haya conflictos con la jerarquía"""
        batch = data.get('batch')
        
        # Si pertenece a un lote, no debe tener transport_agency ni guide_number propios
        if batch:
            if data.get('transport_agency'):
                raise serializers.ValidationError({
                    'transport_agency': 'No puede asignar agencia si la saca pertenece a un lote (heredará del lote)'
                })
            if data.get('guide_number'):
                raise serializers.ValidationError({
                    'guide_number': 'No puede asignar número de guía si la saca pertenece a un lote (heredará del lote)'
                })
        
        return data
    
    def create(self, validated_data):
        """Crear Pull y asociar paquetes"""
        package_ids = validated_data.pop('package_ids', [])
        
        # Crear Pull con todos los datos
        pull = Pull.objects.create(**validated_data)
        
        # Asociar paquetes si se proporcionaron
        if package_ids:
            from apps.packages.models import Package
            
            # Buscar paquetes disponibles (sin pull asignado)
            packages = Package.objects.filter(id__in=package_ids, pull__isnull=True)
            
            # Asignar el pull a cada paquete
            packages.update(pull=pull)
            
            # Actualizar el pull para reflejar los cambios
            pull.refresh_from_db()
        
        return pull


class BatchListSerializer(serializers.ModelSerializer):
    """Serializer para lista de Batches"""
    pulls_count = serializers.SerializerMethodField()
    total_packages = serializers.SerializerMethodField()
    transport_agency_name = serializers.CharField(
        source='transport_agency.name',
        read_only=True
    )
    
    class Meta:
        model = Batch
        fields = [
            'id',
            'destiny',
            'transport_agency',
            'transport_agency_name',
            'guide_number',
            'pulls_count',
            'total_packages',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_pulls_count(self, obj):
        return obj.pulls.count()
    
    def get_total_packages(self, obj):
        return obj.get_total_packages()


class BatchDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para Batch"""
    pulls_count = serializers.SerializerMethodField()
    total_packages = serializers.SerializerMethodField()
    status_summary = serializers.SerializerMethodField()
    transport_agency_info = serializers.SerializerMethodField()
    pulls_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Batch
        fields = [
            'id',
            'destiny',
            'transport_agency',
            'transport_agency_info',
            'guide_number',
            'pulls_count',
            'total_packages',
            'status_summary',
            'pulls_list',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_pulls_count(self, obj):
        return obj.pulls.count()
    
    def get_total_packages(self, obj):
        return obj.get_total_packages()
    
    def get_status_summary(self, obj):
        """Resumen de estados de paquetes"""
        from apps.packages.models import Package
        packages = Package.objects.filter(pull__batch=obj)
        
        summary = {}
        for status_code, status_name in Package.STATUS_CHOICES:
            count = packages.filter(status=status_code).count()
            if count > 0:
                summary[status_code] = {
                    'name': status_name,
                    'count': count
                }
        
        return summary
    
    def get_transport_agency_info(self, obj):
        """Información de la agencia"""
        if obj.transport_agency:
            from apps.catalog.api.serializers import TransportAgencySerializer
            return TransportAgencySerializer(obj.transport_agency).data
        return None
    
    def get_pulls_list(self, obj):
        """Lista de sacas del lote"""
        pulls = obj.pulls.all()
        return PullListSerializer(pulls, many=True).data


# Mantener el serializer original para compatibilidad
class BatchSerializer(BatchListSerializer):
    """Alias para compatibilidad con código existente"""
    pass


class BatchCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Batch con sacas existentes"""
    pull_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text="Lista de IDs de sacas existentes a asociar"
    )
    
    class Meta:
        model = Batch
        fields = [
            'destiny',
            'transport_agency',
            'guide_number',
            'pull_ids',
        ]
    
    def validate(self, data):
        """Validar que las sacas existan y no estén en otro lote"""
        pull_ids = data.get('pull_ids', [])
        
        if pull_ids:
            from ..models import Pull
            pulls = Pull.objects.filter(id__in=pull_ids)
            
            if pulls.count() != len(pull_ids):
                raise serializers.ValidationError({
                    'pull_ids': 'Algunas sacas no existen'
                })
            
            # Verificar que no tengan lote asignado
            pulls_with_batch = pulls.filter(batch__isnull=False)
            if pulls_with_batch.exists():
                raise serializers.ValidationError({
                    'pull_ids': f'{pulls_with_batch.count()} saca(s) ya están en otro lote'
                })
            
            # Validar que compartan el mismo destino
            destiny = data.get('destiny')
            for pull in pulls:
                if pull.common_destiny != destiny:
                    raise serializers.ValidationError({
                        'pull_ids': f'La saca {pull.id} tiene destino diferente: {pull.common_destiny}'
                    })
        
        return data
    
    def create(self, validated_data):
        """Crear Batch y asociar sacas existentes"""
        pull_ids = validated_data.pop('pull_ids', [])
        
        # Crear Batch
        batch = Batch.objects.create(**validated_data)
        
        # Asociar sacas
        if pull_ids:
            from ..models import Pull
            Pull.objects.filter(id__in=pull_ids).update(batch=batch)
        
        return batch


class DispatchSerializer(serializers.ModelSerializer):
    """Serializer para Dispatch"""
    packages_count = serializers.SerializerMethodField()
    pulls_count = serializers.SerializerMethodField()
    total_packages = serializers.SerializerMethodField()
    
    class Meta:
        model = Dispatch
        fields = [
            'id',
            'dispatch_date',
            'status',
            'notes',
            'packages_count',
            'pulls_count',
            'total_packages',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_packages_count(self, obj):
        """Retorna la cantidad de paquetes individuales (sin pull)"""
        return obj.packages.count()
    
    def get_pulls_count(self, obj):
        """Retorna la cantidad de sacas"""
        return obj.pulls.count()
    
    def get_total_packages(self, obj):
        """Retorna el total de paquetes (en sacas + individuales)"""
        return obj.get_total_packages()


class PullItemSerializer(serializers.Serializer):
    """Serializer para un item de Pull en creación múltiple"""
    size = serializers.ChoiceField(choices=Pull.SIZE_CHOICES)
    package_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        help_text="Lista de IDs de paquetes para esta saca"
    )


class PullBulkCreateSerializer(serializers.Serializer):
    """Serializer para crear múltiples sacas con el mismo destino"""
    common_destiny = serializers.CharField(
        max_length=200,
        help_text="Destino común para todas las sacas"
    )
    transport_agency = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Agencia de transporte común (opcional)"
    )
    guide_number = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        help_text="Número de guía común (opcional)"
    )
    pulls = serializers.ListField(
        child=PullItemSerializer(),
        min_length=1,
        help_text="Lista de sacas a crear"
    )
    
    def validate_pulls(self, value):
        """Validar que haya al menos una saca"""
        if not value:
            raise serializers.ValidationError("Debe proporcionar al menos una saca")
        return value
    
    def validate(self, data):
        """Validaciones globales"""
        from apps.packages.models import Package
        
        # Recopilar todos los package_ids
        all_package_ids = []
        for pull_data in data.get('pulls', []):
            package_ids = pull_data.get('package_ids', [])
            all_package_ids.extend(package_ids)
        
        # Validar que no haya paquetes duplicados
        if len(all_package_ids) != len(set(all_package_ids)):
            raise serializers.ValidationError({
                'pulls': 'No se pueden asignar los mismos paquetes a múltiples sacas'
            })
        
        # Validar que todos los paquetes existan y estén disponibles
        if all_package_ids:
            packages = Package.objects.filter(id__in=all_package_ids)
            if packages.count() != len(all_package_ids):
                raise serializers.ValidationError({
                    'pulls': 'Algunos paquetes no existen'
                })
            
            # Verificar que no tengan pull asignado
            packages_with_pull = packages.filter(pull__isnull=False)
            if packages_with_pull.exists():
                raise serializers.ValidationError({
                    'pulls': f'{packages_with_pull.count()} paquete(s) ya están asignados a otra saca'
                })
        
        # Validar agencia de transporte si se proporciona
        if data.get('transport_agency'):
            from apps.catalog.models import TransportAgency
            if not TransportAgency.objects.filter(id=data['transport_agency']).exists():
                raise serializers.ValidationError({
                    'transport_agency': 'La agencia de transporte no existe'
                })
        
        return data
    
    def create(self, validated_data):
        """Crear múltiples sacas"""
        from apps.packages.models import Package
        from apps.catalog.models import TransportAgency
        from django.db import transaction
        
        common_destiny = validated_data['common_destiny']
        transport_agency_id = validated_data.get('transport_agency')
        guide_number = validated_data.get('guide_number', '')
        pulls_data = validated_data['pulls']
        
        transport_agency = None
        if transport_agency_id:
            transport_agency = TransportAgency.objects.get(id=transport_agency_id)
        
        created_pulls = []
        
        with transaction.atomic():
            for pull_data in pulls_data:
                # Crear el Pull
                pull = Pull.objects.create(
                    common_destiny=common_destiny,
                    size=pull_data['size'],
                    transport_agency=transport_agency,
                    guide_number=guide_number
                )
                
                # Asociar paquetes
                package_ids = pull_data.get('package_ids', [])
                if package_ids:
                    packages = Package.objects.filter(id__in=package_ids)
                    packages.update(pull=pull)
                
                created_pulls.append(pull)
        
        return created_pulls


class BatchWithPullsCreateSerializer(serializers.Serializer):
    """Serializer para crear un lote con múltiples sacas nuevas"""
    destiny = serializers.CharField(
        max_length=200,
        help_text="Destino común del lote y todas sus sacas"
    )
    transport_agency = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Agencia de transporte del lote (opcional)"
    )
    guide_number = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        help_text="Número de guía del lote (opcional)"
    )
    pulls = serializers.ListField(
        child=PullItemSerializer(),
        min_length=1,
        help_text="Lista de sacas a crear en el lote"
    )
    
    def validate_pulls(self, value):
        """Validar que haya al menos una saca"""
        if not value:
            raise serializers.ValidationError("Debe proporcionar al menos una saca")
        return value
    
    def validate(self, data):
        """Validaciones globales"""
        from apps.packages.models import Package
        
        # Recopilar todos los package_ids
        all_package_ids = []
        for pull_data in data.get('pulls', []):
            package_ids = pull_data.get('package_ids', [])
            all_package_ids.extend(package_ids)
        
        # Validar que no haya paquetes duplicados
        if len(all_package_ids) != len(set(all_package_ids)):
            raise serializers.ValidationError({
                'pulls': 'No se pueden asignar los mismos paquetes a múltiples sacas'
            })
        
        # Validar que todos los paquetes existan y estén disponibles
        if all_package_ids:
            packages = Package.objects.filter(id__in=all_package_ids)
            if packages.count() != len(all_package_ids):
                raise serializers.ValidationError({
                    'pulls': 'Algunos paquetes no existen'
                })
            
            # Verificar que no tengan pull asignado
            packages_with_pull = packages.filter(pull__isnull=False)
            if packages_with_pull.exists():
                raise serializers.ValidationError({
                    'pulls': f'{packages_with_pull.count()} paquete(s) ya están asignados a otra saca'
                })
        
        # Validar agencia de transporte si se proporciona
        if data.get('transport_agency'):
            from apps.catalog.models import TransportAgency
            if not TransportAgency.objects.filter(id=data['transport_agency']).exists():
                raise serializers.ValidationError({
                    'transport_agency': 'La agencia de transporte no existe'
                })
        
        return data
    
    def create(self, validated_data):
        """Crear lote y múltiples sacas en una transacción atómica"""
        from apps.packages.models import Package
        from apps.catalog.models import TransportAgency
        from django.db import transaction
        
        destiny = validated_data['destiny']
        transport_agency_id = validated_data.get('transport_agency')
        guide_number = validated_data.get('guide_number', '')
        pulls_data = validated_data['pulls']
        
        transport_agency = None
        if transport_agency_id:
            transport_agency = TransportAgency.objects.get(id=transport_agency_id)
        
        with transaction.atomic():
            # Crear el Batch
            batch = Batch.objects.create(
                destiny=destiny,
                transport_agency=transport_agency,
                guide_number=guide_number
            )
            
            # Crear las Pulls y asociarlas al Batch
            created_pulls = []
            for pull_data in pulls_data:
                # Crear el Pull asociado al batch
                pull = Pull.objects.create(
                    common_destiny=destiny,  # Mismo destino que el batch
                    size=pull_data['size'],
                    transport_agency=transport_agency,
                    guide_number=guide_number,  # Heredar guide_number del lote
                    batch=batch
                )
                
                # Asociar paquetes
                package_ids = pull_data.get('package_ids', [])
                if package_ids:
                    packages = Package.objects.filter(id__in=package_ids)
                    packages.update(pull=pull)
                
                created_pulls.append(pull)
        
        # Retornar el batch creado con sus pulls
        batch.created_pulls = created_pulls
        return batch


class AutoDistributionConfigSerializer(serializers.Serializer):
    """Serializer para configuración de una saca en distribución automática"""
    size = serializers.ChoiceField(choices=Pull.SIZE_CHOICES)
    max_packages = serializers.IntegerField(
        min_value=1,
        help_text="Máximo de paquetes para esta saca"
    )


class BatchAutoDistributeSerializer(serializers.Serializer):
    """Serializer para crear lote con distribución automática de paquetes"""
    destiny = serializers.CharField(
        max_length=200,
        help_text="Destino común del lote"
    )
    transport_agency = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Agencia de transporte del lote (opcional)"
    )
    guide_number = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        help_text="Número de guía del lote (opcional)"
    )
    package_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="Lista de IDs de paquetes a distribuir"
    )
    pulls_config = serializers.ListField(
        child=AutoDistributionConfigSerializer(),
        min_length=1,
        help_text="Configuración de sacas para distribución"
    )
    
    def validate(self, data):
        """Validaciones globales"""
        from apps.packages.models import Package
        
        package_ids = data.get('package_ids', [])
        
        # Validar que no haya duplicados
        if len(package_ids) != len(set(package_ids)):
            raise serializers.ValidationError({
                'package_ids': 'No se pueden incluir paquetes duplicados'
            })
        
        # Validar que todos los paquetes existan y estén disponibles
        packages = Package.objects.filter(id__in=package_ids)
        if packages.count() != len(package_ids):
            raise serializers.ValidationError({
                'package_ids': 'Algunos paquetes no existen'
            })
        
        # Verificar que no tengan pull asignado
        packages_with_pull = packages.filter(pull__isnull=False)
        if packages_with_pull.exists():
            raise serializers.ValidationError({
                'package_ids': f'{packages_with_pull.count()} paquete(s) ya están asignados a otra saca'
            })
        
        # Validar agencia de transporte si se proporciona
        if data.get('transport_agency'):
            from apps.catalog.models import TransportAgency
            if not TransportAgency.objects.filter(id=data['transport_agency']).exists():
                raise serializers.ValidationError({
                    'transport_agency': 'La agencia de transporte no existe'
                })
        
        # Validar que la capacidad total sea suficiente
        pulls_config = data.get('pulls_config', [])
        total_capacity = sum(config['max_packages'] for config in pulls_config)
        if total_capacity < len(package_ids):
            raise serializers.ValidationError({
                'pulls_config': f'Capacidad total ({total_capacity}) insuficiente para {len(package_ids)} paquetes'
            })
        
        return data
    
    def create(self, validated_data):
        """Crear lote y distribuir paquetes automáticamente"""
        from apps.packages.models import Package
        from apps.catalog.models import TransportAgency
        from django.db import transaction
        
        destiny = validated_data['destiny']
        transport_agency_id = validated_data.get('transport_agency')
        guide_number = validated_data.get('guide_number', '')
        package_ids = validated_data['package_ids']
        pulls_config = validated_data['pulls_config']
        
        transport_agency = None
        if transport_agency_id:
            transport_agency = TransportAgency.objects.get(id=transport_agency_id)
        
        with transaction.atomic():
            # Crear el Batch
            batch = Batch.objects.create(
                destiny=destiny,
                transport_agency=transport_agency,
                guide_number=guide_number
            )
            
            # Obtener paquetes ordenados
            packages = list(Package.objects.filter(id__in=package_ids))
            package_index = 0
            created_pulls = []
            
            # Distribuir paquetes según configuración
            for config in pulls_config:
                if package_index >= len(packages):
                    break
                
                # Crear Pull
                pull = Pull.objects.create(
                    common_destiny=destiny,
                    size=config['size'],
                    transport_agency=transport_agency,
                    guide_number=guide_number,
                    batch=batch
                )
                
                # Asignar paquetes hasta el máximo configurado
                max_packages = config['max_packages']
                packages_for_pull = packages[package_index:package_index + max_packages]
                package_ids_for_pull = [pkg.id for pkg in packages_for_pull]
                
                if package_ids_for_pull:
                    Package.objects.filter(id__in=package_ids_for_pull).update(pull=pull)
                    package_index += len(packages_for_pull)
                
                created_pulls.append(pull)
        
        # Retornar el batch creado con información de distribución
        batch.created_pulls = created_pulls
        batch.distributed_packages = package_index
        return batch

