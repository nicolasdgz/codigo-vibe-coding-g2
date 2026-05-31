from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Driver
from .serializers import DriverReadSerializer, DriverWriteSerializer
from .permissions import IsAdminGroup


class DriverViewSet(ModelViewSet):
    queryset = Driver.objects.select_related('user').all()
    permission_classes = [IsAuthenticated, IsAdminGroup]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_available']
    search_fields = ['license_number', 'user__username', 'user__first_name', 'user__last_name']
    ordering_fields = ['license_expiry', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return DriverReadSerializer
        return DriverWriteSerializer
