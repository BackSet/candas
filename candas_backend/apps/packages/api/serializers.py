"""
Serializers para el módulo de Packages
"""
from rest_framework import serializers
from ..models import Package, PackageImport


class PackageListSerializer(serializers.ModelSerializer):
    """Serializer para listar Packages (versión ligera)"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pull_info = serializers.SerializerMethodField()
    batch_info = serializers.SerializerMethodField()
    city_province = serializers.SerializerMethodField()
    shipment_type = serializers.SerializerMethodField()
    shipment_type_display = serializers.SerializerMethodField()
    transport_agency_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Package
        fields = [
            'id',
            'guide_number',
            'nro_master',
            'name',
            'address',
            'city',
            'province',
            'phone_number',
            'city_province',
            'status',
            'status_display',
            'notes',
            'hashtags',
            'pull',
            'pull_info',
            'batch_info',
            'shipment_type',
            'shipment_type_display',
            'transport_agency_name',
            'agency_guide_number',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_pull_info(self, obj):
        """Información básica del Pull asociado"""
        if obj.pull:
            return {
                'id': str(obj.pull.id),
                'common_destiny': obj.pull.common_destiny,
                'size': obj.pull.size,
            }
        return None
    
    def get_batch_info(self, obj):
        """Información del batch si el paquete está en una saca que pertenece a un lote"""
        batch = obj.get_batch()
        if batch:
            return {
                'id': str(batch.id),
                'destiny': batch.destiny,
                'guide_number': batch.guide_number,
            }
        return None
    
    def get_city_province(self, obj):
        """Ciudad y provincia combinadas"""
        return f"{obj.city}, {obj.province}"
    
    def get_shipment_type(self, obj):
        """Retorna: 'sin_asignar', 'individual', 'saca', o 'lote'"""
        return obj.get_shipment_type()
    
    def get_shipment_type_display(self, obj):
        """Retorna nombre legible del tipo de envío"""
        return obj.get_shipment_type_display()
    
    def get_transport_agency_name(self, obj):
        """Retorna el nombre de la agencia de transporte"""
        if obj.transport_agency:
            return obj.transport_agency.name
        return None


class PackageDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para Package"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pull_info = serializers.SerializerMethodField()
    transport_agency_info = serializers.SerializerMethodField()
    delivery_agency_info = serializers.SerializerMethodField()
    parent_info = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    
    # Campos de jerarquía
    is_child = serializers.SerializerMethodField()
    is_parent = serializers.SerializerMethodField()
    has_hierarchy = serializers.SerializerMethodField()
    hierarchy_level = serializers.SerializerMethodField()
    root_parent_info = serializers.SerializerMethodField()
    
    # Campos efectivos (heredados desde pull/batch o propios)
    effective_transport_agency = serializers.SerializerMethodField()
    effective_guide_number = serializers.SerializerMethodField()
    effective_destiny = serializers.SerializerMethodField()
    batch_info = serializers.SerializerMethodField()
    data_source = serializers.SerializerMethodField()
    shipment_type = serializers.SerializerMethodField()
    shipment_type_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Package
        fields = [
            'id',
            'guide_number',
            'nro_master',
            'agency_guide_number',
            'name',
            'address',
            'city',
            'province',
            'phone_number',
            'status',
            'status_display',
            'notes',
            'hashtags',
            'pull',
            'pull_info',
            'transport_agency',
            'transport_agency_info',
            'delivery_agency',
            'delivery_agency_info',
            'parent',
            'parent_info',
            'children_count',
            'is_child',
            'is_parent',
            'has_hierarchy',
            'hierarchy_level',
            'root_parent_info',
            'effective_transport_agency',
            'effective_guide_number',
            'effective_destiny',
            'batch_info',
            'data_source',
            'shipment_type',
            'shipment_type_display',
            'guide_history',
            'status_history',
            'notes_history',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'guide_history',
            'status_history',
            'notes_history',
            'created_at',
            'updated_at',
        ]
    
    def get_pull_info(self, obj):
        if obj.pull:
            return {
                'id': str(obj.pull.id),
                'common_destiny': obj.pull.common_destiny,
                'size': obj.pull.size,
            }
        return None
    
    def get_transport_agency_info(self, obj):
        if obj.transport_agency:
            return {
                'id': str(obj.transport_agency.id),
                'name': obj.transport_agency.name,
            }
        return None
    
    def get_delivery_agency_info(self, obj):
        if obj.delivery_agency:
            return {
                'id': str(obj.delivery_agency.id),
                'name': obj.delivery_agency.name,
            }
        return None
    
    def get_parent_info(self, obj):
        if obj.parent:
            return {
                'id': str(obj.parent.id),
                'guide_number': obj.parent.guide_number,
                'name': obj.parent.name,
            }
        return None
    
    def get_children_count(self, obj):
        return obj.children.count()
    
    def get_is_child(self, obj):
        """Retorna True si el paquete es hijo (tiene padre)"""
        return obj.is_child()
    
    def get_is_parent(self, obj):
        """Retorna True si el paquete es padre (tiene hijos)"""
        return obj.is_parent()
    
    def get_has_hierarchy(self, obj):
        """Retorna True si el paquete tiene jerarquía (es padre o es hijo)"""
        return obj.has_hierarchy()
    
    def get_hierarchy_level(self, obj):
        """Retorna el nivel de jerarquía (0 = raíz, 1 = hijo, 2 = nieto, etc.)"""
        return obj.get_hierarchy_level()
    
    def get_root_parent_info(self, obj):
        """Retorna información del paquete raíz (ancestro más antiguo)"""
        root = obj.get_root_parent()
        if root.id != obj.id:  # Solo si no es el mismo
            return {
                'id': str(root.id),
                'guide_number': root.guide_number,
                'name': root.name,
            }
        return None
    
    def get_effective_transport_agency(self, obj):
        """Retorna la agencia de transporte efectiva (de batch/pull/package)"""
        agency = obj.get_shipping_agency()
        if agency:
            return {
                'id': str(agency.id),
                'name': agency.name,
            }
        return None
    
    def get_effective_guide_number(self, obj):
        """Retorna el número de guía efectivo (de batch/pull/package)"""
        return obj.get_shipping_guide_number()
    
    def get_effective_destiny(self, obj):
        """Retorna el destino efectivo (de batch/pull/package)"""
        return obj.get_effective_destiny()
    
    def get_batch_info(self, obj):
        """Información del batch si el paquete está en una saca que pertenece a un lote"""
        batch = obj.get_batch()
        if batch:
            return {
                'id': str(batch.id),
                'destiny': batch.destiny,
                'guide_number': batch.guide_number,
            }
        return None
    
    def get_data_source(self, obj):
        """Retorna el origen de cada dato (batch/pull/package)"""
        return obj.get_data_source()
    
    def get_shipment_type(self, obj):
        """Retorna: 'sin_asignar', 'individual', 'saca', o 'lote'"""
        return obj.get_shipment_type()
    
    def get_shipment_type_display(self, obj):
        """Retorna nombre legible del tipo de envío"""
        return obj.get_shipment_type_display()


class PackageCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear Packages"""
    
    class Meta:
        model = Package
        fields = [
            'guide_number',
            'nro_master',
            'agency_guide_number',
            'name',
            'address',
            'city',
            'province',
            'phone_number',
            'status',
            'notes',
            'hashtags',
            'transport_agency',
            'delivery_agency',
            'parent',
            'pull',
        ]
    
    def validate_guide_number(self, value):
        """Validar que guide_number sea único"""
        if self.instance and self.instance.guide_number == value:
            return value
        
        if Package.objects.filter(guide_number=value).exists():
            raise serializers.ValidationError(
                "Este número de guía ya existe."
            )
        return value
    
    def validate_status(self, value):
        """Validar estado"""
        valid_statuses = [choice[0] for choice in Package.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Estado inválido. Opciones: {', '.join(valid_statuses)}"
            )
        return value
    
    def validate(self, data):
        """Validar que no haya conflictos con la jerarquía"""
        # Normalizar ForeignKeys: convertir cadenas vacías a None
        foreign_key_fields = ['parent', 'pull', 'transport_agency', 'delivery_agency']
        for field in foreign_key_fields:
            if field in data:
                field_value = data.get(field)
                if field_value == '' or field_value is None:
                    data[field] = None
                elif isinstance(field_value, str):
                    # Si es una cadena, intentar convertirla a UUID
                    try:
                        from uuid import UUID
                        UUID(field_value)  # Validar que sea un UUID válido
                    except (ValueError, TypeError):
                        raise serializers.ValidationError({
                            field: f'El ID de {field} no es válido'
                        })
        
        # Obtener el pull actual (del data o de la instancia)
        # Si pull está en data, usar el valor normalizado; si no, usar el de la instancia
        pull = data.get('pull') if 'pull' in data else None
        if pull is None and self.instance:
            pull = self.instance.pull
        
        # Si está asignado a una saca, no debe tener transport_agency ni agency_guide_number propios
        if pull:
            # Verificar si se está intentando asignar transport_agency
            transport_agency_value = data.get('transport_agency') if 'transport_agency' in data else None
            if transport_agency_value:
                raise serializers.ValidationError({
                    'transport_agency': 'No puede asignar agencia si el paquete está en una saca (heredará de la saca/lote)'
                })
            
            # Verificar si se está intentando asignar agency_guide_number
            agency_guide_number_value = data.get('agency_guide_number') if 'agency_guide_number' in data else None
            if agency_guide_number_value:
                raise serializers.ValidationError({
                    'agency_guide_number': 'No puede asignar número de guía si el paquete está en una saca (heredará de la saca/lote)'
                })
        
        # Validar que no se cree un ciclo con el parent
        # Solo validar si parent está siendo asignado (no si es None o no está en data)
        if 'parent' in data:
            parent = data.get('parent')
            if parent is not None and parent != '':
                # Obtener el ID del parent (puede venir como instancia o como ID)
                parent_id = parent.id if hasattr(parent, 'id') else parent
                
                # Si estamos editando, no puede ser su propio parent
                if self.instance and str(self.instance.id) == str(parent_id):
                    raise serializers.ValidationError({
                        'parent': 'Un paquete no puede ser su propio parent'
                    })
                
                # Verificar que no se cree un ciclo (A->B->A o más complejo)
                current_package_id = self.instance.id if self.instance else None
                if self._would_create_cycle(parent_id, current_package_id):
                    raise serializers.ValidationError({
                        'parent': 'No se puede asignar este parent porque crearía un ciclo en la jerarquía'
                    })
        
        return data
    
    def _would_create_cycle(self, parent_package, current_package_id):
        """
        Verifica si asignar parent_package como parent del paquete actual crearía un ciclo.
        
        Args:
            parent_package: El paquete que se quiere asignar como parent (puede ser ID o instancia)
            current_package_id: ID del paquete actual (None si es creación)
        
        Returns:
            bool: True si se crearía un ciclo, False en caso contrario
        """
        if not current_package_id:
            # Si es creación, no puede haber ciclo porque el paquete aún no existe
            return False
        
        # Obtener la instancia del parent si es necesario
        if isinstance(parent_package, str):
            try:
                parent_package = Package.objects.get(id=parent_package)
            except Package.DoesNotExist:
                return False
        
        # Verificar toda la cadena de parents del parent_package
        visited = set()
        current = parent_package
        
        while current:
            # Si encontramos el paquete actual en la cadena, hay un ciclo
            if str(current.id) == str(current_package_id):
                return True
            
            # Si ya visitamos este paquete, hay un ciclo (aunque no debería pasar con la estructura actual)
            if str(current.id) in visited:
                return True
            
            visited.add(str(current.id))
            
            # Si el parent tiene un parent, seguir la cadena
            # Necesitamos refrescar desde la BD para obtener el parent relacionado
            if hasattr(current, 'parent_id') and current.parent_id:
                try:
                    current = Package.objects.get(id=current.parent_id)
                except Package.DoesNotExist:
                    break
            elif hasattr(current, 'parent') and current.parent:
                current = current.parent
            else:
                break
        
        return False


class PackageImportSerializer(serializers.ModelSerializer):
    """Serializer para PackageImport"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = PackageImport
        fields = [
            'id',
            'file',
            'status',
            'status_display',
            'total_rows',
            'successful_imports',
            'failed_imports',
            'success_rate',
            'error_log',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'total_rows',
            'successful_imports',
            'failed_imports',
            'error_log',
            'created_at',
            'updated_at',
        ]
    
    def get_success_rate(self, obj):
        """Calcular tasa de éxito"""
        if obj.total_rows > 0:
            return round((obj.successful_imports / obj.total_rows) * 100, 2)
        return 0


class ImportRequestSerializer(serializers.Serializer):
    """Serializer para solicitud de importación de paquetes"""
    file = serializers.FileField(
        help_text='Archivo Excel (.xlsx, .xls) o CSV (.csv) con los paquetes a importar'
    )
    selected_fields = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
        help_text='Lista de campos opcionales a importar (además de los obligatorios)'
    )


