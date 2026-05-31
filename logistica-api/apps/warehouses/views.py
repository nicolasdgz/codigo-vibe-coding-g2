from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Warehouse
from .serializers import WarehouseSerializer
from .permissions import IsAdminOrWarehouseStaff


class WarehouseViewSet(ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrWarehouseStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['city', 'country', 'is_active']
    search_fields = ['name', 'address', 'city']
    ordering_fields = ['name', 'city', 'capacity', 'created_at']
    ordering = ['-created_at']
