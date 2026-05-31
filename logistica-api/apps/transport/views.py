from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Transport
from .serializers import TransportReadSerializer, TransportWriteSerializer
from .permissions import IsAdminGroup


class TransportViewSet(ModelViewSet):
    queryset = Transport.objects.select_related('driver', 'driver__user').all()
    permission_classes = [IsAuthenticated, IsAdminGroup]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vehicle_type', 'is_active', 'driver']
    search_fields = ['plate_number', 'brand', 'model']
    ordering_fields = ['plate_number', 'year', 'capacity_kg', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return TransportReadSerializer
        return TransportWriteSerializer
