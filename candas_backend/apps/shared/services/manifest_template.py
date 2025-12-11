"""
Template base común para generación de manifiestos formales.
Formato A4 horizontal, sin colores, solo texto negro y líneas.
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime


class BaseManifestGenerator:
    """Clase base para generadores de manifiestos formales."""
    
    # Configuración de página A4 horizontal
    PAGE_SIZE = landscape(A4)
    MARGIN = 10 * mm  # Márgenes estrechos
    
    @staticmethod
    def create_document():
        """Crea un documento SimpleDocTemplate con configuración A4 horizontal."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=BaseManifestGenerator.PAGE_SIZE,
            rightMargin=BaseManifestGenerator.MARGIN,
            leftMargin=BaseManifestGenerator.MARGIN,
            topMargin=BaseManifestGenerator.MARGIN,
            bottomMargin=BaseManifestGenerator.MARGIN
        )
        return doc, buffer
    
    @staticmethod
    def get_company_header():
        """Retorna un Paragraph con el nombre de la empresa."""
        company_style = ParagraphStyle(
            'CompanyHeader',
            fontSize=16,
            textColor=colors.black,
            spaceAfter=8,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        return Paragraph("MV SERVICES COURIER INC", company_style)
    
    @staticmethod
    def get_title_style():
        """Retorna el estilo para títulos de manifiestos."""
        styles = getSampleStyleSheet()
        return ParagraphStyle(
            'FormalTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.black,
            spaceAfter=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
    
    @staticmethod
    def get_heading_style():
        """Retorna el estilo para encabezados de secciones."""
        styles = getSampleStyleSheet()
        return ParagraphStyle(
            'FormalHeading',
            parent=styles['Heading2'],
            fontSize=13,
            textColor=colors.black,
            spaceAfter=5,
            spaceBefore=5,
            fontName='Helvetica-Bold'
        )
    
    @staticmethod
    def get_normal_style():
        """Retorna el estilo para texto normal."""
        styles = getSampleStyleSheet()
        return ParagraphStyle(
            'FormalNormal',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.black,
            fontName='Helvetica'
        )
    
    @staticmethod
    def get_highlight_style():
        """Retorna el estilo para texto resaltado (notas importantes)."""
        styles = getSampleStyleSheet()
        return ParagraphStyle(
            'FormalHighlight',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.black,
            fontName='Helvetica-Bold',
            leftIndent=5,
            rightIndent=5,
            spaceBefore=5,
            spaceAfter=5
        )
    
    @staticmethod
    def _wrap_text(text, style):
        """
        Convierte un texto en un objeto Paragraph para permitir word wrapping.
        
        Args:
            text: Texto a convertir (string, None, o ya un Paragraph)
            style: Estilo ParagraphStyle a aplicar
        
        Returns:
            Paragraph object con el texto y estilo aplicado
        """
        # Si ya es un Paragraph, retornarlo tal cual
        if isinstance(text, Paragraph):
            return text
        
        # Si es None o vacío, retornar '-'
        if not text or text == '':
            return Paragraph('-', style)
        
        # Convertir a string y escapar caracteres especiales para XML/HTML
        text_str = str(text)
        # Escapar caracteres especiales para ReportLab
        text_str = text_str.replace('&', '&amp;')
        text_str = text_str.replace('<', '&lt;')
        text_str = text_str.replace('>', '&gt;')
        
        return Paragraph(text_str, style)
    
    @staticmethod
    def create_highlighted_box(text):
        """
        Crea un párrafo con texto resaltado en una caja con borde.
        
        Args:
            text: Texto a resaltar
        
        Returns:
            Table con el texto resaltado
        """
        # Usar estilo de highlight para el texto
        highlight_style = BaseManifestGenerator.get_highlight_style()
        wrapped_text = BaseManifestGenerator._wrap_text(text, highlight_style)
        
        # Crear una tabla de una celda con borde para resaltar
        table_data = [[wrapped_text]]
        table = Table(table_data, colWidths=[277*mm])  # Ancho disponible en A4 horizontal con márgenes estrechos
        
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f5f5')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 1.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        return table
    
    @staticmethod
    def create_info_table(data, col_widths=None):
        """
        Crea una tabla de información formal (2 columnas: Etiqueta | Valor).
        
        Args:
            data: Lista de tuplas [(etiqueta, valor), ...]
            col_widths: Lista con anchos de columnas (opcional)
        
        Returns:
            Table con estilo formal
        """
        # Estilos para las celdas
        normal_style = BaseManifestGenerator.get_normal_style()
        bold_style = ParagraphStyle(
            'FormalBold',
            parent=normal_style,
            fontName='Helvetica-Bold'
        )
        
        # Convertir datos a formato de tabla con word wrapping
        table_data = []
        for label, value in data:
            wrapped_label = BaseManifestGenerator._wrap_text(label, bold_style)
            wrapped_value = BaseManifestGenerator._wrap_text(value or '-', normal_style)
            table_data.append([wrapped_label, wrapped_value])
        
        # Anchos por defecto si no se especifican
        if col_widths is None:
            # A4 horizontal: 297mm - 20mm (márgenes estrechos) = 277mm disponible
            col_widths = [80 * mm, 197 * mm]
        
        table = Table(table_data, colWidths=col_widths)
        
        # Estilo formal: solo bordes negros, sin colores de fondo
        table.setStyle(TableStyle([
            # Encabezado (primera fila si existe)
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        return table
    
    @staticmethod
    def create_data_table(headers, data_rows, col_widths=None):
        """
        Crea una tabla de datos formal con encabezados.
        
        Args:
            headers: Lista de encabezados
            data_rows: Lista de listas con datos
            col_widths: Lista con anchos de columnas (opcional)
        
        Returns:
            Table con estilo formal
        """
        # Estilos para headers y datos
        normal_style = BaseManifestGenerator.get_normal_style()
        bold_style = ParagraphStyle(
            'FormalBold',
            parent=normal_style,
            fontName='Helvetica-Bold',
            fontSize=8
        )
        data_style = ParagraphStyle(
            'FormalData',
            parent=normal_style,
            fontSize=7
        )
        
        # Convertir headers a Paragraphs con word wrapping
        wrapped_headers = [BaseManifestGenerator._wrap_text(h, bold_style) for h in headers]
        
        # Convertir datos a Paragraphs con word wrapping
        wrapped_data_rows = []
        for row in data_rows:
            wrapped_row = [BaseManifestGenerator._wrap_text(cell, data_style) for cell in row]
            wrapped_data_rows.append(wrapped_row)
        
        # Combinar encabezados y datos
        table_data = [wrapped_headers] + wrapped_data_rows
        
        # Anchos por defecto si no se especifican
        if col_widths is None:
            # Distribuir equitativamente el ancho disponible
            num_cols = len(headers)
            available_width = 277 * mm  # A4 horizontal menos márgenes estrechos
            col_width = available_width / num_cols
            col_widths = [col_width] * num_cols
        
        table = Table(table_data, colWidths=col_widths)
        
        # Estilo formal: encabezado en negrita, bordes negros, sin colores
        table.setStyle(TableStyle([
            # Encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.white),  # Fondo blanco
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.black),  # Línea gruesa bajo encabezado
            # Datos
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ]))
        
        return table
    
    @staticmethod
    def create_data_table_with_highlighted_column(headers, data_rows, col_widths=None, highlighted_col_index=None):
        """
        Crea una tabla de datos formal con encabezados y una columna resaltada.
        
        Args:
            headers: Lista de encabezados
            data_rows: Lista de listas con datos
            col_widths: Lista con anchos de columnas (opcional)
            highlighted_col_index: Índice de la columna a resaltar (0-based)
        
        Returns:
            Table con estilo formal y columna resaltada
        """
        # Estilos para headers y datos
        normal_style = BaseManifestGenerator.get_normal_style()
        bold_style = ParagraphStyle(
            'FormalBold',
            parent=normal_style,
            fontName='Helvetica-Bold',
            fontSize=8
        )
        data_style = ParagraphStyle(
            'FormalData',
            parent=normal_style,
            fontSize=7
        )
        highlighted_style = ParagraphStyle(
            'FormalHighlighted',
            parent=normal_style,
            fontName='Helvetica-Bold',
            fontSize=7
        )
        
        # Convertir headers a Paragraphs con word wrapping
        wrapped_headers = [BaseManifestGenerator._wrap_text(h, bold_style) for h in headers]
        
        # Convertir datos a Paragraphs con word wrapping
        wrapped_data_rows = [
            [
                BaseManifestGenerator._wrap_text(
                    cell,
                    highlighted_style if col_idx == highlighted_col_index else data_style
                )
                for col_idx, cell in enumerate(row)
            ]
            for row in data_rows
        ]
        
        # Combinar encabezados y datos
        table_data = [wrapped_headers] + wrapped_data_rows
        
        # Anchos por defecto si no se especifican
        if col_widths is None:
            # Distribuir equitativamente el ancho disponible
            num_cols = len(headers)
            available_width = 277 * mm  # A4 horizontal menos márgenes estrechos
            col_width = available_width / num_cols
            col_widths = [col_width] * num_cols
        
        table = Table(table_data, colWidths=col_widths)
        
        # Estilo formal: encabezado en negrita, bordes negros, sin colores
        table_style = [
            # Encabezado
            ('BACKGROUND', (0, 0), (-1, 0), colors.white),  # Fondo blanco
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.black),  # Línea gruesa bajo encabezado
            # Datos
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ]
        
        # Resaltar columna específica si se especifica
        if highlighted_col_index is not None:
            # Fondo gris claro para la columna resaltada
            table_style.append(('BACKGROUND', (highlighted_col_index, 1), (highlighted_col_index, -1), colors.HexColor('#f5f5f5')))
            # Texto en negrita para la columna resaltada
            table_style.append(('FONTNAME', (highlighted_col_index, 1), (highlighted_col_index, -1), 'Helvetica-Bold'))
            # Borde más grueso en los lados de la columna resaltada
            table_style.append(('LINEBEFORE', (highlighted_col_index, 0), (highlighted_col_index, -1), 1, colors.black))
            table_style.append(('LINEAFTER', (highlighted_col_index, 0), (highlighted_col_index, -1), 1, colors.black))
        
        table.setStyle(TableStyle(table_style))
        
        return table
    
    @staticmethod
    def format_date(dt):
        """Formatea una fecha en formato estándar."""
        if dt:
            return dt.strftime('%d/%m/%Y %H:%M')
        return '-'
    
    @staticmethod
    def format_datetime_now():
        """Retorna la fecha y hora actual formateada."""
        return datetime.now().strftime('%d/%m/%Y %H:%M')

