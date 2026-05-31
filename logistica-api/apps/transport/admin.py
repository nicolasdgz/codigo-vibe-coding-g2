from django.contrib import admin
from .models import Transport


@admin.register(Transport)
class TransportAdmin(admin.ModelAdmin):
    list_display = ['plate_number', 'vehicle_type', 'brand', 'model', 'year', 'driver', 'is_active', 'created_at']
    list_filter = ['vehicle_type', 'is_active']
    search_fields = ['plate_number', 'brand', 'model']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['driver']
