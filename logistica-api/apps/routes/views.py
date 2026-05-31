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

from .models import Route, RouteStop
from .serializers import RouteReadSerializer, RouteWriteSerializer, RouteStopSerializer
from .permissions import IsAdminGroup

_STOP_ID_PARAM = OpenApiParameter('stop_id', OpenApiTypes.INT, OpenApiParameter.PATH)


class RouteViewSet(ModelViewSet):
    queryset = Route.objects.select_related(
        'origin_warehouse', 'transport',
    ).prefetch_related('stops').all()
    permission_classes = [IsAuthenticated, IsAdminGroup]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'transport', 'origin_warehouse']
    search_fields = ['name']
    ordering_fields = ['scheduled_date', 'created_at', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return RouteReadSerializer
        return RouteWriteSerializer

    @action(detail=True, methods=['get', 'post'], url_path='stops')
    def stops(self, request, pk=None):
        route = self.get_object()
        if request.method == 'GET':
            serializer = RouteStopSerializer(route.stops.all(), many=True)
            return Response(serializer.data)
        serializer = RouteStopSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(route=route)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(parameters=[_STOP_ID_PARAM])
    @action(detail=True, methods=['patch', 'delete'], url_path=r'stops/(?P<stop_id>[^/.]+)')
    def stop_detail(self, request, pk=None, stop_id=None):
        route = self.get_object()
        stop = get_object_or_404(RouteStop, pk=stop_id, route=route)
        if request.method == 'DELETE':
            stop.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = RouteStopSerializer(stop, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
