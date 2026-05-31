from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'supplier', 'warehouse', 'unit_price', 'stock', 'is_active', 'created_at']
    list_filter = ['is_active', 'supplier', 'warehouse']
    search_fields = ['name', 'sku', 'description']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['supplier', 'warehouse']
