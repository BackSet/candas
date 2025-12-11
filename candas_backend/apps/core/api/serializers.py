"""
Serializers para el módulo Core
"""
from rest_framework import serializers
from ..models import UserPreferences


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = ['id', 'barcode_scan_config', 'updated_at']
        read_only_fields = ['id', 'updated_at']
