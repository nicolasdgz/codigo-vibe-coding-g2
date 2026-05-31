from rest_framework import serializers
from apps.drivers.models import Driver
from .models import Transport


class DriverSummarySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Driver
        fields = ['id', 'license_number', 'name', 'is_available']

    def get_name(self, obj) -> str:
        return obj.user.get_full_name() or obj.user.username


class TransportReadSerializer(serializers.ModelSerializer):
    driver = DriverSummarySerializer(read_only=True)

    class Meta:
        model = Transport
        fields = [
            'id', 'plate_number', 'vehicle_type', 'brand', 'model', 'year',
            'capacity_kg', 'capacity_units', 'driver', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransportWriteSerializer(serializers.ModelSerializer):
    driver = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Transport
        fields = [
            'id', 'plate_number', 'vehicle_type', 'brand', 'model', 'year',
            'capacity_kg', 'capacity_units', 'driver', 'is_active',
        ]
        read_only_fields = ['id']
