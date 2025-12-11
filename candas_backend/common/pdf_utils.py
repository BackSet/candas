"""
Utilidades para generación de PDFs
"""
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
import re


def generate_shipping_label_pdf(package_data, filename="etiqueta.pdf"):
	"""
	Genera una etiqueta de envío en formato PDF
	
	Args:
		package_data (dict): Diccionario con la información del paquete
			- id: ID único del paquete (para QR)
			- guide_number: Número de guía
			- name: Nombre del destinatario
			- address: Dirección
			- city: Ciudad
			- province: Provincia
			- phone_number: Teléfono (opcional)
			- transport_agency_name: Nombre de la agencia (opcional)
			- agency_guide_number: Número de guía de agencia (opcional)
			- notes: Notas/observaciones (opcional)
		filename (str): Nombre del archivo PDF
	
	Returns:
		HttpResponse: Respuesta HTTP con el PDF
	"""
	# Crear respuesta PDF
	response = HttpResponse(content_type='application/pdf')
	response['Content-Disposition'] = f'inline; filename="{filename}"'
	
	# Crear PDF - Página A4 horizontal con contenido tamaño optimizado
	c = canvas.Canvas(response, pagesize=landscape(A4))
	page_width, page_height = landscape(A4)
	
	# Dimensiones de la etiqueta (optimizada para imprimir 2 por hoja)
	label_width = 140*mm
	label_height = 100*mm
	
	# Posicionar a la izquierda con margen de impresión
	x_start = 5*mm
	y_start = 5*mm
	
	# Margen interno del contenido
	margin = 8*mm
	width = label_width
	height = label_height
	
	# Borde de etiqueta
	c.rect(x_start, y_start, label_width, label_height)
	
	# Diseño en dos columnas: QR a la izquierda, información a la derecha
	col_left_x = x_start + margin
	col_right_x = x_start + 50*mm
	y = y_start + label_height - margin
	
	# Título centrado en la parte superior
	y -= 8*mm
	c.setFont("Helvetica-Bold", 14)
	c.drawCentredString(x_start + label_width/2, y, "ENVÍO INDIVIDUAL")
	
	y -= 8*mm
	
	# COLUMNA IZQUIERDA: Código QR
	qr_size = 38*mm
	qr_code = QrCodeWidget(str(package_data.get('id', '')))
	qr_code.barWidth = qr_size
	qr_code.barHeight = qr_size
	qr_drawing = Drawing(qr_size, qr_size)
	qr_drawing.add(qr_code)
	qr_x = col_left_x
	qr_y = y - qr_size
	renderPDF.draw(qr_drawing, c, qr_x, qr_y)
	
	# ID del paquete debajo del QR
	y_qr_below = qr_y - 6*mm
	c.setFont("Helvetica", 6)
	c.drawCentredString(col_left_x + qr_size/2, y_qr_below, str(package_data.get('id', '')))
	
	# COLUMNA DERECHA: Información del paquete
	y_right = y
	
	# Número de guía (arriba en la columna derecha)
	c.setFont("Helvetica-Bold", 11)
	c.drawString(col_right_x, y_right, package_data.get('guide_number', ''))
	y_right -= 7*mm
	
	# Destinatario
	c.setFont("Helvetica-Bold", 9)
	c.drawString(col_right_x, y_right, "DESTINATARIO:")
	y_right -= 5*mm
	c.setFont("Helvetica", 8)
	dest_name = package_data.get('name', '')
	dest_name = dest_name[:35] if len(dest_name) > 35 else dest_name
	c.drawString(col_right_x, y_right, dest_name)
	y_right -= 6*mm
	
	# Dirección
	c.setFont("Helvetica-Bold", 8)
	c.drawString(col_right_x, y_right, "DIRECCIÓN:")
	y_right -= 4*mm
	c.setFont("Helvetica", 7)
	# Primera línea de dirección
	address = package_data.get('address', '')
	address_line1 = address[:45] if len(address) > 45 else address
	c.drawString(col_right_x, y_right, address_line1)
	y_right -= 4*mm
	# Ciudad y provincia
	city = package_data.get('city', '-')
	province = package_data.get('province', '-')
	c.drawString(col_right_x, y_right, f"{city or '-'}, {province or '-'}")
	y_right -= 6*mm
	
	# Teléfono
	phone_number = package_data.get('phone_number')
	if phone_number:
		c.setFont("Helvetica-Bold", 8)
		c.drawString(col_right_x, y_right, f"TEL: ")
		c.setFont("Helvetica", 8)
		c.drawString(col_right_x + 8*mm, y_right, phone_number)
		y_right -= 5*mm
	
	# Agencia
	agency_name = package_data.get('transport_agency_name')
	if agency_name:
		c.setFont("Helvetica-Bold", 8)
		c.drawString(col_right_x, y_right, "AGENCIA:")
		y_right -= 4*mm
		c.setFont("Helvetica", 7)
		agency_name = agency_name[:30] if len(agency_name) > 30 else agency_name
		c.drawString(col_right_x, y_right, agency_name)
		y_right -= 4*mm
		
		agency_guide = package_data.get('agency_guide_number')
		if agency_guide:
			c.setFont("Helvetica", 7)
			c.drawString(col_right_x, y_right, f"Guía: {agency_guide}")
			y_right -= 5*mm
	
	# Notas (en la parte inferior, ocupando todo el ancho)
	notes = package_data.get('notes')
	if notes:
		y_notes = y_qr_below - 8*mm
		c.setFont("Helvetica-Bold", 7)
		c.drawString(col_left_x, y_notes, "NOTAS:")
		y_notes -= 4*mm
		c.setFont("Helvetica", 6)
		# Limpiar notas
		notes_clean = re.sub(r'[\r\n\t]+', ' ', notes)
		notes_clean = re.sub(r'[^\x20-\x7E\xA0-\xFF]', '', notes_clean)
		notes_clean = ' '.join(notes_clean.split())
		notes_text = notes_clean[:120]
		# Dividir en líneas
		max_width = label_width - 2*margin
		words = notes_text.split()
		lines = []
		current_line = []
		for word in words:
			test_line = ' '.join(current_line + [word])
			if c.stringWidth(test_line, "Helvetica", 6) < max_width:
				current_line.append(word)
			else:
				if current_line:
					lines.append(' '.join(current_line))
				current_line = [word]
		if current_line:
			lines.append(' '.join(current_line))
		
		# Dibujar hasta 2 líneas de notas
		for line in lines[:2]:
			c.drawString(col_left_x, y_notes, line)
			y_notes -= 3.5*mm
	
	c.showPage()
	c.save()
	return response


