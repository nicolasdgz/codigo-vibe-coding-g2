# Spec: Módulo `drivers`

> Generado por Agente Spec — pendiente aprobación humana antes de Implement.

---

## Modelo (`apps/drivers/models.py`)

- [ ] Importar `from django.conf import settings` para referenciar `AUTH_USER_MODEL`
- [ ] Crear clase `Driver(TimeStampedModel)` importando desde `apps.core.models`
- [ ] Campo `user`: `models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='driver_profile')`
- [ ] Campo `license_number`: `models.CharField(max_length=50, unique=True)`
- [ ] Campo `license_expiry`: `models.DateField()` — fecha de vencimiento de licencia
- [ ] Campo `phone`: `models.CharField(max_length=20)`
- [ ] Campo `is_available`: `models.BooleanField(default=True)` — disponibilidad para asignación
- [ ] Clase `Meta`:
  - `ordering = ['-created_at']`
  - `verbose_name = 'Driver'`
  - `verbose_name_plural = 'Drivers'`
- [ ] Método `__str__` retorna `f"{self.user.get_full_name() or self.user.username} — {self.license_number}"`

---

## Serializers (`apps/drivers/serializers.py`)

Driver tiene OneToOne con User — requiere serializers de lectura y escritura separados.

### Serializer de lectura (`DriverReadSerializer`)
- [ ] Crear clase anidada `UserSummarySerializer` con campos: `id`, `username`, `email`, `first_name`, `last_name`
- [ ] Crear `DriverReadSerializer(serializers.ModelSerializer)`:
  - Campo `user`: `UserSummarySerializer(read_only=True)`
  - `fields = ['id', 'user', 'license_number', 'license_expiry', 'phone', 'is_available', 'created_at', 'updated_at']`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`

### Serializer de escritura (`DriverWriteSerializer`)
- [ ] Crear `DriverWriteSerializer(serializers.ModelSerializer)`:
  - Campo `user`: `serializers.PrimaryKeyRelatedField(queryset=User.objects.all())`
  - `fields = ['id', 'user', 'license_number', 'license_expiry', 'phone', 'is_available']`
  - `read_only_fields = ['id']`

---

## Permisos (`apps/drivers/permissions.py`)

Según `docs/architecture.md`: solo `admin` tiene CRUD en drivers.

- [ ] Crear clase `IsAdminGroup(BasePermission)`:
  - Retorna `True` si autenticado Y (`is_superuser` O en grupo `admin`)

---

## ViewSet (`apps/drivers/views.py`)

- [ ] Crear `DriverViewSet(ModelViewSet)`:
  - `queryset = Driver.objects.select_related('user').all()`
  - `permission_classes = [IsAuthenticated, IsAdminGroup]`
  - `filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]`
  - `filterset_fields = ['is_available']`
  - `search_fields = ['license_number', 'user__username', 'user__first_name', 'user__last_name']`
  - `ordering_fields = ['license_expiry', 'created_at']`
  - `ordering = ['-created_at']`
- [ ] Implementar `get_serializer_class()`:
  - Acciones `list` y `retrieve` → `DriverReadSerializer`
  - Resto → `DriverWriteSerializer`

---

## URLs (`apps/drivers/urls.py`)

- [ ] Importar `DefaultRouter` y `DriverViewSet`
- [ ] Definir `app_name = 'drivers'`
- [ ] Registrar: `router.register(r'', DriverViewSet, basename='driver')`
- [ ] Exponer `urlpatterns = router.urls`

La ruta ya está montada en `config/urls.py` como `path('api/v1/drivers/', include('apps.drivers.urls'))`.

---

## Admin (`apps/drivers/admin.py`)

- [ ] Registrar `Driver` con clase `DriverAdmin(admin.ModelAdmin)`:
  - `list_display = ['__str__', 'license_number', 'license_expiry', 'phone', 'is_available', 'created_at']`
  - `list_filter = ['is_available']`
  - `search_fields = ['license_number', 'user__username', 'user__first_name', 'user__last_name']`
  - `readonly_fields = ['created_at', 'updated_at']`
  - `autocomplete_fields = ['user']`

  Nota: para que `autocomplete_fields = ['user']` funcione en admin, registrar `UserAdmin` ya viene por defecto con Django. No se requiere acción adicional.

---

## Tests

### `apps/drivers/tests/test_models.py`

- [ ] `setUp`: crear dos Users de apoyo para los tests
- [ ] `test_create_driver`: crear Driver vinculado a User, verificar persistencia
- [ ] `test_str`: verificar que `str(driver)` retorna `"nombre — licencia"` o `"username — licencia"`
- [ ] `test_license_number_unique`: dos drivers con mismo `license_number` → `IntegrityError`
- [ ] `test_user_onetoone`: mismo User no puede tener dos Drivers → `IntegrityError`
- [ ] `test_is_available_default_true`: crear Driver sin `is_available` → `True`
- [ ] `test_cascade_on_user_delete`: eliminar User → Driver asociado también se elimina
- [ ] `test_timestamps_auto_generated`: `created_at` y `updated_at` no son `None`

### `apps/drivers/tests/test_api.py`

- [ ] `setUp`:
  - Crear superusuario, obtener JWT, configurar `Authorization: Bearer`
  - Crear User adicional para asociar al driver
  - Crear un Driver de prueba base
- [ ] `test_list_drivers`: GET `/api/v1/drivers/` → 200, `count` y `results`
- [ ] `test_list_returns_nested_user`: verificar que respuesta incluye `user.username` (no solo ID)
- [ ] `test_create_driver`: POST con `user` como ID → 201
- [ ] `test_retrieve_driver`: GET `/api/v1/drivers/{id}/` → 200, `user` anidado
- [ ] `test_update_driver`: PUT con payload completo → 200
- [ ] `test_partial_update_driver`: PATCH `{"is_available": false}` → 200
- [ ] `test_delete_driver`: DELETE → 204
- [ ] `test_unauthenticated_returns_401`: GET sin token → 401
- [ ] `test_create_duplicate_license`: POST con `license_number` ya existente → 400
- [ ] `test_filter_by_is_available`: GET `?is_available=true` → solo conductores disponibles
- [ ] `test_search_by_license`: GET `?search=LIC-001` → conductor correcto
