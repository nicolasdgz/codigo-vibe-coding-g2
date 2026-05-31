# Spec: Módulo `warehouses`

> Generado por Agente Spec — pendiente aprobación humana antes de Implement.

---

## Modelo (`apps/warehouses/models.py`)

- [ ] Crear clase `Warehouse(TimeStampedModel)` importando desde `apps.core.models`
- [ ] Campo `name`: `models.CharField(max_length=255)`
- [ ] Campo `address`: `models.TextField()`
- [ ] Campo `city`: `models.CharField(max_length=100)`
- [ ] Campo `country`: `models.CharField(max_length=100)`
- [ ] Campo `latitude`: `models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
- [ ] Campo `longitude`: `models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)`
- [ ] Campo `capacity`: `models.PositiveIntegerField()` — unidades máximas de almacenamiento
- [ ] Campo `is_active`: `models.BooleanField(default=True)`
- [ ] Clase `Meta`:
  - `ordering = ['-created_at']`
  - `verbose_name = 'Warehouse'`
  - `verbose_name_plural = 'Warehouses'`
- [ ] Método `__str__` retorna `f"{self.name} — {self.city}"`

---

## Serializers (`apps/warehouses/serializers.py`)

Warehouse no tiene ForeignKeys propios, por lo que un serializer único es suficiente.

- [ ] Crear `WarehouseSerializer(serializers.ModelSerializer)`:
  - `fields = ['id', 'name', 'address', 'city', 'country', 'latitude', 'longitude', 'capacity', 'is_active', 'created_at', 'updated_at']`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`

---

## Permisos (`apps/warehouses/permissions.py`)

Según `docs/architecture.md`:
- `admin` → CRUD completo
- `warehouse_staff` → CRUD completo en warehouses
- `driver` → sin acceso a warehouses

- [ ] Crear clase `IsAdminOrWarehouseStaff(BasePermission)` en `apps/warehouses/permissions.py`
- [ ] Implementar `has_permission(self, request, view)`:
  - Retorna `True` si `request.user` está autenticado Y pertenece al grupo `admin` o `warehouse_staff`
  - `request.user.groups.filter(name__in=['admin', 'warehouse_staff']).exists()`

---

## ViewSet (`apps/warehouses/views.py`)

- [ ] Crear `WarehouseViewSet(ModelViewSet)`:
  - `queryset = Warehouse.objects.all()`
  - `serializer_class = WarehouseSerializer`
  - `permission_classes = [IsAuthenticated, IsAdminOrWarehouseStaff]`
  - `filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]`
  - `filterset_fields = ['city', 'country', 'is_active']`
  - `search_fields = ['name', 'address', 'city']`
  - `ordering_fields = ['name', 'city', 'capacity', 'created_at']`
  - `ordering = ['-created_at']` (default ordering)

---

## URLs (`apps/warehouses/urls.py`)

- [ ] Importar `DefaultRouter` y `WarehouseViewSet`
- [ ] Definir `app_name = 'warehouses'`
- [ ] Registrar: `router.register(r'', WarehouseViewSet, basename='warehouse')`
- [ ] Exponer `urlpatterns = router.urls`

La ruta ya está montada en `config/urls.py` como `path('api/v1/warehouses/', include('apps.warehouses.urls'))`.

---

## Admin (`apps/warehouses/admin.py`)

- [ ] Registrar `Warehouse` con clase `WarehouseAdmin(admin.ModelAdmin)`:
  - `list_display = ['name', 'city', 'country', 'capacity', 'is_active', 'created_at']`
  - `list_filter = ['is_active', 'city', 'country']`
  - `search_fields = ['name', 'address', 'city']`
  - `readonly_fields = ['created_at', 'updated_at']`

---

## Tests

### `apps/warehouses/tests/test_models.py`

- [ ] `test_create_warehouse`: crear Warehouse con todos los campos obligatorios, verificar que persiste en BD
- [ ] `test_str`: verificar que `str(warehouse)` retorna `"Nombre — Ciudad"`
- [ ] `test_is_active_default_true`: crear Warehouse sin `is_active`, verificar que es `True`
- [ ] `test_lat_lon_nullable`: crear Warehouse sin `latitude`/`longitude`, debe ser válido sin error
- [ ] `test_timestamps_auto_generated`: verificar que `created_at` y `updated_at` no son `None` tras crear

### `apps/warehouses/tests/test_api.py`

- [ ] `setUp`:
  - Crear superusuario con `User.objects.create_superuser(...)`
  - Obtener JWT con `RefreshToken.for_user(user).access_token`
  - Configurar `self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')`
  - Crear un warehouse de prueba base
- [ ] `test_list_warehouses`: GET `/api/v1/warehouses/` → 200, respuesta con claves `count`, `results`
- [ ] `test_create_warehouse`: POST con payload válido → 201, `id` presente en respuesta
- [ ] `test_retrieve_warehouse`: GET `/api/v1/warehouses/{id}/` → 200, campos correctos
- [ ] `test_update_warehouse`: PUT con payload completo → 200, cambios persistidos
- [ ] `test_partial_update_warehouse`: PATCH `{"capacity": 999}` → 200, solo ese campo cambia
- [ ] `test_delete_warehouse`: DELETE `/api/v1/warehouses/{id}/` → 204
- [ ] `test_unauthenticated_returns_401`: GET sin token → 401
- [ ] `test_filter_by_city`: GET `?city=Bogotá` → solo resultados con esa ciudad
- [ ] `test_filter_by_is_active`: GET `?is_active=true` → solo warehouses activos
- [ ] `test_search_by_name`: GET `?search=Central` → resultados donde `name` contiene "Central"
