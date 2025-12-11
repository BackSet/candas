"""
Servicio para generar etiquetas de paquetes individuales.
Mismo formato que etiquetas de sacas: numeración, destino, agencia, guía, QR.
También incluye formato de etiqueta de guía con código de barras.
"""
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from datetime import datetime
import qrcode
import barcode
from barcode.writer import ImageWriter
from PIL import Image


class PackageLabelsGenerator:
    """Generador de etiquetas para paquetes individuales."""
    
    # Configuración de etiquetas (4 por página en 2x2)
    LABELS_PER_PAGE = 4
    LABELS_PER_ROW = 2
    LABEL_WIDTH = 4 * inch
    LABEL_HEIGHT = 5 * inch
    MARGIN_X = 0.25 * inch
    MARGIN_Y = 0.25 * inch
    
    @staticmethod
    def generate_pdf(package):
        """
        Genera un PDF con la etiqueta del paquete individual.
        Formato igual a etiquetas de sacas: numeración, destino, agencia, guía, QR.
        """
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        page_width, page_height = letter
        
        # Dibujar etiqueta (1/1 ya que es un solo paquete)
        x = PackageLabelsGenerator.MARGIN_X
        y = page_height - PackageLabelsGenerator.MARGIN_Y - PackageLabelsGenerator.LABEL_HEIGHT
        
        PackageLabelsGenerator._draw_label(c, package, 1, 1, x, y)
        
        c.showPage()
        c.save()
        buffer.seek(0)
        
        return buffer
    
    @staticmethod
    def _draw_label(canvas_obj, package, package_number, total_packages, x, y):
        """
        Dibuja una etiqueta individual para un paquete.
        Formato igual a etiquetas de sacas.
        """
        # Borde de la etiqueta
        canvas_obj.setStrokeColor(colors.black)
        canvas_obj.setLineWidth(2)
        canvas_obj.rect(x, y, PackageLabelsGenerator.LABEL_WIDTH, PackageLabelsGenerator.LABEL_HEIGHT)
        
        # Padding interno
        padding = 0.2 * inch
        content_x = x + padding
        content_y = y + PackageLabelsGenerator.LABEL_HEIGHT - padding
        content_width = PackageLabelsGenerator.LABEL_WIDTH - 2 * padding
        
        # Numeración (grande y destacado) - formato 1/1
        canvas_obj.setFont("Helvetica-Bold", 32)
        canvas_obj.setFillColor(colors.black)
        numeracion = f"{package_number}/{total_packages}"
        canvas_obj.drawCentredString(
            x + PackageLabelsGenerator.LABEL_WIDTH/2,
            content_y - 0.5*inch,
            numeracion
        )
        
        # Línea separadora
        canvas_obj.setLineWidth(1)
        canvas_obj.line(
            content_x,
            content_y - 0.8*inch,
            content_x + content_width,
            content_y - 0.8*inch
        )
        
        # Información del paquete
        current_y = content_y - 1.2*inch
        
        # Obtener datos efectivos
        effective_agency = package.get_shipping_agency()
        effective_guide = package.get_shipping_guide_number()
        effective_destiny = package.get_effective_destiny()
        
        # Destino
        canvas_obj.setFont("Helvetica-Bold", 10)
        canvas_obj.drawString(content_x, current_y, "DESTINO:")
        canvas_obj.setFont("Helvetica", 12)
        destino = effective_destiny[:35] if len(effective_destiny) > 35 else effective_destiny
        canvas_obj.drawString(content_x, current_y - 0.2*inch, destino)
        current_y -= 0.5*inch
        
        # Agencia de transporte
        canvas_obj.setFont("Helvetica-Bold", 9)
        canvas_obj.drawString(content_x, current_y, "AGENCIA:")
        canvas_obj.setFont("Helvetica", 9)
        agency_name = effective_agency.name if effective_agency else 'Sin asignar'
        agency_display = agency_name[:30] if len(agency_name) > 30 else agency_name
        canvas_obj.drawString(content_x, current_y - 0.15*inch, agency_display)
        current_y -= 0.35*inch
        
        # Número de guía
        canvas_obj.setFont("Helvetica-Bold", 9)
        canvas_obj.drawString(content_x, current_y, "GUÍA:")
        canvas_obj.setFont("Helvetica", 9)
        guide = effective_guide or 'Sin guía'
        guide_display = guide[:30] if len(guide) > 30 else guide
        canvas_obj.drawString(content_x, current_y - 0.15*inch, guide_display)
        current_y -= 0.35*inch
        
        # Generar código QR (solo con ID del paquete)
        qr_data = str(package.id)
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=1,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Convertir QR a imagen
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        # Dibujar QR (centrado en la parte inferior)
        qr_size = 1.3 * inch
        qr_x = x + (PackageLabelsGenerator.LABEL_WIDTH - qr_size) / 2
        qr_y = y + 0.3 * inch
        
        # Usar ImageReader para leer el BytesIO
        img_reader = ImageReader(qr_buffer)
        canvas_obj.drawImage(
            img_reader,
            qr_x,
            qr_y,
            width=qr_size,
            height=qr_size,
            preserveAspectRatio=True
        )
        
        # Texto bajo el QR
        canvas_obj.setFont("Helvetica", 7)
        canvas_obj.drawCentredString(
            x + PackageLabelsGenerator.LABEL_WIDTH/2,
            y + 0.15*inch,
            f"ID: {str(package.id)[:8].upper()}"
        )
    
    @staticmethod
    def generate_shipping_label_pdf(package):
        """
        Genera un PDF con etiqueta de envío simplificada.
        Incluye solo:
        - Nombre de la empresa
        - Código de barras (generado con el número de guía)
        - Número de guía (solo debajo del código de barras)
        - Ciudad - Ecuador - Provincia
        - Nombre del destinatario
        - Número de teléfono
        """
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        page_width, page_height = A4
        
        # Configuración de márgenes (más compactos)
        margin_left = 20 * mm
        margin_top = 25 * mm
        content_width = page_width - 2 * margin_left
        
        y_position = page_height - margin_top
        
        # ===== NOMBRE DE LA EMPRESA (centrado) =====
        company_name = "MV SERVICES COURIER INC"
        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(colors.black)
        # Centrar el texto
        text_width = c.stringWidth(company_name, "Helvetica-Bold", 18)
        x_center = margin_left + (content_width - text_width) / 2
        c.drawString(x_center, y_position, company_name)
        y_position -= 15 * mm
        
        # ===== NÚMERO DE GUÍA (grande y destacado) =====
        guide_number = package.guide_number or str(package.id)[:13].upper()
        
        # Número de guía (grande y destacado, centrado)
        c.setFont("Helvetica-Bold", 22)
        text_width = c.stringWidth(guide_number, "Helvetica-Bold", 22)
        x_center = margin_left + (content_width - text_width) / 2
        c.drawString(x_center, y_position, guide_number)
        y_position -= 15 * mm
        
        # ===== CÓDIGO DE BARRAS =====
        
        # Generar código de barras Code128 del número de guía usando python-barcode
        try:
            # Crear código de barras Code128 usando python-barcode
            barcode_class = barcode.get_barcode_class('code128')
            barcode_instance = barcode_class(guide_number, writer=ImageWriter())
            
            # Generar imagen del código de barras con mejor proporción
            barcode_buffer = BytesIO()
            barcode_instance.write(barcode_buffer, options={
                'module_width': 0.35,  # Ancho de las barras (más fino)
                'module_height': 20.0,  # Altura de las barras (más alto)
                'quiet_zone': 2.5,  # Zona silenciosa alrededor
                'font_size': 12,  # Tamaño de fuente para el texto
                'text_distance': 4.0,  # Distancia del texto al código
            })
            barcode_buffer.seek(0)
            
            # Cargar la imagen del código de barras
            barcode_image = Image.open(barcode_buffer)
            
            # Convertir a RGB si es necesario
            if barcode_image.mode != 'RGB':
                barcode_image = barcode_image.convert('RGB')
            
            # Guardar en un nuevo buffer para ReportLab
            img_buffer = BytesIO()
            barcode_image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            # Calcular dimensiones para el código de barras en el PDF
            # Ancho máximo más amplio para mejor proporción
            max_width = 100 * mm
            img_width, img_height = barcode_image.size
            aspect_ratio = img_height / img_width
            pdf_width = min(max_width, img_width * 0.264583)  # Convertir pixels a mm
            pdf_height = pdf_width * aspect_ratio
            
            # Centrar el código de barras
            barcode_x = margin_left + (content_width - pdf_width) / 2
            
            # Dibujar código de barras en el canvas
            img_reader = ImageReader(img_buffer)
            c.drawImage(
                img_reader,
                barcode_x,
                y_position - pdf_height,
                width=pdf_width,
                height=pdf_height,
                preserveAspectRatio=True
            )
            
            # El número de guía ya está incluido en el código de barras (humanReadable)
            # Solo ajustar posición para el siguiente elemento
            y_position -= (pdf_height + 12 * mm)
            
        except Exception as e:
            # Si falla el código de barras, mostrar solo el número
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Error al generar código de barras: {str(e)}")
            logger.exception(e)
            # Mostrar número de guía como texto
            c.setFont("Helvetica-Bold", 16)
            text_width = c.stringWidth(guide_number, "Helvetica-Bold", 16)
            x_center = margin_left + (content_width - text_width) / 2
            c.drawString(x_center, y_position, guide_number)
            y_position -= 15 * mm
        
        # ===== CIUDAD - ECUADOR - PROVINCIA =====
        city_province = f"{package.city} - Ecuador - {package.province}"
        c.setFont("Helvetica-Bold", 13)
        text_width = c.stringWidth(city_province, "Helvetica-Bold", 13)
        x_center = margin_left + (content_width - text_width) / 2
        c.drawString(x_center, y_position, city_province)
        y_position -= 15 * mm
        
        # ===== NOMBRE DEL DESTINATARIO =====
        recipient_name = package.name.upper() if package.name else "SIN NOMBRE"
        c.setFont("Helvetica-Bold", 15)
        text_width = c.stringWidth(recipient_name, "Helvetica-Bold", 15)
        x_center = margin_left + (content_width - text_width) / 2
        c.drawString(x_center, y_position, recipient_name)
        y_position -= 12 * mm
        
        # ===== NÚMERO DE TELÉFONO =====
        phone = package.phone_number if package.phone_number else "-"
        c.setFont("Helvetica", 13)
        text_width = c.stringWidth(phone, "Helvetica", 13)
        x_center = margin_left + (content_width - text_width) / 2
        c.drawString(x_center, y_position, phone)
        
        # Finalizar página
        c.showPage()
        c.save()
        buffer.seek(0)
        
        return buffer
