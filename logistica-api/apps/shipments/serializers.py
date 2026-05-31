from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.core.serializers import WarehouseSummarySerializer
from apps.routes.models import Route
from apps.products.models import Product
from .models import Shipment, ShipmentItem

User = get_user_model()


class CustomerSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'customer_type']


class RouteSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = ['id', 'name', 'status']


class CreatedBySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class ProductSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'weight_kg']


class ShipmentItemReadSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(read_only=True)

    class Meta:
        model = ShipmentItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'subtotal']
        read_only_fields = ['id', 'subtotal']


class ShipmentItemWriteSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))

    class Meta:
        model = ShipmentItem
        fields = ['product', 'quantity', 'unit_price']
        extra_kwargs = {'unit_price': {'required': False}}

    def validate(self, data):
        if 'product' in data and ('unit_price' not in data or data.get('unit_price') is None):
            data['unit_price'] = data['product'].unit_price
        return data


class ShipmentReadSerializer(serializers.ModelSerializer):
    customer = CustomerSummarySerializer(read_only=True)
    origin_warehouse = WarehouseSummarySerializer(read_only=True)
    route = RouteSummarySerializer(read_only=True)
    created_by = CreatedBySummarySerializer(read_only=True)
    items = ShipmentItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'tracking_number', 'customer', 'origin_warehouse',
            'destination_address', 'destination_city', 'destination_country',
            'status', 'route', 'estimated_delivery', 'actual_delivery',
            'total_weight_kg', 'calculated_cost', 'notes', 'created_by',
            'items', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'tracking_number', 'total_weight_kg', 'created_at', 'updated_at']


class ShipmentWriteSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.filter(is_active=True))
    origin_warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.filter(is_active=True))
    route = serializers.PrimaryKeyRelatedField(
        queryset=Route.objects.all(), allow_null=True, required=False,
    )

    class Meta:
        model = Shipment
        fields = [
            'id', 'customer', 'origin_warehouse',
            'destination_address', 'destination_city', 'destination_country',
            'status', 'route', 'estimated_delivery', 'actual_delivery',
            'calculated_cost', 'notes',
        ]
        read_only_fields = ['id']
