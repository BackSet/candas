"""
Management command para importar las agencias de reparto desde los datos proporcionados.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.catalog.models import Location, DeliveryAgency
from apps.catalog.services.delivery_agency_recommender import DeliveryAgencyRecommender


class Command(BaseCommand):
    help = 'Importa agencias de reparto desde datos proporcionados'
    
    AGENCIES_DATA = [
        {
            'city': 'QUITO SUR',
            'name': 'MV SERVICES BODEGA QUITO SUR',
            'address': 'CALLE LA COCHA Y S45A (LOS GIRASOLES DEL SUR CONJUNTO 4 CASA 2)',
            'phone': '959761711',
            'contact': '',
            'province': 'PICHINCHA'
        },
        {
            'city': 'PUYO',
            'name': 'PAQUETE EXPRESS',
            'address': 'AV. 20 DE JULIO Y BOLIVAR A MEDIA CUADRA DEL BANCO GUAYAQUIL',
            'phone': '994497659',
            'contact': 'JENNY PALOMEQUE',
            'province': 'PASTAZA'
        },
        {
            'city': 'SUCUA',
            'name': 'SERVI ENVIOS',
            'address': 'CARLOS OLSON Y SOR MARIA TRONCATI FRENTE A LA ESCUELA MERCEDES NAVARRATE',
            'phone': '982574933',
            'contact': 'MAYRA LOPEZ',
            'province': 'MORONA SANTIAGO'
        },
        {
            'city': 'MACAS',
            'name': 'Agencia Macas',
            'address': 'AV. 24 DE MAYO Y 10 DE AGOSTO',
            'phone': '',
            'contact': '',
            'province': 'MORONA SANTIAGO'
        },
        {
            'city': 'MENDEZ',
            'name': 'MV COURIER',
            'address': 'AV. FRANCISCO DE ORELLANA Y ABDÓN CALDERÓN',
            'phone': '997126983',
            'contact': 'JESSICA LEÓN',
            'province': 'MORONA SANTIAGO'
        },
        {
            'city': 'CUENCA',
            'name': 'NEXO COURIER',
            'address': 'JAIME ROLDOS 3.47 Y GUAPONDELIG SECTOR MERCADO 12 DE ABRIL',
            'phone': '990425955',
            'contact': 'LORGIA AGUILAR',
            'province': 'AZUAY'
        },
        {
            'city': 'LOJA',
            'name': 'NEXO COURIER',
            'address': 'PASAJE SINCHONA 205 53 Y ROCAFUERTE TRAS LA ESCUELA MIGUEL ANGEL SUAREZ',
            'phone': '980040107',
            'contact': 'ROMEL AGUILAR',
            'province': 'LOJA'
        },
        {
            'city': 'QUITO NORTE',
            'name': 'MV COURIER',
            'address': 'SECTOR LA OFELIA, BELLAVISTA Y LAS CASCADAS',
            'phone': '980906544',
            'contact': 'CAROLINA /SAMANTHA MALUSIN',
            'province': 'PICHINCHA'
        },
        {
            'city': 'RIOBAMBA',
            'name': 'RIO IMPORTACIONES Y LOGISTICA',
            'address': 'PICHINCHA Y JUNIN A LOS ALTOS DEL COMERCIAL MORENO E HIJOS',
            'phone': '989696827',
            'contact': 'CRISTHIAN VILLACIS BETANCOURT',
            'province': 'CHIMBORAZO'
        },
        {
            'city': 'SANTO DOMINGO',
            'name': 'EBCACOURIER',
            'address': 'CALLE TULCAN ENTRE 6 DE NOVIEMBRE Y EDMUNDO CATFORT',
            'phone': '978928005',
            'contact': 'EDGAR BRAVO',
            'province': 'SANTO DOMINGO DE LOS TSÁCHILAS'
        },
        {
            'city': 'AZOGUES',
            'name': 'ÁNTIGO CAFETERÍA',
            'address': 'SIMON BOLIVAR Y TENEMAZA DIAGONAL A LA FARMACIA SANA SANA',
            'phone': '989069409',
            'contact': 'ESTEBAN HELGUERO',
            'province': 'CAÑAR'
        },
        {
            'city': 'NARANJAL',
            'name': 'MUNDI CARGO',
            'address': 'CALLE BOLIVAR Y TARQUI FRENTE AL MUNICIPIO',
            'phone': '0988964325',  # Corregido: O988964325 -> 0988964325
            'contact': 'AZUCENA LLIVICHUZHCA PERO SE ATIENDE ALLA BELEN ONOFRE',
            'province': 'GUAYAS'
        },
        {
            'city': 'MANTA',
            'name': 'SOLCOURIER',
            'address': 'BARRIO JOCAY J4 y J5 DIAGONAL AL SINDICATO DE TRAAJADORES DE INEPACA',
            'phone': '987729016',
            'contact': 'Jessenia Carolina Rivas Chavez',
            'province': 'MANABÍ'
        },
        {
            'city': 'CAÑAR',
            'name': 'CAÑAR EXPRESS',
            'address': 'PANAMERICANA Y JAIME ROLDOS',
            'phone': '983970121',
            'contact': 'AZUCENA LLIVICHUZHCA PERO SE ATIENDE DANNY MOROCHO UCULALA',
            'province': 'CAÑAR'
        },
        {
            'city': 'AMBATO',
            'name': 'NARU XPRESS',
            'address': 'AV.ATAHUALPA, DIAGONAL AL AKI, FRENTE AL BANCO INTERNACIONAL',
            'phone': '979156735',
            'contact': 'ANGELA RUTH ESTRELLA LOZADA',
            'province': 'TUNGURAHUA'
        },
        {
            'city': 'GUAYAQUIL',
            'name': 'Agencia Guayaquil',
            'address': 'AV DEL EJERCITO 33-03 Y COLOMBIA',
            'phone': '959244473',
            'contact': 'MARJORIE',
            'province': 'GUAYAS'
        },
        {
            'city': 'VENTANAS',
            'name': 'CALZADOS NIÑA MIA',
            'address': '10 DE AGOSTO Y SUCRE',
            'phone': '963207737',
            'contact': 'RONALD ENRIQUE UCHUARI MONTAÑO',
            'province': 'LOS RÍOS'
        },
    ]
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Importando agencias de reparto...'))
        self.stdout.write('=' * 60)
        
        created_count = 0
        updated_count = 0
        errors = []
        
        for agency_data in self.AGENCIES_DATA:
            try:
                # Normalizar ciudad
                normalized_city = DeliveryAgencyRecommender.normalize_city_name(
                    agency_data['city']
                )
                
                # Obtener o crear Location
                location, location_created = Location.objects.get_or_create(
                    city=normalized_city,
                    defaults={'province': agency_data.get('province', 'N/A')}
                )
                
                if location_created:
                    self.stdout.write(
                        self.style.WARNING(f'📍 Creada ubicación: {normalized_city}')
                    )
                
                # Si no hay nombre, usar ciudad como nombre
                name = agency_data['name'] or f'Agencia {normalized_city}'
                
                # Limpiar teléfono (remover 'O' al inicio)
                phone = agency_data.get('phone', '').replace('O', '0').strip()
                
                # Crear o actualizar agencia
                agency, created = DeliveryAgency.objects.update_or_create(
                    location=location,
                    name=name,
                    defaults={
                        'address': agency_data.get('address', ''),
                        'phone_number': phone,
                        'contact_person': agency_data.get('contact', ''),
                        'active': True
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Creada: {agency}')
                    )
                else:
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'↻ Actualizada: {agency}')
                    )
                    
            except Exception as e:
                error_msg = f"Error con {agency_data.get('city', 'N/A')}: {str(e)}"
                errors.append(error_msg)
                self.stdout.write(self.style.ERROR(f'❌ {error_msg}'))
        
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('📊 RESUMEN'))
        self.stdout.write('=' * 60)
        self.stdout.write(self.style.SUCCESS(
            f'✅ Creadas: {created_count}'
        ))
        self.stdout.write(self.style.WARNING(
            f'↻ Actualizadas: {updated_count}'
        ))
        if errors:
            self.stdout.write(self.style.ERROR(
                f'❌ Errores: {len(errors)}'
            ))
            for error in errors:
                self.stdout.write(self.style.ERROR(f'   - {error}'))
        
        self.stdout.write('=' * 60)
        self.stdout.write(self.style.SUCCESS(
            f'\n🎉 Importación completada: {created_count + updated_count} agencias procesadas'
        ))

