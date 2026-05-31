from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Product
from .serializers import ProductReadSerializer, ProductWriteSerializer
from .permissions import IsAdminOrWarehouseStaff


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.select_related('supplier', 'warehouse').all()
    permission_classes = [IsAuthenticated, IsAdminOrWarehouseStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['supplier', 'warehouse', 'is_active']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'sku', 'unit_price', 'stock', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProductReadSerializer
        return ProductWriteSerializer
