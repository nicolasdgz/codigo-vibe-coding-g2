from rest_framework import serializers
from apps.warehouses.models import Warehouse


class WarehouseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'city']
