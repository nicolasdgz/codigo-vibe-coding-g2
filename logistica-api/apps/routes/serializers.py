from rest_framework import serializers
from apps.warehouses.models import Warehouse
from apps.core.serializers import WarehouseSummarySerializer
from apps.transport.models import Transport
from .models import Route, RouteStop


class TransportSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Transport
        fields = ['id', 'plate_number', 'vehicle_type', 'brand']


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = ['id', 'order', 'address', 'city', 'estimated_arrival', 'actual_arrival']
        read_only_fields = ['id']


class RouteReadSerializer(serializers.ModelSerializer):
    origin_warehouse = WarehouseSummarySerializer(read_only=True)
    transport = TransportSummarySerializer(read_only=True)
    stops = RouteStopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = [
            'id', 'name', 'origin_warehouse', 'transport',
            'status', 'scheduled_date', 'stops', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RouteWriteSerializer(serializers.ModelSerializer):
    origin_warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    transport = serializers.PrimaryKeyRelatedField(queryset=Transport.objects.all())

    class Meta:
        model = Route
        fields = ['id', 'name', 'origin_warehouse', 'transport', 'status', 'scheduled_date']
        read_only_fields = ['id']
