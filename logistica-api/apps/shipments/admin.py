from django.contrib import admin
from .models import Shipment, ShipmentItem


class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 0
    fields = ['product', 'quantity', 'unit_price', 'subtotal']
    readonly_fields = ['subtotal']


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = [
        'tracking_number', 'customer', 'status', 'destination_city',
        'total_weight_kg', 'calculated_cost', 'created_at',
    ]
    list_filter = ['status']
    search_fields = ['tracking_number', 'destination_city', 'destination_country']
    readonly_fields = ['tracking_number', 'total_weight_kg', 'created_at', 'updated_at']
    autocomplete_fields = ['customer', 'origin_warehouse', 'route']
    inlines = [ShipmentItemInline]
