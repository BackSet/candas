from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PDFExporter:
    """
    Exportador de informes a formato PDF usando ReportLab.
    """
    
    def __init__(self, report):
        """
        Inicializa el exportador con un informe.
        
        Args:
            report: Instancia de Report
        """
        self.report = report
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configura estilos personalizados para el PDF."""
        # Estilo para títulos principales
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        # Estilo para subtítulos
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2c5282'),
            spaceAfter=12,
            spaceBefore=12
        ))
        
        # Estilo para texto normal
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6
        ))
    
    def generate(self):
        """
        Genera el PDF y retorna un objeto BytesIO.
        
        Returns:
            BytesIO: Buffer con el contenido del PDF
        """
        logger.info(f"Generando PDF para informe {self.report.id}")
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )
        
        # Contenedor de elementos del PDF
        elements = []
        
        # Título del informe
        title = self._get_report_title()
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 12))
        
        # Información del periodo
        period_info = self._get_period_info()
        elements.append(Paragraph(period_info, self.styles['CustomBody']))
        elements.append(Spacer(1, 20))
        
        # Resumen general
        elements.append(Paragraph("Resumen General", self.styles['CustomHeading']))
        summary_table = self._create_summary_table()
        elements.append(summary_table)
        elements.append(Spacer(1, 20))
        
        # Desglose por agencia
        if self.report.json_data and 'by_agency' in self.report.json_data:
            elements.append(Paragraph("Desglose por Agencia de Transporte", self.styles['CustomHeading']))
            agency_table = self._create_agency_table()
            elements.append(agency_table)
            elements.append(Spacer(1, 20))
        
        # Desglose por destino
        if self.report.json_data and 'by_destination' in self.report.json_data:
            elements.append(Paragraph("Desglose por Destino", self.styles['CustomHeading']))
            destination_table = self._create_destination_table()
            elements.append(destination_table)
            elements.append(Spacer(1, 20))
        
        # Desglose por estado
        if self.report.json_data and 'by_status' in self.report.json_data:
            elements.append(Paragraph("Desglose por Estado de Paquetes", self.styles['CustomHeading']))
            status_table = self._create_status_table()
            elements.append(status_table)
        
        # Construir el PDF
        doc.build(elements)
        
        buffer.seek(0)
        logger.info(f"PDF generado exitosamente para informe {self.report.id}")
        return buffer
    
    def _get_report_title(self):
        """Retorna el título del informe."""
        if self.report.report_type == 'DAILY':
            return f"Informe Diario de Envíos - {self.report.report_date.strftime('%d/%m/%Y')}"
        else:
            return f"Informe Mensual de Envíos - {self.report.report_date.strftime('%m/%Y')}"
    
    def _get_period_info(self):
        """Retorna información del periodo del informe."""
        generated_at = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        generated_by = self.report.generated_by.username if self.report.generated_by else 'Sistema Automático'
        
        return f"Generado el {generated_at} por {generated_by}"
    
    def _create_summary_table(self):
        """Crea la tabla de resumen general."""
        data = [
            ['Métrica', 'Cantidad'],
            ['Total de Paquetes', str(self.report.total_packages)],
            ['Paquetes Individuales', str(self.report.total_individual_packages)],
            ['Paquetes en Sacas', str(self.report.total_packages - self.report.total_individual_packages)],
            ['Total de Sacas', str(self.report.total_sacas)],
            ['Total de Lotes', str(self.report.total_lotes)],
        ]
        
        table = Table(data, colWidths=[4*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        return table
    
    def _create_agency_table(self):
        """Crea la tabla de desglose por agencia."""
        data = [['Agencia', 'Paquetes', 'Sacas', 'Lotes']]
        
        by_agency = self.report.json_data.get('by_agency', {})
        for agency_name, metrics in sorted(by_agency.items()):
            data.append([
                agency_name,
                str(metrics['packages_count']),
                str(metrics['sacas_count']),
                str(metrics['lotes_count']),
            ])
        
        table = Table(data, colWidths=[3*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        return table
    
    def _create_destination_table(self):
        """Crea la tabla de desglose por destino."""
        data = [['Destino', 'Paquetes', 'Sacas', 'Lotes']]
        
        by_destination = self.report.json_data.get('by_destination', {})
        # Ordenar por cantidad de paquetes descendente
        sorted_destinations = sorted(
            by_destination.items(),
            key=lambda x: x[1]['packages_count'],
            reverse=True
        )
        
        for destination, metrics in sorted_destinations[:20]:  # Top 20 destinos
            data.append([
                destination,
                str(metrics['packages_count']),
                str(metrics['sacas_count']),
                str(metrics['lotes_count']),
            ])
        
        table = Table(data, colWidths=[3*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        return table
    
    def _create_status_table(self):
        """Crea la tabla de desglose por estado."""
        data = [['Estado', 'Total', 'Individuales', 'En Sacas']]
        
        by_status = self.report.json_data.get('by_status', {})
        for status, metrics in sorted(by_status.items()):
            data.append([
                status,
                str(metrics['count']),
                str(metrics['individual_count']),
                str(metrics['in_pull_count']),
            ])
        
        table = Table(data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5282')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        return table
