from django.db import models
from apps.core.models import TimeStampedModel


class Transport(TimeStampedModel):
    class VehicleType(models.TextChoices):
        TRUCK = 'truck', 'Truck'
        VAN = 'van', 'Van'
        MOTORCYCLE = 'motorcycle', 'Motorcycle'
        CAR = 'car', 'Car'

    plate_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VehicleType.choices)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    capacity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    capacity_units = models.PositiveIntegerField()
    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicles',
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Transport'
        verbose_name_plural = 'Transports'

    def __str__(self):
        return f"{self.plate_number} — {self.get_vehicle_type_display()}"
