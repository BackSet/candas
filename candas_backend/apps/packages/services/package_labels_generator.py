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
        El rectángulo se ajusta al tamaño del contenido.
        Distribución similar a imagen: header gris, izquierda (ciudad/nombre/tel), derecha (guía/barcode).
        """
        buffer = BytesIO()
        # Usar A4 vertical
        c = canvas.Canvas(buffer, pagesize=A4)
        page_width, page_height = A4
        
        # Configuración de márgenes
        MARGIN_X = 5 * mm
        MARGIN_Y = 5 * mm
        
        # Configuración de márgenes internos de la etiqueta
        padding = 2 * mm
        
        # Posición inicial (empezar desde arriba)
        x = MARGIN_X
        start_y = page_height - MARGIN_Y  # Empezar desde arriba con margen
        
        # Área de contenido (desde arriba con padding)
        content_y = start_y - padding
        
        # Ancho de la etiqueta (ancho de página menos márgenes)
        label_width = page_width - 2 * MARGIN_X
        
        # ===== TÍTULO: MV SERVICES (movido un poco más abajo) =====
        company_name = "MV SERVICES"
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors.black)
        text_width = c.stringWidth(company_name, "Helvetica-Bold", 11)
        x_center = x + (label_width - text_width) / 2
        # Mover más abajo: reducir la posición Y
        title_y = content_y - 3 * mm
        c.drawString(x_center, title_y, company_name)  # Movido 3mm más abajo
        
        # Área de contenido principal (debajo del título, sin línea aún)
        main_content_y = content_y - 7 * mm
        
        # ===== DISTRIBUCIÓN: IZQUIERDA (ciudad/nombre/tel) y DERECHA (guía/barcode) =====
        guide_number = package.guide_number or str(package.id)[:13].upper()
        
        # Dividir el ancho: 45% izquierda, 55% derecha (mejor proporción)
        left_width = label_width * 0.45
        right_width = label_width * 0.55
        left_x = x + padding
        right_x = x + left_width + padding * 1.5
        
        # Bajar un poco más los elementos del lado izquierdo
        current_y = main_content_y - 3 * mm
        
        # ===== LADO IZQUIERDO: Ciudad, Nombre, Teléfono (centrados) =====
        c.setFillColor(colors.black)
        
        # Ciudad - Ecuador (centrado)
        city_text = f"{package.city} - ECUADOR"
        c.setFont("Helvetica-Bold", 9)  # Aumentado de 8 a 9
        text_width = c.stringWidth(city_text, "Helvetica-Bold", 9)
        left_center_x = left_x + (left_width - text_width) / 2
        c.drawString(left_center_x, current_y, city_text)
        current_y -= 6 * mm  # Aumentado de 5mm a 6mm
        
        # Nombre del destinatario (centrado)
        recipient_name = package.name.upper() if package.name else "SIN NOMBRE"
        # Truncar si es muy largo
        if len(recipient_name) > 28:
            recipient_name = recipient_name[:25] + "..."
        c.setFont("Helvetica-Bold", 10)  # Aumentado de 9 a 10
        text_width = c.stringWidth(recipient_name, "Helvetica-Bold", 10)
        left_center_x = left_x + (left_width - text_width) / 2
        c.drawString(left_center_x, current_y, recipient_name)
        current_y -= 6 * mm  # Aumentado de 5mm a 6mm
        
        # Teléfono (centrado)
        phone = package.phone_number if package.phone_number else "-"
        c.setFont("Helvetica", 9)  # Aumentado de 8 a 9
        text_width = c.stringWidth(phone, "Helvetica", 9)
        left_center_x = left_x + (left_width - text_width) / 2
        c.drawString(left_center_x, current_y, phone)
        
        # ===== LADO DERECHO: Número de guía grande + Código de barras =====
        right_current_y = main_content_y - 2 * mm  # Movido 2mm más abajo
        
        # Número de guía (grande y destacado)
        c.setFont("Helvetica-Bold", 16)  # Aumentado de 14 a 16
        text_width = c.stringWidth(guide_number, "Helvetica-Bold", 16)
        right_center_x = right_x + (right_width - text_width) / 2
        c.drawString(right_center_x, right_current_y, guide_number)
        right_current_y -= 10 * mm  # Aumentado de 8mm a 10mm
        
        # Variable para almacenar la posición más baja del contenido
        bottom_y = None
        
        # Generar código de barras Code128
        try:
            barcode_class = barcode.get_barcode_class('code128')
            barcode_instance = barcode_class(guide_number, writer=ImageWriter())
            
            # Generar imagen del código de barras (optimizado para mejor uso del espacio)
            barcode_buffer = BytesIO()
            barcode_instance.write(barcode_buffer, options={
                'module_width': 0.35,  # Ancho de las barras (ligeramente más ancho)
                'module_height': 18.0,  # Altura de las barras (más alto para mejor legibilidad)
                'quiet_zone': 2.0,
                'font_size': 9,  # Tamaño de fuente
                'text_distance': 2.5,
            })
            barcode_buffer.seek(0)
            
            # Cargar la imagen
            barcode_image = Image.open(barcode_buffer)
            if barcode_image.mode != 'RGB':
                barcode_image = barcode_image.convert('RGB')
            
            # Guardar en buffer para ReportLab
            img_buffer = BytesIO()
            barcode_image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            # Calcular dimensiones (ajustado para aprovechar mejor el espacio)
            max_width = right_width * 0.9  # Usar 90% del ancho disponible
            img_width, img_height = barcode_image.size
            aspect_ratio = img_height / img_width
            pdf_width = min(max_width, img_width * 0.264583)
            pdf_height = pdf_width * aspect_ratio
            
            # Centrar el código de barras en el lado derecho
            barcode_x = right_x + (right_width - pdf_width) / 2
            barcode_y = right_current_y - pdf_height
            
            # Dibujar código de barras
            img_reader = ImageReader(img_buffer)
            c.drawImage(
                img_reader,
                barcode_x,
                barcode_y,
                width=pdf_width,
                height=pdf_height,
                preserveAspectRatio=True
            )
            
            # El número de guía ya está incluido en el código de barras, no se repite
            bottom_y = barcode_y - padding  # Espacio debajo del código de barras
            
        except Exception as e:
            # Si falla el código de barras, mostrar solo el número
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Error al generar código de barras: {str(e)}")
            logger.exception(e)
            # Mostrar número de guía como texto
            c.setFont("Helvetica-Bold", 10)
            text_width = c.stringWidth(guide_number, "Helvetica-Bold", 10)
            right_center_x = right_x + (right_width - text_width) / 2
            c.drawString(right_center_x, right_current_y, guide_number)
            
            bottom_y = right_current_y - padding
        
        # Calcular la altura real del contenido
        # Desde el título hasta el final del contenido
        top_y = title_y + 3 * mm  # Pequeño espacio arriba del título
        actual_height = top_y - bottom_y
        actual_y = bottom_y
        
        # Dibujar borde de la etiqueta ajustado al contenido (después de todos los elementos)
        c.setStrokeColor(colors.black)
        c.setLineWidth(0.5)
        c.rect(x, actual_y, label_width, actual_height)
        
        # Finalizar página
        c.showPage()
        c.save()
        buffer.seek(0)
        
        return buffer
