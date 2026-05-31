from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'tax_id', 'contact_name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'email', 'tax_id', 'contact_name']
    readonly_fields = ['created_at', 'updated_at']
