from django.contrib import admin
from .models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'license_number', 'license_expiry', 'phone', 'is_available', 'created_at']
    list_filter = ['is_available']
    search_fields = ['license_number', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['user']
