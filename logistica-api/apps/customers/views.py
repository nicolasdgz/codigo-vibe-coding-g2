from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Customer
from .serializers import CustomerSerializer
from apps.authentication.permissions import StrictModelPermissions


class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, StrictModelPermissions]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['customer_type', 'is_active']
    search_fields = ['name', 'email', 'tax_id']
    ordering_fields = ['name', 'customer_type', 'created_at']
    ordering = ['-created_at']
