from rest_framework import serializers
from apps.report.models import Report, ReportDetail, ReportSchedule, ReportSchedule


class ReportDetailSerializer(serializers.ModelSerializer):
    """Serializer para los detalles del informe."""
    
    transport_agency_name = serializers.CharField(
        source='transport_agency.name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = ReportDetail
        fields = [
            'id',
            'transport_agency',
            'transport_agency_name',
            'destination',
            'package_status',
            'packages_count',
            'sacas_count',
            'lotes_count',
            'created_at',
        ]
        read_only_fields = fields


class ReportSerializer(serializers.ModelSerializer):
    """Serializer principal para informes."""
    
    report_type_display = serializers.CharField(
        source='get_report_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    generated_by_username = serializers.CharField(
        source='generated_by.username',
        read_only=True,
        allow_null=True
    )
    filename_base = serializers.CharField(
        source='get_filename_base',
        read_only=True
    )
    
    # URLs de descarga
    pdf_url = serializers.SerializerMethodField()
    excel_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id',
            'report_type',
            'report_type_display',
            'report_date',
            'status',
            'status_display',
            'total_packages',
            'total_sacas',
            'total_lotes',
            'total_individual_packages',
            'generated_by',
            'generated_by_username',
            'is_automatic',
            'error_message',
            'has_pdf',
            'has_excel',
            'has_json',
            'pdf_url',
            'excel_url',
            'filename_base',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'total_packages',
            'total_sacas',
            'total_lotes',
            'total_individual_packages',
            'error_message',
            'created_at',
            'updated_at',
        ]
    
    def get_pdf_url(self, obj):
        """Retorna la URL del archivo PDF si existe."""
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return None
    
    def get_excel_url(self, obj):
        """Retorna la URL del archivo Excel si existe."""
        if obj.excel_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.excel_file.url)
            return obj.excel_file.url
        return None


class ReportDetailedSerializer(ReportSerializer):
    """Serializer con información detallada incluyendo detalles y datos JSON."""
    
    details = ReportDetailSerializer(many=True, read_only=True)
    
    class Meta(ReportSerializer.Meta):
        fields = ReportSerializer.Meta.fields + ['details', 'json_data']


class GenerateReportSerializer(serializers.Serializer):
    """Serializer para la generación manual de informes."""
    
    report_date = serializers.DateField(
        required=True,
        help_text='Fecha del informe (para diarios) o primer día del mes (para mensuales)'
    )
    generate_files = serializers.BooleanField(
        default=True,
        help_text='Si se deben generar los archivos PDF y Excel inmediatamente'
    )
    
    def validate_report_date(self, value):
        """Valida que la fecha no sea futura."""
        from django.utils import timezone
        
        if value > timezone.now().date():
            raise serializers.ValidationError(
                "No se pueden generar informes de fechas futuras."
            )
        return value


class GenerateMonthlyReportSerializer(serializers.Serializer):
    """Serializer para la generación manual de informes mensuales."""
    
    year = serializers.IntegerField(
        required=True,
        min_value=2020,
        max_value=2100,
        help_text='Año del informe'
    )
    month = serializers.IntegerField(
        required=True,
        min_value=1,
        max_value=12,
        help_text='Mes del informe (1-12)'
    )
    generate_files = serializers.BooleanField(
        default=True,
        help_text='Si se deben generar los archivos PDF y Excel inmediatamente'
    )
    
    def validate(self, attrs):
        """Valida que el mes/año no sea futuro."""
        from django.utils import timezone
        from datetime import date
        
        year = attrs['year']
        month = attrs['month']
        now = timezone.now()
        
        if year > now.year or (year == now.year and month > now.month):
            raise serializers.ValidationError(
                "No se pueden generar informes de periodos futuros."
            )
        
        return attrs


class ReportScheduleSerializer(serializers.ModelSerializer):
    """Serializer para reportes programados."""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    
    class Meta:
        model = ReportSchedule
        fields = [
            'id',
            'user',
            'user_username',
            'name',
            'report_type',
            'report_type_display',
            'frequency',
            'frequency_display',
            'config',
            'active',
            'last_run',
            'next_run',
            'recipients',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'last_run', 'next_run', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Asigna el usuario actual al crear."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReportScheduleCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear reportes programados."""
    
    class Meta:
        model = ReportSchedule
        fields = [
            'name',
            'report_type',
            'frequency',
            'config',
            'active',
            'recipients',
        ]
    
    def validate_recipients(self, value):
        """Valida que los destinatarios sean emails válidos."""
        if not value or not isinstance(value, list):
            raise serializers.ValidationError("Los destinatarios deben ser una lista de emails.")
        
        for email in value:
            if not isinstance(email, str) or '@' not in email:
                raise serializers.ValidationError(f"Email inválido: {email}")
        
        return value
    
    def create(self, validated_data):
        """Asigna el usuario actual y calcula next_run."""
        from django.utils import timezone
        from datetime import timedelta
        
        validated_data['user'] = self.context['request'].user
        
        # Calcular next_run según frequency
        frequency = validated_data.get('frequency', 'DAILY')
        now = timezone.now()
        
        if frequency == 'DAILY':
            validated_data['next_run'] = now + timedelta(days=1)
        elif frequency == 'WEEKLY':
            validated_data['next_run'] = now + timedelta(weeks=1)
        elif frequency == 'MONTHLY':
            validated_data['next_run'] = now + timedelta(days=30)
        else:
            validated_data['next_run'] = now + timedelta(days=1)
        
        return super().create(validated_data)
