"""
Servicio para generar etiquetas de sacas del lote.
"""
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
import qrcode
from PIL import Image


class BatchLabelsGenerator:
    """Generador de etiquetas para sacas de lotes."""
    
    # Configuración de etiquetas (4 por página en 2x2)
    LABELS_PER_PAGE = 4
    LABELS_PER_ROW = 2
    LABEL_WIDTH = 4 * inch
    LABEL_HEIGHT = 5 * inch
    MARGIN_X = 0.25 * inch
    MARGIN_Y = 0.25 * inch
    
    @staticmethod
    def generate_pdf(batch):
        """
        Genera un PDF con etiquetas para todas las sacas del lote.
        4 etiquetas por página (2x2).
        Cada etiqueta incluye: número de saca (1/5, 2/5...), destino, agencia, guía, 
        cantidad de paquetes y código QR.
        """
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        page_width, page_height = letter
        
        # Obtener sacas ordenadas por fecha de creación (mismo orden que en el manifiesto)
        pulls = list(batch.pulls.all().order_by('created_at'))
        total_pulls = len(pulls)
        
        if total_pulls == 0:
            # Si no hay sacas, crear página vacía con mensaje
            c.setFont("Helvetica-Bold", 16)
            c.drawCentredString(page_width/2, page_height/2, "No hay sacas en este lote")
            c.showPage()
            c.save()
            buffer.seek(0)
            return buffer
        
        # Generar etiquetas
        for idx, pull in enumerate(pulls):
            # Calcular posición en la página (0-3)
            position_on_page = idx % BatchLabelsGenerator.LABELS_PER_PAGE
            
            # Calcular fila y columna
            row = position_on_page // BatchLabelsGenerator.LABELS_PER_ROW
            col = position_on_page % BatchLabelsGenerator.LABELS_PER_ROW
            
            # Calcular coordenadas x, y (origen en esquina inferior izquierda)
            x = BatchLabelsGenerator.MARGIN_X + col * BatchLabelsGenerator.LABEL_WIDTH
            y = page_height - BatchLabelsGenerator.MARGIN_Y - (row + 1) * BatchLabelsGenerator.LABEL_HEIGHT
            
            # Dibujar etiqueta
            BatchLabelsGenerator._draw_label(c, pull, idx + 1, total_pulls, x, y, batch)
            
            # Nueva página cada 4 etiquetas
            if (idx + 1) % BatchLabelsGenerator.LABELS_PER_PAGE == 0 and idx < total_pulls - 1:
                c.showPage()
        
        c.showPage()
        c.save()
        buffer.seek(0)
        
        return buffer
    
    @staticmethod
    def _draw_label(canvas_obj, pull, pull_number, total_pulls, x, y, batch):
        """
        Dibuja una etiqueta individual para una saca.
        """
        # Borde de la etiqueta
        canvas_obj.setStrokeColor(colors.black)
        canvas_obj.setLineWidth(2)
        canvas_obj.rect(x, y, BatchLabelsGenerator.LABEL_WIDTH, BatchLabelsGenerator.LABEL_HEIGHT)
        
        # Padding interno
        padding = 0.2 * inch
        content_x = x + padding
        content_y = y + BatchLabelsGenerator.LABEL_HEIGHT - padding
        content_width = BatchLabelsGenerator.LABEL_WIDTH - 2 * padding
        
        # Número de saca (grande y destacado)
        canvas_obj.setFont("Helvetica-Bold", 32)
        saca_number = f"{pull_number}/{total_pulls}"
        canvas_obj.drawCentredString(
            x + BatchLabelsGenerator.LABEL_WIDTH/2,
            content_y - 0.5*inch,
            saca_number
        )
        
        # Línea separadora
        separator_y = content_y - 0.8*inch
        canvas_obj.setLineWidth(1)
        canvas_obj.line(
            content_x,
            separator_y,
            content_x + content_width,
            separator_y
        )
        
        # Información de la saca
        current_y = content_y - 1.2*inch
        
        # Destino
        canvas_obj.setFont("Helvetica-Bold", 10)
        canvas_obj.drawString(content_x, current_y, "DESTINO:")
        canvas_obj.setFont("Helvetica", 12)
        canvas_obj.drawString(content_x, current_y - 0.2*inch, pull.common_destiny[:35])
        current_y -= 0.5*inch
        
        # Agencia de transporte
        canvas_obj.setFont("Helvetica-Bold", 9)
        canvas_obj.drawString(content_x, current_y, "AGENCIA:")
        canvas_obj.setFont("Helvetica", 9)
        agency_name = batch.transport_agency.name if batch.transport_agency else pull.transport_agency.name if pull.transport_agency else 'Sin asignar'
        canvas_obj.drawString(content_x, current_y - 0.15*inch, agency_name[:30])
        current_y -= 0.35*inch
        
        # Número de guía
        canvas_obj.setFont("Helvetica-Bold", 9)
        canvas_obj.drawString(content_x, current_y, "GUÍA:")
        canvas_obj.setFont("Helvetica", 9)
        guide = batch.guide_number or pull.guide_number or 'Sin guía'
        canvas_obj.drawString(content_x, current_y - 0.15*inch, guide[:30])
        current_y -= 0.35*inch
        
        # Cantidad de paquetes
        canvas_obj.setFont("Helvetica-Bold", 9)
        canvas_obj.drawString(content_x, current_y, "PAQUETES:")
        canvas_obj.setFont("Helvetica-Bold", 14)
        packages_count = pull.packages.count()
        canvas_obj.drawString(content_x + 0.8*inch, current_y - 0.05*inch, str(packages_count))
        current_y -= 0.4*inch
        
        # Tamaño de saca
        canvas_obj.setFont("Helvetica-Bold", 8)
        canvas_obj.drawString(content_x, current_y, "TAMAÑO:")
        canvas_obj.setFont("Helvetica", 9)
        canvas_obj.drawString(content_x + 0.6*inch, current_y, pull.get_size_display())
        
        # Aviso especial para la última saca: contiene el manifiesto (lado derecho vertical)
        # Comienza desde la línea separadora hacia abajo
        is_last_pull = pull_number == total_pulls
        if is_last_pull:
            # Dimensiones del aviso vertical en el lado derecho
            notice_width = 0.8 * inch
            notice_x = x + BatchLabelsGenerator.LABEL_WIDTH - notice_width - 0.1*inch
            # Comienza desde la línea separadora hacia abajo
            notice_y_top = separator_y - 0.05*inch  # Justo debajo de la línea
            notice_y_bottom = y + 0.2*inch  # Deja espacio para el QR
            notice_height = notice_y_top - notice_y_bottom
            
            # Dibujar rectángulo vertical de fondo amarillo/rojo llamativo
            canvas_obj.setFillColor(colors.HexColor('#FFD700'))  # Amarillo dorado
            canvas_obj.setStrokeColor(colors.red)
            canvas_obj.setLineWidth(4)
            canvas_obj.roundRect(
                notice_x,
                notice_y_bottom,
                notice_width,
                notice_height,
                5,
                fill=1,
                stroke=1
            )
            
            # Texto del aviso en vertical (rotado 90 grados)
            canvas_obj.setFillColor(colors.red)
            canvas_obj.setFont("Helvetica-Bold", 12)
            
            # Guardar el estado del canvas
            canvas_obj.saveState()
            
            # Rotar el canvas 90 grados y mover al centro del rectángulo
            text_center_x = notice_x + notice_width / 2
            text_center_y = notice_y_bottom + notice_height / 2
            
            # Rotar y posicionar
            canvas_obj.translate(text_center_x, text_center_y)
            canvas_obj.rotate(90)
            
            # Dibujar texto centrado verticalmente
            canvas_obj.drawCentredString(0, 0, "⚠ MANIFIESTO ⚠")
            canvas_obj.drawCentredString(0, -0.25*inch, "EN ESTA SACA")
            
            # Restaurar el estado del canvas
            canvas_obj.restoreState()
        
        # Generar código QR (solo ID de la saca)
        qr_data = str(pull.id)
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
        qr_x = x + (BatchLabelsGenerator.LABEL_WIDTH - qr_size) / 2
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
            x + BatchLabelsGenerator.LABEL_WIDTH/2,
            y + 0.15*inch,
            f"ID: {str(pull.id)[:8].upper()}"
        )
