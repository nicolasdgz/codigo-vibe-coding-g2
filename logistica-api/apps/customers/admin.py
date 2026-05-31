from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'customer_type', 'email', 'tax_id', 'is_active', 'created_at']
    list_filter = ['customer_type', 'is_active']
    search_fields = ['name', 'email', 'tax_id']
    readonly_fields = ['created_at', 'updated_at']
