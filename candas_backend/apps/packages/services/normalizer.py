"""
Servicio para normalización de datos de paquetes durante importación
"""
import re
from datetime import datetime


class PackageDataNormalizer:
    """Normalizador de datos para importación de paquetes"""
    
    # Mapeo de provincias abreviadas a nombres completos
    PROVINCE_MAP = {
        'PICH': 'PICHINCHA',
        'PICHINCHA': 'PICHINCHA',
        'GUA': 'GUAYAS',
        'GUAYAS': 'GUAYAS',
        'AZU': 'AZUAY',
        'AZUAY': 'AZUAY',
        'MAN': 'MANABÍ',
        'MANABI': 'MANABÍ',
        'MANABÍ': 'MANABÍ',
        'EL O': 'EL ORO',
        'EL ORO': 'EL ORO',
        'ORO': 'EL ORO',
        'LOS R': 'LOS RÍOS',
        'LOS RIOS': 'LOS RÍOS',
        'LOS RÍOS': 'LOS RÍOS',
        'RIOS': 'LOS RÍOS',
        'IMBABURA': 'IMBABURA',
        'IMB': 'IMBABURA',
        'COTOPAXI': 'COTOPAXI',
        'COT': 'COTOPAXI',
        'TUNGURAHUA': 'TUNGURAHUA',
        'TUN': 'TUNGURAHUA',
        'CHIMBORAZO': 'CHIMBORAZO',
        'CHIM': 'CHIMBORAZO',
        'ESMERALDAS': 'ESMERALDAS',
        'ESM': 'ESMERALDAS',
        'CARCHI': 'CARCHI',
        'CAR': 'CARCHI',
        'CAÑAR': 'CAÑAR',
        'CANAR': 'CAÑAR',
        'LOJA': 'LOJA',
        'SANTO DOMINGO': 'SANTO DOMINGO DE LOS TSÁCHILAS',
        'STO DOM': 'SANTO DOMINGO DE LOS TSÁCHILAS',
        'SANTA ELENA': 'SANTA ELENA',
        'STA ELENA': 'SANTA ELENA',
        'BOLÍVAR': 'BOLÍVAR',
        'BOLIVAR': 'BOLÍVAR',
        'PASTAZA': 'PASTAZA',
        'MORONA SANTIAGO': 'MORONA SANTIAGO',
        'MOR': 'MORONA SANTIAGO',
        'NAPO': 'NAPO',
        'ZAMORA CHINCHIPE': 'ZAMORA CHINCHIPE',
        'ZAM': 'ZAMORA CHINCHIPE',
        'SUCUMBÍOS': 'SUCUMBÍOS',
        'SUCUMBIOS': 'SUCUMBÍOS',
        'ORELLANA': 'ORELLANA',
        'GALÁPAGOS': 'GALÁPAGOS',
        'GALAPAGOS': 'GALÁPAGOS',
    }
    
    @staticmethod
    def normalize_phone(phone):
        """
        Normaliza números de teléfono
        +593 99 123 4567 -> 0991234567
        099-123-4567 -> 0991234567
        """
        if not phone:
            return ''
        
        # Convertir a string y limpiar
        phone = str(phone).strip()
        
        # Remover caracteres no numéricos excepto +
        phone = re.sub(r'[^\d+]', '', phone)
        
        # Si empieza con +593, reemplazar por 0
        if phone.startswith('+593'):
            phone = '0' + phone[4:]
        elif phone.startswith('593'):
            phone = '0' + phone[3:]
        
        # Asegurar que tenga 10 dígitos
        if len(phone) == 9 and phone[0] == '9':
            phone = '0' + phone
        
        return phone
    
    @staticmethod
    def normalize_text(text):
        """
        Normaliza texto general: trim y elimina caracteres especiales problemáticos
        """
        if not text:
            return ''
        
        text = str(text).strip()
        
        # Eliminar múltiples espacios
        text = re.sub(r'\s+', ' ', text)
        
        # Eliminar caracteres de control y caracteres raros
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        
        return text
    
    @staticmethod
    def normalize_location(city, province):
        """
        Normaliza ciudad y provincia: uppercase y estandariza provincias
        """
        if not city:
            city = ''
        if not province:
            province = ''
        
        # Normalizar texto básico
        city = PackageDataNormalizer.normalize_text(city).upper()
        province = PackageDataNormalizer.normalize_text(province).upper()
        
        # Estandarizar provincia usando el mapeo
        province_normalized = PackageDataNormalizer.PROVINCE_MAP.get(province, province)
        
        return city, province_normalized
    
    @staticmethod
    def normalize_address(address):
        """
        Normaliza dirección: capitaliza primera letra de cada palabra
        """
        if not address:
            return ''
        
        address = PackageDataNormalizer.normalize_text(address)
        
        # Capitalizar primera letra de cada palabra
        words = address.split()
        capitalized = []
        
        # Palabras que deben ir en minúsculas (excepto al inicio)
        lowercase_words = {'de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u'}
        
        for i, word in enumerate(words):
            if i == 0 or word.lower() not in lowercase_words:
                capitalized.append(word.capitalize())
            else:
                capitalized.append(word.lower())
        
        return ' '.join(capitalized)
    
    @staticmethod
    def normalize_hashtags(hashtags):
        """
        Normaliza hashtags: agrega # si falta, separa por espacios
        urgente fragil -> #urgente #fragil
        #urgente, #fragil -> #urgente #fragil
        """
        if not hashtags:
            return ''
        
        hashtags = PackageDataNormalizer.normalize_text(hashtags)
        
        # Dividir por espacios o comas
        tags = re.split(r'[,\s]+', hashtags)
        
        # Agregar # si no tiene y eliminar vacíos
        normalized_tags = []
        for tag in tags:
            tag = tag.strip()
            if tag:
                if not tag.startswith('#'):
                    tag = '#' + tag
                normalized_tags.append(tag)
        
        return ' '.join(normalized_tags)
    
    @staticmethod
    def normalize_guide(guide):
        """
        Normaliza número de guía: uppercase, elimina espacios y guiones
         EC-123-ABC  -> EC123ABC
        """
        if not guide:
            return ''
        
        guide = str(guide).strip().upper()
        
        # Eliminar espacios, guiones y otros separadores comunes
        guide = re.sub(r'[-_\s]', '', guide)
        
        return guide
    
    @staticmethod
    def normalize_date(date_str):
        """
        Convierte fecha a formato ISO (YYYY-MM-DD)
        Soporta: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
        """
        if not date_str:
            return None
        
        date_str = str(date_str).strip()
        
        # Intentar diferentes formatos
        formats = [
            '%d/%m/%Y',
            '%d-%m-%Y',
            '%Y-%m-%d',
            '%Y/%m/%d',
            '%d.%m.%Y',
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.date().isoformat()
            except ValueError:
                continue
        
        # Si no se pudo parsear, retornar None
        return None
    
    @staticmethod
    def normalize_status(status):
        """
        Normaliza estado: uppercase y valida contra opciones válidas
        """
        if not status:
            return 'NO_RECEPTADO'  # Default
        
        status = str(status).strip().upper()
        
        # Mapeo de estados comunes
        status_map = {
            'NO RECEPTADO': 'NO_RECEPTADO',
            'NO_RECEPTADO': 'NO_RECEPTADO',
            'EN BODEGA': 'EN_BODEGA',
            'EN_BODEGA': 'EN_BODEGA',
            'BODEGA': 'EN_BODEGA',
            'EN TRANSITO': 'EN_TRANSITO',
            'EN_TRANSITO': 'EN_TRANSITO',
            'EN TRÁNSITO': 'EN_TRANSITO',
            'TRANSITO': 'EN_TRANSITO',
            'ENTREGADO': 'ENTREGADO',
            'DEVUELTO': 'DEVUELTO',
            'RETENIDO': 'RETENIDO',
        }
        
        return status_map.get(status, 'NO_RECEPTADO')
    
    @staticmethod
    def validate_phone(phone):
        """Valida que el teléfono tenga formato correcto (10 dígitos)"""
        if not phone:
            return False
        
        phone = str(phone).strip()
        
        # Debe tener 10 dígitos y empezar con 0
        return len(phone) == 10 and phone.isdigit() and phone[0] == '0'
    
    @staticmethod
    def validate_guide(guide):
        """Valida que la guía no esté vacía"""
        if not guide:
            return False
        
        guide = str(guide).strip()
        return len(guide) > 0
