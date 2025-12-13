"""
Registry para registrar adapters de manifiesto automáticamente.
Permite agregar nuevos tipos sin modificar código existente.
"""
from typing import Dict, Type, List
from apps.shared.services.manifest_adapters import ManifestAdapter


class ManifestRegistry:
    """Registry centralizado de adapters de manifiesto."""
    
    _adapters: Dict[str, Type[ManifestAdapter]] = {}
    
    @classmethod
    def register(cls, entity_type: str, adapter_class: Type[ManifestAdapter]):
        """
        Registra un adapter para un tipo de entidad.
        
        Args:
            entity_type: Nombre del tipo (ej: 'batch', 'pull', 'dispatch')
            adapter_class: Clase del adapter
        """
        cls._adapters[entity_type.lower()] = adapter_class
    
    @classmethod
    def get_adapter(cls, entity_type: str) -> ManifestAdapter:
        """
        Obtiene una instancia del adapter para un tipo de entidad.
        
        Args:
            entity_type: Nombre del tipo
            
        Returns:
            Instancia del adapter
            
        Raises:
            ValueError: Si el tipo no está registrado
        """
        adapter_class = cls._adapters.get(entity_type.lower())
        if not adapter_class:
            raise ValueError(f"No hay adapter registrado para '{entity_type}'")
        return adapter_class()
    
    @classmethod
    def get_adapter_for_entity(cls, entity) -> ManifestAdapter:
        """
        Obtiene el adapter apropiado basándose en el tipo de la entidad.
        
        Args:
            entity: Instancia de la entidad
            
        Returns:
            Instancia del adapter
        """
        entity_type = type(entity).__name__.lower()
        return cls.get_adapter(entity_type)
    
    @classmethod
    def is_registered(cls, entity_type: str) -> bool:
        """Verifica si un tipo está registrado."""
        return entity_type.lower() in cls._adapters
    
    @classmethod
    def list_registered(cls) -> List[str]:
        """Lista todos los tipos registrados."""
        return list(cls._adapters.keys())


# Auto-registro de adapters
from apps.shared.services.manifest_adapters import (
    BatchManifestAdapter,
    PullManifestAdapter,
    DispatchManifestAdapter,
    PackageManifestAdapter
)

ManifestRegistry.register('batch', BatchManifestAdapter)
ManifestRegistry.register('pull', PullManifestAdapter)
ManifestRegistry.register('dispatch', DispatchManifestAdapter)
ManifestRegistry.register('package', PackageManifestAdapter)

