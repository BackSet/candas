"""
Sistema inteligente de recomendaciones para agencias de reparto.
Utiliza múltiples factores para sugerir la mejor agencia.
"""
from typing import List, Dict, Optional
from django.db.models import Q
from django.utils import timezone
from apps.catalog.models import DeliveryAgency, Location
from apps.packages.models import Package


class DeliveryAgencyRecommender:
    """
    Sistema inteligente de recomendaciones para agencias de reparto.
    Utiliza múltiples factores para sugerir la mejor agencia.
    """
    
    # Mapeo de variantes de ciudades a ciudad principal
    CITY_VARIANTS = {
        'QUITO SUR': 'QUITO',
        'QUITO NORTE': 'QUITO',
        'QUITO': 'QUITO',
        'GUAYAQUIL': 'GUAYAQUIL',
        'CUENCA': 'CUENCA',
        'AMBATO': 'AMBATO',
        'RIOBAMBA': 'RIOBAMBA',
        'LOJA': 'LOJA',
        'MANTA': 'MANTA',
        'PUYO': 'PUYO',
        'SUCUA': 'SUCUA',
        'MACAS': 'MACAS',
        'MENDEZ': 'MENDEZ',
        'SANTO DOMINGO': 'SANTO DOMINGO',
        'AZOGUES': 'AZOGUES',
        'NARANJAL': 'NARANJAL',
        'CAÑAR': 'CAÑAR',
        'VENTANAS': 'VENTANAS',
    }
    
    # Ciudades que pueden tener múltiples agencias
    MULTI_AGENCY_CITIES = ['QUITO', 'GUAYAQUIL', 'CUENCA']
    
    @staticmethod
    def normalize_city_name(city: str) -> str:
        """
        Normaliza el nombre de la ciudad, manejando variantes.
        
        Args:
            city: Nombre de ciudad (puede tener variantes)
            
        Returns:
            Nombre normalizado de la ciudad
        """
        if not city:
            return ''
        
        city_upper = city.strip().upper()
        
        # Buscar variante exacta
        if city_upper in DeliveryAgencyRecommender.CITY_VARIANTS:
            return DeliveryAgencyRecommender.CITY_VARIANTS[city_upper]
        
        # Buscar si contiene alguna variante
        for variant, normalized in DeliveryAgencyRecommender.CITY_VARIANTS.items():
            if variant in city_upper or city_upper in variant:
                return normalized
        
        # Si no encuentra variante, retornar normalizado
        return city_upper
    
    @staticmethod
    def get_recommendations(
        city: str,
        province: Optional[str] = None,
        limit: int = 5,
        include_stats: bool = True
    ) -> List[Dict]:
        """
        Obtiene recomendaciones de agencias de reparto para una ciudad.
        
        Args:
            city: Ciudad de destino
            province: Provincia (opcional, para mayor precisión)
            limit: Número máximo de recomendaciones
            include_stats: Si incluir estadísticas de uso
            
        Returns:
            Lista de diccionarios con recomendaciones ordenadas por score
        """
        if not city:
            return []
        
        # Normalizar ciudad
        normalized_city = DeliveryAgencyRecommender.normalize_city_name(city)
        
        # Buscar Location
        try:
            location = Location.objects.get(city__iexact=normalized_city)
        except Location.DoesNotExist:
            # Si no existe, buscar por nombre similar
            locations = Location.objects.filter(
                Q(city__icontains=normalized_city) |
                Q(city__icontains=city.upper())
            )
            if locations.exists():
                location = locations.first()
            else:
                return []
        
        # Obtener todas las agencias activas para esta ubicación
        agencies = DeliveryAgency.objects.filter(
            location=location,
            active=True
        ).select_related('location')
        
        if not agencies.exists():
            return []
        
        # Calcular score para cada agencia
        recommendations = []
        for agency in agencies:
            score = DeliveryAgencyRecommender._calculate_score(
                agency, normalized_city, include_stats
            )
            
            recommendation = {
                'agency': {
                    'id': str(agency.id),
                    'name': agency.name,
                    'city': agency.location.city,
                    'address': agency.address,
                    'phone_number': agency.phone_number,
                    'contact_person': agency.contact_person,
                },
                'score': score['total'],
                'score_breakdown': score,
                'match_type': DeliveryAgencyRecommender._get_match_type(
                    agency, normalized_city
                ),
            }
            
            recommendations.append(recommendation)
        
        # Ordenar por score descendente
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return recommendations[:limit]
    
    @staticmethod
    def _calculate_score(
        agency: DeliveryAgency,
        city: str,
        include_stats: bool = True
    ) -> Dict:
        """
        Calcula el score de recomendación para una agencia.
        
        Factores considerados:
        1. Match exacto de ciudad (100 puntos)
        2. Historial de uso (paquetes entregados) (hasta 50 puntos)
        3. Antigüedad (más antigua = más confiable) (hasta 20 puntos)
        4. Información completa (dirección, teléfono, contacto) (hasta 30 puntos)
        
        Args:
            agency: Instancia de DeliveryAgency
            city: Ciudad normalizada
            include_stats: Si incluir estadísticas en el cálculo
            
        Returns:
            Diccionario con score total y breakdown
        """
        score = {
            'base': 100,  # Match exacto de ciudad
            'usage': 0,
            'reliability': 0,
            'completeness': 0,
            'total': 100
        }
        
        # 1. Historial de uso (hasta 50 puntos)
        if include_stats:
            try:
                packages_count = Package.objects.filter(
                    delivery_agency=agency
                ).count()
                
                # Escalar: 0 paquetes = 0 puntos, 100+ paquetes = 50 puntos
                score['usage'] = min(packages_count / 2, 50)
            except Exception:
                pass
        
        # 2. Antigüedad/Confiabilidad (hasta 20 puntos)
        # Más antigua = más confiable
        days_active = (timezone.now() - agency.created_at).days
        score['reliability'] = min(days_active / 30, 20)  # 600 días = 20 puntos
        
        # 3. Completitud de información (hasta 30 puntos)
        completeness = 0
        if agency.address:
            completeness += 10
        if agency.phone_number:
            completeness += 10
        if agency.contact_person:
            completeness += 10
        score['completeness'] = completeness
        
        # Calcular total
        score['total'] = (
            score['base'] +
            score['usage'] +
            score['reliability'] +
            score['completeness']
        )
        
        return score
    
    @staticmethod
    def _get_match_type(agency: DeliveryAgency, city: str) -> str:
        """
        Determina el tipo de match.
        
        Returns:
            'exact', 'partial', 'coverage'
        """
        if agency.location.city.upper() == city.upper():
            return 'exact'
        return 'coverage'
    
    @staticmethod
    def get_best_recommendation(
        city: str,
        province: Optional[str] = None
    ) -> Optional[DeliveryAgency]:
        """
        Obtiene la mejor recomendación (la agencia con mayor score).
        
        Args:
            city: Ciudad de destino
            province: Provincia (opcional)
            
        Returns:
            DeliveryAgency o None
        """
        recommendations = DeliveryAgencyRecommender.get_recommendations(
            city, province, limit=1
        )
        
        if recommendations:
            agency_id = recommendations[0]['agency']['id']
            return DeliveryAgency.objects.get(id=agency_id)
        
        return None
    
    @staticmethod
    def get_all_recommendations_with_details(
        city: str,
        province: Optional[str] = None
    ) -> Dict:
        """
        Obtiene todas las recomendaciones con detalles completos.
        
        Returns:
            Dict con:
            - city: Ciudad normalizada
            - recommendations: Lista de recomendaciones
            - total_count: Total de agencias disponibles
            - has_multiple: Si hay múltiples opciones
        """
        normalized_city = DeliveryAgencyRecommender.normalize_city_name(city)
        recommendations = DeliveryAgencyRecommender.get_recommendations(
            city, province, limit=10, include_stats=True
        )
        
        return {
            'city': normalized_city,
            'original_city': city,
            'recommendations': recommendations,
            'total_count': len(recommendations),
            'has_multiple': len(recommendations) > 1,
            'best_match': recommendations[0] if recommendations else None
        }

