from django.db import models
from apps.core.models import TimeStampedModel


class Customer(TimeStampedModel):
    class CustomerType(models.TextChoices):
        COMPANY = 'company', 'Company'
        PERSON = 'person', 'Person'

    name = models.CharField(max_length=255)
    customer_type = models.CharField(max_length=10, choices=CustomerType.choices)
    email = models.EmailField(max_length=254, unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    tax_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'

    def __str__(self):
        return f"{self.name} ({self.get_customer_type_display()})"
