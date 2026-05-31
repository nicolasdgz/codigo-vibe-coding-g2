# Spec: routes

## Modelos

### `Route` (hereda `TimeStampedModel`)

| Campo | Tipo Django | Notas |
|---|---|---|
| `name` | `CharField(max_length=255)` | |
| `origin_warehouse` | `ForeignKey('warehouses.Warehouse', on_delete=PROTECT)` | bodega de inicio |
| `transport` | `ForeignKey('transport.Transport', on_delete=PROTECT)` | |
| `status` | `CharField(max_length=20, choices=RouteStatus.choices, default=RouteStatus.PLANNED)` | |
| `scheduled_date` | `DateField()` | |

**Choices internos:**
```python
class RouteStatus(models.TextChoices):
    PLANNED = 'planned', 'Planned'
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'
```

**`__str__`:** `f"{self.name} — {self.get_status_display()}"`

**Meta:** ninguna especial

---

### `RouteStop` (NO hereda `TimeStampedModel` — sin timestamps según schema)

| Campo | Tipo Django | Notas |
|---|---|---|
| `route` | `ForeignKey(Route, on_delete=CASCADE, related_name='stops')` | |
| `order` | `PositiveIntegerField()` | posición en secuencia |
| `address` | `TextField()` | |
| `city` | `CharField(max_length=100)` | |
| `estimated_arrival` | `DateTimeField(null=True, blank=True)` | |
| `actual_arrival` | `DateTimeField(null=True, blank=True)` | |

**`__str__`:** `f"Stop {self.order} — {self.city} ({self.route.name})"`

**Meta:** `ordering = ['order']`

---

## Serializers

### Para `Route`

**`WarehouseSummarySerializer`** (inline, para lectura):
```python
fields = ['id', 'name', 'city']
```

**`TransportSummarySerializer`** (inline, para lectura):
```python
fields = ['id', 'plate_number', 'vehicle_type', 'brand']
```

**`RouteStopSerializer`** (lectura y escritura comparten mismo serializer):
```python
fields = ['id', 'order', 'address', 'city', 'estimated_arrival', 'actual_arrival']
read_only_fields = ['id']
```

**`RouteReadSerializer`:**
```python
origin_warehouse = WarehouseSummarySerializer(read_only=True)
transport = TransportSummarySerializer(read_only=True)
stops = RouteStopSerializer(many=True, read_only=True)
fields = ['id', 'name', 'origin_warehouse', 'transport', 'status', 'scheduled_date', 'stops', 'created_at', 'updated_at']
read_only_fields = ['id', 'created_at', 'updated_at']
```

**`RouteWriteSerializer`:**
```python
origin_warehouse = PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
transport = PrimaryKeyRelatedField(queryset=Transport.objects.all())
# stops NO incluido — gestionados vía endpoint separado /stops/
fields = ['id', 'name', 'origin_warehouse', 'transport', 'status', 'scheduled_date']
read_only_fields = ['id']
```

---

## ViewSets

### `RouteViewSet(ModelViewSet)`

```python
queryset = Route.objects.select_related('origin_warehouse', 'transport').prefetch_related('stops').all()
permission_classes = [IsAuthenticated, IsAdminGroup]
filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
filterset_fields = ['status', 'transport', 'origin_warehouse']
search_fields = ['name']
ordering_fields = ['scheduled_date', 'created_at', 'status']
ordering = ['-created_at']
```

`get_serializer_class()`:
- list / retrieve → `RouteReadSerializer`
- create / update / partial_update → `RouteWriteSerializer`

**@action `stops`** — endpoint anidado para gestionar paradas:

```python
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
```

**@action `stop_detail`** — actualizar/eliminar parada individual:

```python
@action(detail=True, methods=['patch', 'delete'], url_path='stops/(?P<stop_id>[^/.]+)')
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
```

### `RouteStopViewSet` — NO crear. Gestionar stops vía @action de Route.

---

## URLs

`apps/routes/urls.py`:
```python
from rest_framework.routers import DefaultRouter
from .views import RouteViewSet

app_name = 'routes'
router = DefaultRouter()
router.register(r'', RouteViewSet, basename='route')
urlpatterns = router.urls
```

Montado en `config/urls.py` como:
```python
path('api/v1/routes/', include('apps.routes.urls')),
```

---

## Admin

```python
class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    fields = ['order', 'address', 'city', 'estimated_arrival', 'actual_arrival']

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'origin_warehouse', 'transport', 'status', 'scheduled_date', 'created_at']
    list_filter = ['status']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['origin_warehouse', 'transport']
    inlines = [RouteStopInline]
```

---

## Permisos

`apps/routes/permissions.py`:
```python
class IsAdminGroup(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.groups.filter(name='admin').exists()
```

---

## Tests

### `test_models.py` (8 tests)

- [ ] `test_create_route` — crear Route con warehouse + transport, verificar campos
- [ ] `test_route_str` — verificar `__str__` = `"<name> — Planned"`
- [ ] `test_default_status_planned` — status default = `'planned'`
- [ ] `test_route_stop_str` — verificar `__str__` de RouteStop
- [ ] `test_route_stop_ordering` — stops ordenados por `order`
- [ ] `test_stops_cascade_on_route_delete` — al borrar Route, stops se eliminan
- [ ] `test_route_protect_on_warehouse_delete` — `ProtectedError` al borrar warehouse con ruta
- [ ] `test_route_protect_on_transport_delete` — `ProtectedError` al borrar transport con ruta
- [ ] `test_timestamps_auto_generated` — `created_at` y `updated_at` no nulos

### `test_api.py` (15 tests)

**Setup:** crear warehouse, transport (con driver), admin JWT

- [ ] `test_list_routes` — GET 200, paginado con `count`+`results`
- [ ] `test_list_returns_nested_objects` — resultado contiene `origin_warehouse.name`, `transport.plate_number`, `stops` (lista)
- [ ] `test_create_route` — POST 201, campos correctos
- [ ] `test_retrieve_route` — GET 200, incluye stops anidados
- [ ] `test_update_route` — PUT 200, cambiar `scheduled_date`
- [ ] `test_partial_update_status` — PATCH 200, cambiar solo `status`
- [ ] `test_delete_route` — DELETE 204
- [ ] `test_unauthenticated_returns_401` — GET sin token → 401
- [ ] `test_filter_by_status` — `?status=planned` filtra correctamente
- [ ] `test_filter_by_transport` — `?transport=<id>` filtra correctamente
- [ ] `test_add_stop` — POST `/api/v1/routes/<id>/stops/` → 201
- [ ] `test_list_stops` — GET `/api/v1/routes/<id>/stops/` → 200, lista de stops
- [ ] `test_patch_stop` — PATCH `/api/v1/routes/<id>/stops/<stop_id>/` → 200
- [ ] `test_delete_stop` — DELETE `/api/v1/routes/<id>/stops/<stop_id>/` → 204
- [ ] `test_create_missing_required_field` — POST sin `name` → 400
