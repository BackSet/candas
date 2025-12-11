from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from apps.report.models import ReportSchedule
from apps.report.api.serializers import (
    ReportScheduleSerializer,
    ReportScheduleCreateSerializer,
)


class ReportScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar reportes programados.
    
    Permite CRUD completo de programaciones de reportes:
    - list: Listar todas las programaciones del usuario
    - retrieve: Obtener una programación específica
    - create: Crear nueva programación
    - update/partial_update: Actualizar programación
    - destroy: Eliminar programación
    
    Actions adicionales:
    - toggle_active: Activar/desactivar programación
    - run_now: Ejecutar manualmente un reporte programado
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['report_type', 'frequency', 'active']
    ordering_fields = ['name', 'created_at', 'next_run', 'last_run']
    search_fields = ['name', 'report_type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Solo devuelve las programaciones del usuario actual."""
        return ReportSchedule.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Selecciona el serializer según la acción."""
        if self.action in ['create', 'update', 'partial_update']:
            return ReportScheduleCreateSerializer
        return ReportScheduleSerializer
    
    def perform_create(self, serializer):
        """Asigna el usuario actual al crear."""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Activa o desactiva una programación.
        
        POST /api/v1/report-schedules/{id}/toggle_active/
        """
        schedule = self.get_object()
        schedule.active = not schedule.active
        schedule.save(update_fields=['active'])
        
        serializer = self.get_serializer(schedule)
        return Response({
            'message': f"Programación {'activada' if schedule.active else 'desactivada'} correctamente",
            'schedule': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def run_now(self, request, pk=None):
        """
        Ejecuta manualmente un reporte programado.
        
        POST /api/v1/report-schedules/{id}/run_now/
        
        Genera el reporte según la configuración actual de la programación,
        sin esperar al next_run.
        """
        from apps.report.services import ReportGenerator
        from django.utils import timezone
        
        schedule = self.get_object()
        
        try:
            # Determinar el tipo de reporte a generar
            report_type_map = {
                'packages': 'packages_report',
                'statistics': 'statistics_report',
                'agencies': 'agencies_performance',
                'destinations': 'destinations_report',
            }
            
            report_method = report_type_map.get(schedule.report_type)
            
            if not report_method:
                return Response(
                    {'error': 'Tipo de reporte no soportado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener configuración (filtros, formato, etc.)
            config = schedule.config or {}
            
            # Generar el reporte
            from datetime import datetime, timedelta
            
            # Por defecto, reporte del día actual
            end_date = timezone.now().date()
            start_date = end_date
            
            if schedule.frequency == 'MONTHLY':
                # Para mensuales, último mes completo
                start_date = end_date.replace(day=1)
                next_month = start_date + timedelta(days=32)
                end_date = next_month.replace(day=1) - timedelta(days=1)
            elif schedule.frequency == 'WEEKLY':
                # Para semanales, últimos 7 días
                start_date = end_date - timedelta(days=7)
            
            # Agregar fechas a la config
            config['start_date'] = start_date.isoformat()
            config['end_date'] = end_date.isoformat()
            
            # Generar reporte según tipo
            generator = ReportGenerator()
            
            if report_method == 'packages_report':
                result = generator.generate_packages_report(
                    start_date=start_date,
                    end_date=end_date,
                    format='json',
                    **config
                )
            elif report_method == 'statistics_report':
                result = generator.generate_statistics_report(
                    start_date=start_date,
                    end_date=end_date,
                    format='json'
                )
            elif report_method == 'agencies_performance':
                result = generator.generate_agencies_performance(
                    start_date=start_date,
                    end_date=end_date,
                    format='json'
                )
            elif report_method == 'destinations_report':
                result = generator.generate_destinations_report(
                    start_date=start_date,
                    end_date=end_date,
                    format='json'
                )
            
            # Actualizar last_run
            schedule.last_run = timezone.now()
            schedule.save(update_fields=['last_run'])
            
            return Response({
                'message': 'Reporte generado exitosamente',
                'data': result,
                'schedule_updated': True
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error al generar reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
