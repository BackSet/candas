"""
Template base común para generación de etiquetas.
Múltiples etiquetas por página A4, formato formal, sin colores.
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import qrcode
from PIL import Image


class BaseLabelGenerator:
    """Clase base para generadores de etiquetas formales."""
    
    # Configuración de página A4 horizontal
    PAGE_SIZE = landscape(A4)
    PAGE_WIDTH = landscape(A4)[0]
    PAGE_HEIGHT = landscape(A4)[1]
    
    # Configuración de etiquetas: 4 por página (2x2)
    LABELS_PER_PAGE = 4
    LABELS_PER_ROW = 2
    LABEL_WIDTH = 120 * mm  # ~4.7 inches
    LABEL_HEIGHT = 80 * mm  # ~3.1 inches
    MARGIN = 10 * mm
    SPACING = 5 * mm  # Espacio entre etiquetas
    
    @staticmethod
    def generate_qr_code(data, size_mm=30):
        """
        Genera un código QR a partir de datos.
        
        Args:
            data: String o diccionario con datos para el QR
            size_mm: Tamaño del QR en milímetros
        
        Returns:
            BytesIO con la imagen del QR
        """
        # Convertir datos a string si es diccionario
        if isinstance(data, dict):
            qr_string = "\n".join([f"{k}:{v}" for k, v in data.items()])
        else:
            qr_string = str(data)
        
        # Generar QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(qr_string)
        qr.make(fit=True)
        
        # Convertir a imagen
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Redimensionar si es necesario
        size_px = int(size_mm * 3.779527559)  # Convertir mm a pixels (96 DPI)
        qr_img = qr_img.resize((size_px, size_px), Image.Resampling.LANCZOS)
        
        # Guardar en buffer
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        return qr_buffer
    
    @staticmethod
    def calculate_label_position(label_index):
        """
        Calcula la posición (x, y) de una etiqueta en la página.
        
        Args:
            label_index: Índice de la etiqueta (0-3 para 4 etiquetas por página)
        
        Returns:
            Tupla (x, y) en puntos (ReportLab usa puntos, no mm)
        """
        # Convertir mm a puntos (1 mm = 2.83465 puntos)
        mm_to_pt = 2.83465
        
        # Calcular fila y columna
        row = label_index // BaseLabelGenerator.LABELS_PER_ROW
        col = label_index % BaseLabelGenerator.LABELS_PER_ROW
        
        # Calcular posición (origen en esquina inferior izquierda)
        x = (BaseLabelGenerator.MARGIN + col * (BaseLabelGenerator.LABEL_WIDTH + BaseLabelGenerator.SPACING)) * mm_to_pt
        y = (BaseLabelGenerator.PAGE_HEIGHT - BaseLabelGenerator.MARGIN - 
             (row + 1) * BaseLabelGenerator.LABEL_HEIGHT - 
             row * BaseLabelGenerator.SPACING) * mm_to_pt
        
        return x, y
    
    @staticmethod
    def draw_label_border(canvas_obj, x, y, width, height):
        """
        Dibuja el borde de una etiqueta.
        
        Args:
            canvas_obj: Objeto Canvas de ReportLab
            x, y: Posición de la etiqueta
            width, height: Ancho y alto de la etiqueta
        """
        canvas_obj.setStrokeColor(colors.black)
        canvas_obj.setLineWidth(1)
        canvas_obj.rect(x, y, width, height)
    
    @staticmethod
    def split_text(text, max_length):
        """
        Divide un texto en líneas de máximo max_length caracteres.
        
        Args:
            text: Texto a dividir
            max_length: Longitud máxima por línea
        
        Returns:
            Lista de líneas
        """
        if not text:
            return []
        
        words = text.split()
        lines = []
        current_line = ""
        
        for word in words:
            if len(current_line) + len(word) + 1 <= max_length:
                if current_line:
                    current_line += " " + word
                else:
                    current_line = word
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        return lines if lines else [text[:max_length]]

