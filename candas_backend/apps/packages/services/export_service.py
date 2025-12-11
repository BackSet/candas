"""
Servicio para exportar paquetes a Excel y PDF
"""
from typing import TYPE_CHECKING
from django.http import HttpResponse
from django.db.models import QuerySet
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime

if TYPE_CHECKING:
    from ..models import Package


class PackageExportService:
    """Servicio para exportar paquetes a diferentes formatos"""
    
    # Campos disponibles para exportación
    AVAILABLE_FIELDS = {
        'guide_number': 'Número de Guía',
        'nro_master': 'Número Master',
        'name': 'Nombre Destinatario',
        'address': 'Dirección',
        'city': 'Ciudad',
        'province': 'Provincia',
        'phone_number': 'Teléfono',
        'status': 'Estado',
        'shipment_type_display': 'Tipo de Envío',
        'transport_agency_name': 'Agencia de Transporte',
        'delivery_agency_name': 'Agencia de Reparto',
        'effective_destiny': 'Destino Efectivo',
        'effective_guide_number': 'Guía Efectiva',
        'pull_name': 'Saca',
        'batch_name': 'Lote',
        'notes': 'Notas',
        'hashtags': 'Hashtags',
        'created_at': 'Fecha Creación',
        'updated_at': 'Fecha Actualización'
    }
    
    @classmethod
    def get_package_field_value(cls, package: "Package", field_name: str) -> str:
        """
        Extrae el valor de un campo del paquete
        Maneja campos relacionados, computados y formatea correctamente
        """
        try:
            match field_name:
                case 'status':
                    return package.get_status_display()
                
                case 'shipment_type_display':
                    return package.get_shipment_type_display()
                
                case 'transport_agency_name':
                    if package.transport_agency:
                        return package.transport_agency.name
                    # Si no tiene agencia propia, obtener la efectiva
                    effective_agency = package.get_shipping_agency()
                    return effective_agency.name if effective_agency else 'N/A'
                
                case 'delivery_agency_name':
                    return package.delivery_agency.name if package.delivery_agency else 'N/A'
                
                case 'effective_destiny':
                    return package.get_effective_destiny() or 'N/A'
                
                case 'effective_guide_number':
                    return package.get_shipping_guide_number() or 'N/A'
                
                case 'pull_name':
                    return f"Saca-{package.pull.id}" if package.pull else 'N/A'
                
                case 'batch_name':
                    if batch := package.get_batch():
                        return f"Lote-{batch.id}"
                    return 'N/A'
                
                case 'created_at' | 'updated_at':
                    if date_value := getattr(package, field_name, None):
                        return date_value.strftime('%Y-%m-%d %H:%M:%S')
                    return 'N/A'
                
                case 'hashtags':
                    if hashtags := getattr(package, field_name, None):
                        return ', '.join(hashtags) if isinstance(hashtags, list) else str(hashtags)
                    return ''
                
                case _:
                    # Campo directo del modelo
                    value = getattr(package, field_name, None)
                    return str(value) if value is not None else ''
                
        except Exception as e:
            print(f"Error al obtener campo {field_name}: {str(e)}")
            return 'Error'
    
    @classmethod
    def generate_excel(cls, queryset: QuerySet["Package"], columns_config: list[str]) -> HttpResponse:
        """
        Genera un archivo Excel con los paquetes especificados
        
        Args:
            queryset: QuerySet de Package
            columns_config: Lista de IDs de campos a incluir en orden
        
        Returns:
            HttpResponse con el archivo Excel
        """
        # Crear workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Paquetes"
        
        # Si no hay columnas especificadas, usar todas
        if not columns_config:
            columns_config = list(cls.AVAILABLE_FIELDS.keys())
        
        # Agregar headers
        headers = [cls.AVAILABLE_FIELDS.get(col, col) for col in columns_config]
        ws.append(headers)
        
        # Formatear headers
        header_font = Font(bold=True, size=12)
        header_alignment = Alignment(horizontal='center', vertical='center')
        
        # Aplicar formato a todas las celdas del header de una vez
        for cell in ws[1]:
            cell.font = header_font
            cell.alignment = header_alignment
        
        # Agregar datos
        for package in queryset:
            row_data = [
                cls.get_package_field_value(package, field_name)
                for field_name in columns_config
            ]
            ws.append(row_data)
        
        # Auto-ajustar ancho de columnas
        for column in ws.columns:
            column_letter = column[0].column_letter
            # Usar generador para eficiencia en memoria
            max_length = max(
                (len(str(cell.value)) for cell in column if cell.value),
                default=0
            )
            adjusted_width = min(max_length + 2, 50)  # Máximo 50 caracteres
            ws.column_dimensions[column_letter].width = adjusted_width
        
        # Preparar respuesta HTTP
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"paquetes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    
    @classmethod
    def generate_pdf(cls, queryset: QuerySet["Package"], columns_config: list[str]) -> HttpResponse:
        """
        Genera un archivo PDF con los paquetes especificados
        
        Args:
            queryset: QuerySet de Package
            columns_config: Lista de IDs de campos a incluir en orden
        
        Returns:
            HttpResponse con el archivo PDF
        """
        # Si no hay columnas especificadas, usar las principales
        if not columns_config:
            columns_config = ['guide_number', 'name', 'city', 'status', 'shipment_type_display']
        
        # Limitar columnas para que quepan en PDF (máximo 6 columnas para landscape)
        if len(columns_config) > 6:
            columns_config = columns_config[:6]
        
        # Preparar buffer
        buffer = BytesIO()
        
        # Crear documento en modo landscape para más espacio
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        # Contenedor de elementos
        elements = []
        
        # Agregar título
        styles = getSampleStyleSheet()
        title = Paragraph(
            f"<b>Reporte de Paquetes - {datetime.now().strftime('%Y-%m-%d %H:%M')}</b>",
            styles['Title']
        )
        elements.append(title)
        elements.append(Paragraph("<br/><br/>", styles['Normal']))
        
        # Preparar datos de tabla
        table_data = []
        
        # Headers
        headers = [cls.AVAILABLE_FIELDS.get(col, col) for col in columns_config]
        table_data.append(headers)
        
        # Datos
        for package in queryset:
            row_data = [
                (str(value)[:27] + '...' if len(str(value)) > 30 else value)
                if (value := cls.get_package_field_value(package, field_name)) else ''
                for field_name in columns_config
            ]
            table_data.append(row_data)
        
        # Calcular ancho de columnas dinámicamente
        page_width = landscape(letter)[0] - 60  # Restar márgenes
        col_width = page_width / len(columns_config)
        col_widths = [col_width] * len(columns_config)
        
        # Crear tabla
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        
        # Estilo de tabla
        table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Body
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        elements.append(table)
        
        # Construir PDF
        doc.build(elements)
        
        # Preparar respuesta HTTP
        buffer.seek(0)
        filename = f"paquetes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
