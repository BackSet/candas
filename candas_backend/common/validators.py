"""
Custom Validators - Validadores personalizados
"""
from django.core.exceptions import ValidationError
import re


def validate_phone_number(value):
    """
    Valida que un número de teléfono sea válido (solo dígitos, 7-15 caracteres).
    """
    phone = re.sub(r'\D', '', str(value))
    if len(phone) < 7 or len(phone) > 15:
        raise ValidationError('El número de teléfono debe tener entre 7 y 15 dígitos.')


def validate_no_special_chars(value):
    """
    Valida que un valor no contenga caracteres especiales peligrosos.
    """
    forbidden = ['<', '>', '{', '}', '|', '\\', '^', '`']
    if any(char in value for char in forbidden):
        raise ValidationError('El texto contiene caracteres no permitidos.')


def validate_file_size(file, max_size_mb=10):
    """
    Valida el tamaño de un archivo subido.
    
    Args:
        file: Archivo subido
        max_size_mb (int): Tamaño máximo en MB
    """
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f'El archivo no debe superar {max_size_mb}MB.')


def validate_excel_file(file):
    """
    Valida que un archivo sea Excel (.xlsx o .xls).
    """
    import os
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ['.xlsx', '.xls']:
        raise ValidationError('El archivo debe ser formato Excel (.xlsx o .xls).')
