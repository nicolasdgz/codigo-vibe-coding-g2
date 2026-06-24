from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Shipment, ShipmentItem
from .serializers import (
    ShipmentReadSerializer, ShipmentWriteSerializer,
    ShipmentItemReadSerializer, ShipmentItemWriteSerializer,
)
from apps.authentication.permissions import StrictModelPermissions

_ITEM_ID_PARAM = OpenApiParameter('item_id', OpenApiTypes.INT, OpenApiParameter.PATH)


class ShipmentViewSet(ModelViewSet):
    queryset = Shipment.objects.select_related(
        'customer', 'origin_warehouse', 'route', 'created_by',
    ).prefetch_related('items', 'items__product').all()
    permission_classes = [IsAuthenticated, StrictModelPermissions]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'customer', 'origin_warehouse', 'route']
    search_fields = ['tracking_number', 'destination_city', 'destination_country']
    ordering_fields = ['created_at', 'total_weight_kg', 'calculated_cost']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ShipmentReadSerializer
        return ShipmentWriteSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get', 'post'], url_path='items')
    def items(self, request, pk=None):
        shipment = self.get_object()
        if request.method == 'GET':
            serializer = ShipmentItemReadSerializer(
                shipment.items.select_related('product').all(), many=True,
            )
            return Response(serializer.data)
        serializer = ShipmentItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(shipment=shipment)
        shipment.recalculate_weight()
        return Response(ShipmentItemReadSerializer(item).data, status=status.HTTP_201_CREATED)

    @extend_schema(parameters=[_ITEM_ID_PARAM])
    @action(detail=True, methods=['patch', 'delete'], url_path=r'items/(?P<item_id>[^/.]+)')
    def item_detail(self, request, pk=None, item_id=None):
        shipment = self.get_object()
        item = get_object_or_404(ShipmentItem, pk=item_id, shipment=shipment)
        if request.method == 'DELETE':
            item.delete()
            shipment.recalculate_weight()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = ShipmentItemWriteSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        shipment.recalculate_weight()
        return Response(ShipmentItemReadSerializer(item).data)
