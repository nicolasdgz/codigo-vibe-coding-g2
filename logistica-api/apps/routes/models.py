from django.db import models
from apps.core.models import TimeStampedModel


class Route(TimeStampedModel):
    class RouteStatus(models.TextChoices):
        PLANNED = 'planned', 'Planned'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    name = models.CharField(max_length=255)
    origin_warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.PROTECT, related_name='routes',
    )
    transport = models.ForeignKey(
        'transport.Transport', on_delete=models.PROTECT, related_name='routes',
    )
    status = models.CharField(
        max_length=20, choices=RouteStatus.choices, default=RouteStatus.PLANNED,
    )
    scheduled_date = models.DateField()

    def __str__(self):
        return f"{self.name} — {self.get_status_display()}"


class RouteStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    order = models.PositiveIntegerField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    estimated_arrival = models.DateTimeField(null=True, blank=True)
    actual_arrival = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Stop {self.order} — {self.city} ({self.route.name})"
