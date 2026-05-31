from rest_framework import serializers
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse
from apps.core.serializers import WarehouseSummarySerializer
from .models import Product


class SupplierSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name']


class ProductReadSerializer(serializers.ModelSerializer):
    supplier = SupplierSummarySerializer(read_only=True)
    warehouse = WarehouseSummarySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'weight_kg', 'dimensions',
            'unit_price', 'stock', 'supplier', 'warehouse', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductWriteSerializer(serializers.ModelSerializer):
    supplier = serializers.PrimaryKeyRelatedField(queryset=Supplier.objects.all())
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'weight_kg', 'dimensions',
            'unit_price', 'stock', 'supplier', 'warehouse', 'is_active',
        ]
        read_only_fields = ['id']
