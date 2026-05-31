from django.contrib import admin
from .models import Route, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    fields = ['order', 'address', 'city', 'estimated_arrival', 'actual_arrival']


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'origin_warehouse', 'transport', 'status', 'scheduled_date', 'created_at']
    list_filter = ['status']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['origin_warehouse', 'transport']
    inlines = [RouteStopInline]
