"""
Utility functions - Funciones helper generales
"""
import re
from datetime import datetime
from django.utils import timezone


def normalize_phone_number(phone):
    """
    Normaliza un número de teléfono eliminando caracteres no numéricos.
    
    Args:
        phone (str): Número de teléfono
        
    Returns:
        str: Número normalizado
    """
    if not phone:
        return ''
    return re.sub(r'\D', '', str(phone))


def format_currency(amount):
    """
    Formatea un monto como moneda.
    
    Args:
        amount (float): Monto a formatear
        
    Returns:
        str: Monto formateado ($1,234.56)
    """
    return f"${amount:,.2f}"


def generate_unique_code(prefix='', length=8):
    """
    Genera un código único alfanumérico.
    
    Args:
        prefix (str): Prefijo opcional
        length (int): Longitud del código
        
    Returns:
        str: Código único
    """
    import secrets
    import string
    characters = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(characters) for _ in range(length))
    return f"{prefix}{code}" if prefix else code


def format_datetime_spanish(dt):
    """
    Formatea una fecha/hora en formato español.
    
    Args:
        dt (datetime): Fecha/hora
        
    Returns:
        str: Fecha formateada (ej: "15 de enero de 2025, 14:30")
    """
    months = {
        1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
        5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
        9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
    }
    
    if timezone.is_aware(dt):
        dt = timezone.localtime(dt)
    
    return f"{dt.day} de {months[dt.month]} de {dt.year}, {dt.strftime('%H:%M')}"


def truncate_text(text, max_length=50, suffix='...'):
    """
    Trunca un texto a una longitud máxima.
    
    Args:
        text (str): Texto a truncar
        max_length (int): Longitud máxima
        suffix (str): Sufijo a agregar
        
    Returns:
        str: Texto truncado
    """
    if not text or len(text) <= max_length:
        return text
    return text[:max_length].strip() + suffix


def safe_int(value, default=0):
    """
    Convierte un valor a entero de forma segura.
    
    Args:
        value: Valor a convertir
        default (int): Valor por defecto si la conversión falla
        
    Returns:
        int: Valor convertido o default
    """
    try:
        return int(value)
    except (ValueError, TypeError):
        return default
