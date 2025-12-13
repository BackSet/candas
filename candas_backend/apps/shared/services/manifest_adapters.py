"""
Sistema de adaptadores para generación automática de manifiestos.
Cada tipo de entidad implementa este adapter para definir cómo extraer su información.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any
from collections import defaultdict
from apps.shared.services.manifest_template import BaseManifestGenerator


class ManifestAdapter(ABC):
    """
    Interfaz que deben implementar todos los adapters de manifiesto.
    Define cómo extraer información de cualquier entidad para generar manifiestos.
    """
    
    @abstractmethod
    def get_title(self) -> str:
        """Retorna el título del manifiesto (ej: 'MANIFIESTO DE LOTE')"""
        pass
    
    @abstractmethod
    def get_info_fields(self, entity) -> List[tuple]:
        """
        Retorna lista de tuplas (label, value) con información de la entidad.
        Ej: [('Destino:', 'QUITO'), ('Agencia:', 'Servientrega')]
        """
        pass
    
    @abstractmethod
    def get_packages(self, entity) -> List[Any]:
        """
        Retorna lista de paquetes asociados a la entidad.
        Puede retornar paquetes directamente o agrupados como lista de dicts.
        Formato agrupado: [{'group_key': '...', 'group_label': '...', 'packages': [...]}, ...]
        Formato simple: [package1, package2, ...]
        """
        pass
    
    def get_grouping_key(self, package) -> Optional[str]:
        """
        Retorna la clave para agrupar paquetes (ej: agencia, saca, destino).
        Si retorna None, no se agrupa.
        Por defecto retorna None (no agrupa).
        """
        return None
    
    def get_group_header(self, group_key, group_packages) -> str:
        """
        Retorna el encabezado para un grupo de paquetes.
        Ej: 'AGENCIA: Servientrega' o 'SACA 1 de 5'
        Por defecto retorna string vacío.
        """
        return ""
    
    def get_group_info(self, group_key, group_packages) -> List[tuple]:
        """
        Retorna información adicional del grupo (opcional).
        Por defecto retorna lista vacía.
        """
        return []
    
    def should_group(self) -> bool:
        """Indica si los paquetes deben agruparse. Por defecto False."""
        return False


class BatchManifestAdapter(ManifestAdapter):
    """Adapter para generar manifiestos de lotes."""
    
    def get_title(self) -> str:
        return "MANIFIESTO DE LOTE"
    
    def get_info_fields(self, batch) -> List[tuple]:
        return [
            ('Destino:', batch.destiny),
            ('Agencia de Transporte:', batch.transport_agency.name if batch.transport_agency else 'Sin asignar'),
            ('Número de Guía de Transporte:', batch.guide_number or 'Sin guía'),
            ('Fecha:', BaseManifestGenerator.format_datetime_now()),
            ('Total Sacas:', str(batch.get_pull_count())),
            ('Total Paquetes:', str(batch.get_total_packages())),
        ]
    
    def get_packages(self, batch):
        """Retorna paquetes agrupados por saca, ordenados y con nomenclatura SACA X/Y."""
        from apps.packages.models import Package
        # Obtener sacas ordenadas por fecha de creación
        pulls = list(batch.pulls.all().order_by('created_at'))
        total_pulls = len(pulls)
        result = []
        
        # Iterar con índice para numeración correcta
        for idx, pull in enumerate(pulls, 1):
            packages = Package.objects.filter(pull=pull).order_by('guide_number')
            if packages.exists():
                result.append({
                    'group_key': f'pull_{pull.id}',
                    'group_label': f'SACA {idx}/{total_pulls}',
                    'group_info': [
                        ('Destino:', pull.get_effective_destiny()),
                        ('Tamaño:', pull.get_size_display()),
                        ('Guía:', pull.get_effective_guide_number() or 'Sin guía'),
                    ],
                    'packages': list(packages)
                })
        return result
    
    def get_grouping_key(self, package):
        return None  # Ya viene agrupado por saca
    
    def get_group_header(self, group_key, group_packages):
        return ""
    
    def should_group(self) -> bool:
        return True  # Los paquetes ya vienen agrupados por saca


class PullManifestAdapter(ManifestAdapter):
    """Adapter para generar manifiestos de sacas."""
    
    def get_title(self) -> str:
        return "MANIFIESTO DE SACA"
    
    def get_info_fields(self, pull) -> List[tuple]:
        effective_agency = pull.get_effective_agency()
        effective_guide = pull.get_effective_guide_number()
        effective_destiny = pull.get_effective_destiny()
        
        return [
            ('Destino:', effective_destiny),
            ('Agencia de Transporte:', effective_agency.name if effective_agency else 'Sin asignar'),
            ('Número de Guía de Transporte:', effective_guide or 'Sin guía'),
            ('Tamaño:', pull.get_size_display()),
            ('Fecha:', BaseManifestGenerator.format_datetime_now()),
            ('Cantidad de Paquetes:', str(pull.packages.count())),
        ]
    
    def get_packages(self, pull):
        """Retorna paquetes directamente (sin agrupación)."""
        return list(pull.packages.all().order_by('guide_number'))
    
    def get_grouping_key(self, package):
        return None  # No se agrupa
    
    def get_group_header(self, group_key, group_packages):
        return ""
    
    def should_group(self) -> bool:
        return False


class DispatchManifestAdapter(ManifestAdapter):
    """Adapter para generar manifiestos de despachos."""
    
    def get_title(self) -> str:
        return "MANIFIESTO DE DESPACHO"
    
    def get_info_fields(self, dispatch) -> List[tuple]:
        from apps.packages.models import Package
        
        total_pulls = dispatch.pulls.count()
        total_individual = dispatch.packages.count()
        packages_in_pulls = sum(
            Package.objects.filter(pull=pull).count()
            for pull in dispatch.pulls.all()
        )
        total_packages = packages_in_pulls + total_individual
        
        info = [
            ('Fecha de Despacho:', dispatch.dispatch_date.strftime('%d/%m/%Y')),
            ('Estado:', dispatch.get_status_display()),
            ('Fecha de Generación:', BaseManifestGenerator.format_datetime_now()),
            ('Total Sacas:', total_pulls),
            ('Total Paquetes Individuales:', total_individual),
            ('Total Paquetes (incluyendo en sacas):', total_packages),
        ]
        
        if dispatch.notes:
            info.append(('Notas:', dispatch.notes))
        
        return info
    
    def get_packages(self, dispatch):
        """Retorna paquetes agrupados por agencia de transporte."""
        from apps.packages.models import Package
        
        # Agrupar sacas por agencia
        agency_pulls = defaultdict(list)
        for pull in dispatch.pulls.select_related('transport_agency', 'batch__transport_agency').all():
            agency = pull.get_effective_agency()
            agency_pulls[agency].append(pull)
        
        # Agrupar paquetes individuales por agencia
        agency_individual = defaultdict(list)
        for package in dispatch.packages.select_related('transport_agency').all():
            agency = package.get_shipping_agency()
            agency_individual[agency].append(package)
        
        # Combinar y estructurar
        result = []
        all_agencies = set(list(agency_pulls.keys()) + list(agency_individual.keys()))
        
        # Ordenar agencias (None al final)
        sorted_agencies = sorted(
            [a for a in all_agencies if a],
            key=lambda x: x.name
        )
        if None in all_agencies:
            sorted_agencies.append(None)
        
        for agency in sorted_agencies:
            agency_name = agency.name if agency else "Sin Agencia Asignada"
            
            # Sacas de esta agencia
            pulls = agency_pulls.get(agency, [])
            for pull in pulls:
                packages = Package.objects.filter(pull=pull).order_by('guide_number')
                if packages.exists():
                    result.append({
                        'group_key': f'agency_{agency.id if agency else "none"}_pull_{pull.id}',
                        'group_label': f'AGENCIA: {agency_name} - Saca: {pull.get_effective_destiny()}',
                        'group_info': [
                            ('Destino:', pull.get_effective_destiny()),
                            ('Tamaño:', pull.get_size_display()),
                            ('Guía:', pull.get_effective_guide_number() or 'Sin guía'),
                        ],
                        'packages': list(packages)
                    })
            
            # Paquetes individuales de esta agencia
            individual = agency_individual.get(agency, [])
            if individual:
                result.append({
                    'group_key': f'agency_{agency.id if agency else "none"}_individual',
                    'group_label': f'AGENCIA: {agency_name} - PAQUETES INDIVIDUALES',
                    'group_info': [
                        ('Cantidad:', str(len(individual))),
                    ],
                    'packages': individual
                })
        
        return result
    
    def get_grouping_key(self, package):
        return None  # Ya viene agrupado
    
    def get_group_header(self, group_key, group_packages):
        return ""
    
    def should_group(self) -> bool:
        return True


class PackageManifestAdapter(ManifestAdapter):
    """Adapter para generar manifiestos de paquetes individuales."""
    
    def get_title(self) -> str:
        return "MANIFIESTO DE PAQUETE INDIVIDUAL"
    
    def get_info_fields(self, package) -> List[tuple]:
        effective_agency = package.get_shipping_agency()
        effective_guide = package.get_shipping_guide_number()
        effective_destiny = package.get_effective_destiny()
        
        return [
            ('Destino:', effective_destiny),
            ('Agencia de Transporte:', effective_agency.name if effective_agency else 'Sin asignar'),
            ('Número de Guía de Transporte:', effective_guide or 'Sin guía'),
            ('Fecha:', BaseManifestGenerator.format_datetime_now()),
            ('Ciudad:', package.city),
            ('Provincia:', package.province),
        ]
    
    def get_packages(self, package):
        """Retorna el paquete directamente (sin agrupación)."""
        return [package]
    
    def get_grouping_key(self, package):
        return None  # No se agrupa
    
    def get_group_header(self, group_key, group_packages):
        return ""
    
    def should_group(self) -> bool:
        return False

