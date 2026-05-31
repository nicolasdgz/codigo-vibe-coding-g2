# Spec: Módulo `transport`

> Generado por Agente Spec — pendiente aprobación humana antes de Implement.

---

## Modelo (`apps/transport/models.py`)

- [ ] Crear clase `Transport(TimeStampedModel)` importando desde `apps.core.models`
- [ ] Clase interna `VehicleType(models.TextChoices)` con:
  - `TRUCK = 'truck', 'Truck'`
  - `VAN = 'van', 'Van'`
  - `MOTORCYCLE = 'motorcycle', 'Motorcycle'`
  - `CAR = 'car', 'Car'`
- [ ] Campo `plate_number`: `models.CharField(max_length=20, unique=True)` — placa del vehículo
- [ ] Campo `vehicle_type`: `models.CharField(max_length=20, choices=VehicleType.choices)`
- [ ] Campo `brand`: `models.CharField(max_length=100)`
- [ ] Campo `model`: `models.CharField(max_length=100)`
- [ ] Campo `year`: `models.PositiveIntegerField()`
- [ ] Campo `capacity_kg`: `models.DecimalField(max_digits=8, decimal_places=2)` — peso máximo de carga
- [ ] Campo `capacity_units`: `models.PositiveIntegerField()` — unidades máximas de carga
- [ ] Campo `driver`: `models.ForeignKey('drivers.Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='vehicles')` — conductor actualmente asignado
- [ ] Campo `is_active`: `models.BooleanField(default=True)`
- [ ] Clase `Meta`:
  - `ordering = ['-created_at']`
  - `verbose_name = 'Transport'`
  - `verbose_name_plural = 'Transports'`
- [ ] Método `__str__` retorna `f"{self.plate_number} — {self.get_vehicle_type_display()}"`

---

## Serializers (`apps/transport/serializers.py`)

Transport tiene FK nullable a Driver — requiere serializers de lectura y escritura separados.

### Serializer de lectura (`TransportReadSerializer`)
- [ ] Crear clase `DriverSummarySerializer(serializers.ModelSerializer)` con:
  - Campo `name = serializers.SerializerMethodField()` que retorna `obj.user.get_full_name() or obj.user.username`
  - `fields = ['id', 'license_number', 'name', 'is_available']`
- [ ] Crear `TransportReadSerializer(serializers.ModelSerializer)`:
  - Campo `driver`: `DriverSummarySerializer(read_only=True)` — puede ser `null`
  - `fields = ['id', 'plate_number', 'vehicle_type', 'brand', 'model', 'year', 'capacity_kg', 'capacity_units', 'driver', 'is_active', 'created_at', 'updated_at']`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`

### Serializer de escritura (`TransportWriteSerializer`)
- [ ] Crear `TransportWriteSerializer(serializers.ModelSerializer)`:
  - Campo `driver`: `serializers.PrimaryKeyRelatedField(queryset=Driver.objects.all(), allow_null=True, required=False)`
  - `fields = ['id', 'plate_number', 'vehicle_type', 'brand', 'model', 'year', 'capacity_kg', 'capacity_units', 'driver', 'is_active']`
  - `read_only_fields = ['id']`

---

## Permisos (`apps/transport/permissions.py`)

Según `docs/architecture.md`: solo `admin` tiene CRUD en transport.

- [ ] Crear clase `IsAdminGroup(BasePermission)`:
  - Retorna `True` si autenticado Y (`is_superuser` O en grupo `admin`)

---

## ViewSet (`apps/transport/views.py`)

- [ ] Crear `TransportViewSet(ModelViewSet)`:
  - `queryset = Transport.objects.select_related('driver', 'driver__user').all()`
  - `permission_classes = [IsAuthenticated, IsAdminGroup]`
  - `filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]`
  - `filterset_fields = ['vehicle_type', 'is_active', 'driver']`
  - `search_fields = ['plate_number', 'brand', 'model']`
  - `ordering_fields = ['plate_number', 'year', 'capacity_kg', 'created_at']`
  - `ordering = ['-created_at']`
- [ ] Implementar `get_serializer_class()`:
  - Acciones `list` y `retrieve` → `TransportReadSerializer`
  - Resto → `TransportWriteSerializer`

---

## URLs (`apps/transport/urls.py`)

- [ ] Importar `DefaultRouter` y `TransportViewSet`
- [ ] Definir `app_name = 'transport'`
- [ ] Registrar: `router.register(r'', TransportViewSet, basename='transport')`
- [ ] Exponer `urlpatterns = router.urls`

La ruta ya está montada en `config/urls.py` como `path('api/v1/transport/', include('apps.transport.urls'))`.

---

## Admin (`apps/transport/admin.py`)

- [ ] Registrar `Transport` con clase `TransportAdmin(admin.ModelAdmin)`:
  - `list_display = ['plate_number', 'vehicle_type', 'brand', 'model', 'year', 'driver', 'is_active', 'created_at']`
  - `list_filter = ['vehicle_type', 'is_active']`
  - `search_fields = ['plate_number', 'brand', 'model']`
  - `readonly_fields = ['created_at', 'updated_at']`
  - `autocomplete_fields = ['driver']`

---

## Tests

### `apps/transport/tests/test_models.py`

- [ ] `setUp`: crear User y Driver de apoyo
- [ ] `test_create_transport_with_driver`: crear Transport con driver asignado, verificar persistencia
- [ ] `test_create_transport_without_driver`: crear Transport con `driver=None`, debe ser válido
- [ ] `test_str`: verificar `str(transport)` retorna `"ABC-123 — Truck"`
- [ ] `test_plate_number_unique`: dos transports con misma `plate_number` → `IntegrityError`
- [ ] `test_vehicle_type_choices`: crear con cada choice válido sin errores
- [ ] `test_driver_set_null_on_delete`: eliminar Driver → `transport.driver` queda `None`, transport persiste
- [ ] `test_is_active_default_true`: verificar `is_active` default
- [ ] `test_timestamps_auto_generated`: `created_at` y `updated_at` no son `None`

### `apps/transport/tests/test_api.py`

- [ ] `setUp`:
  - Crear superusuario, obtener JWT, configurar `Authorization: Bearer`
  - Crear User, Driver, y Transport de prueba base
- [ ] `test_list_transports`: GET `/api/v1/transport/` → 200, `count` y `results`
- [ ] `test_list_returns_nested_driver`: verificar que `driver` en respuesta incluye `license_number` y `name`
- [ ] `test_list_without_driver_returns_null`: crear transport sin driver, verificar que `driver` es `null` en respuesta
- [ ] `test_create_transport_with_driver`: POST con `driver` como ID → 201
- [ ] `test_create_transport_without_driver`: POST sin campo `driver` → 201
- [ ] `test_retrieve_transport`: GET `/api/v1/transport/{id}/` → 200, driver anidado
- [ ] `test_update_transport`: PUT con payload completo → 200
- [ ] `test_partial_update_unassign_driver`: PATCH `{"driver": null}` → 200, driver queda null
- [ ] `test_delete_transport`: DELETE → 204
- [ ] `test_unauthenticated_returns_401`: GET sin token → 401
- [ ] `test_create_duplicate_plate`: POST con `plate_number` ya existente → 400
- [ ] `test_filter_by_vehicle_type`: GET `?vehicle_type=truck` → solo camiones
- [ ] `test_filter_by_is_active`: GET `?is_active=true` → solo activos
