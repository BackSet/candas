"""
Service for managing delivery agency suggestions and operations.
"""
from typing import List, Optional
from django.db.models import Q
from apps.catalog.models import DeliveryAgency


class DeliveryAgencyService:
    """Service class for DeliveryAgency operations."""
    
    @staticmethod
    def suggest_delivery_agency(city: str, province: Optional[str] = None) -> Optional[DeliveryAgency]:
        """
        Suggests a delivery agency based on the destination city and optionally province.
        
        Matching logic:
        1. First tries to find an exact match with the city
        2. If province is provided, also checks if city is in coverage zones
        3. Returns the most recently created active agency if multiple matches
        
        Args:
            city: Destination city name
            province: Optional province name
            
        Returns:
            DeliveryAgency instance or None if no match found
        """
        if not city:
            return None
            
        # Normalize city for comparison
        city_normalized = city.strip().upper()
        
        # Build query to find agencies
        # Priority 1: Agency whose main city matches
        agencies = DeliveryAgency.objects.filter(
            active=True,
            city__iexact=city
        ).order_by('-created_at')
        
        if agencies.exists():
            return agencies.first()
        
        # Priority 2: Check if city is in coverage zones
        agencies_with_coverage = DeliveryAgencyService.find_agencies_by_coverage(city_normalized)
        if agencies_with_coverage:
            return agencies_with_coverage[0]
        
        return None
    
    @staticmethod
    def find_agencies_by_coverage(city: str) -> List[DeliveryAgency]:
        """
        Finds all active agencies that cover a specific city.
        
        Args:
            city: City name to search in coverage zones
            
        Returns:
            List of DeliveryAgency instances that cover the city
        """
        city_normalized = city.strip().upper()
        
        # Get all active agencies and filter by coverage zones
        agencies = DeliveryAgency.objects.filter(active=True)
        matching_agencies = []
        
        for agency in agencies:
            coverage_zones = agency.get_coverage_zones_list()
            # Normalize and compare coverage zones
            if any(city_normalized in zone.strip().upper() for zone in coverage_zones):
                matching_agencies.append(agency)
        
        return matching_agencies
    
    @staticmethod
    def get_agencies_for_city(city: str) -> List[DeliveryAgency]:
        """
        Gets all possible delivery agencies for a city (both main city and coverage).
        
        Args:
            city: City name
            
        Returns:
            List of DeliveryAgency instances
        """
        if not city:
            return []
        
        city_normalized = city.strip().upper()
        
        # Get agencies where city matches
        direct_match = list(DeliveryAgency.objects.filter(
            active=True,
            city__iexact=city
        ))
        
        # Get agencies with city in coverage
        coverage_match = DeliveryAgencyService.find_agencies_by_coverage(city_normalized)
        
        # Combine and deduplicate
        all_agencies = {agency.id: agency for agency in direct_match + coverage_match}
        
        return list(all_agencies.values())
    
    @staticmethod
    def get_all_active_agencies() -> List[DeliveryAgency]:
        """
        Gets all active delivery agencies.
        
        Returns:
            QuerySet of active DeliveryAgency instances
        """
        return DeliveryAgency.objects.filter(active=True).order_by('city', 'name')
    
    @staticmethod
    def validate_coverage(agency: DeliveryAgency, city: str) -> bool:
        """
        Validates if an agency covers a specific city.
        
        Args:
            agency: DeliveryAgency instance
            city: City name to validate
            
        Returns:
            True if agency covers the city, False otherwise
        """
        if not agency or not city:
            return False
        
        city_normalized = city.strip().upper()
        
        # Check if it's the main city
        if agency.city.strip().upper() == city_normalized:
            return True
        
        # Check coverage zones
        coverage_zones = agency.get_coverage_zones_list()
        return any(city_normalized in zone.strip().upper() for zone in coverage_zones)
