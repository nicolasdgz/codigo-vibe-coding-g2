import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


class Shipment(TimeStampedModel):
    class ShipmentStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_TRANSIT = 'in_transit', 'In Transit'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'
        RETURNED = 'returned', 'Returned'

    tracking_number = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(
        'customers.Customer', on_delete=models.PROTECT, related_name='shipments',
    )
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.PROTECT, related_name='shipments',
    )
    destination_address = models.TextField()
    destination_city = models.CharField(max_length=100)
    destination_country = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20, choices=ShipmentStatus.choices, default=ShipmentStatus.PENDING,
    )
    route = models.ForeignKey(
        'routes.Route', on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments',
    )
    estimated_delivery = models.DateField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    total_weight_kg = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    calculated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='shipments_created',
    )

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = f"TRK-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def recalculate_weight(self):
        total = sum(
            item.product.weight_kg * item.quantity
            for item in self.items.select_related('product').all()
        )
        self.total_weight_kg = total or Decimal('0.00')
        self.save(update_fields=['total_weight_kg'])

    def __str__(self):
        return f"{self.tracking_number} — {self.get_status_display()}"


class ShipmentItem(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT, related_name='shipment_items',
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x{self.quantity} (Envío {self.shipment.tracking_number})"