def generate_manifest_pdf(manifest_data, filename="manifiesto.pdf"):
	"""
	Genera un manifiesto en formato PDF
	
	Args:
		manifest_data (dict): Diccionario con la información del manifiesto
			- title: Título del manifiesto
			- subtitle: Subtítulo (opcional)
			- date: Fecha
			- items: Lista de items con información a mostrar
			- footer: Texto al pie (opcional)
		filename (str): Nombre del archivo PDF
	
	Returns:
		HttpResponse: Respuesta HTTP con el PDF
	"""
	from reportlab.lib.pagesizes import letter
	from reportlab.lib.units import inch
	
	response = HttpResponse(content_type='application/pdf')
	response['Content-Disposition'] = f'inline; filename="{filename}"'
	
	c = canvas.Canvas(response, pagesize=letter)
	width, height = letter
	
	# Configuración de márgenes
	margin = 0.75 * inch
	y = height - margin
	
	# Título
	c.setFont("Helvetica-Bold", 18)
	c.drawCentredString(width/2, y, manifest_data.get('title', 'MANIFIESTO'))
	y -= 0.3 * inch
	
	# Subtítulo
	subtitle = manifest_data.get('subtitle')
	if subtitle:
		c.setFont("Helvetica", 12)
		c.drawCentredString(width/2, y, subtitle)
		y -= 0.3 * inch
	
	# Fecha
	c.setFont("Helvetica", 10)
	c.drawString(margin, y, f"Fecha: {manifest_data.get('date', '')}")
	y -= 0.4 * inch
	
	# Línea separadora
	c.line(margin, y, width - margin, y)
	y -= 0.3 * inch
	
	# Items del manifiesto
	c.setFont("Helvetica", 10)
	items = manifest_data.get('items', [])
	
	for item in items:
		# Verificar si hay espacio suficiente
		if y < 2 * inch:
			c.showPage()
			y = height - margin
			c.setFont("Helvetica", 10)
		
		# Título del item
		if item.get('title'):
			c.setFont("Helvetica-Bold", 11)
			c.drawString(margin, y, item['title'])
			y -= 0.2 * inch
			c.setFont("Helvetica", 10)
		
		# Campos del item
		fields = item.get('fields', [])
		for field in fields:
			label = field.get('label', '')
			value = field.get('value', '')
			c.drawString(margin + 0.1*inch, y, f"{label}: {value}")
			y -= 0.18 * inch
		
		# Espacio entre items
		y -= 0.15 * inch
	
	# Footer
	footer = manifest_data.get('footer')
	if footer:
		y = margin
		c.setFont("Helvetica-Oblique", 8)
		c.drawString(margin, y, footer)
	
	c.showPage()
	c.save()
	return response
