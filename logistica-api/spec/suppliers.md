# Spec: Módulo `suppliers`

> Generado por Agente Spec — pendiente aprobación humana antes de Implement.

---

## Modelo (`apps/suppliers/models.py`)

- [ ] Crear clase `Supplier(TimeStampedModel)` importando desde `apps.core.models`
- [ ] Campo `name`: `models.CharField(max_length=255)`
- [ ] Campo `email`: `models.EmailField(max_length=254)`
- [ ] Campo `phone`: `models.CharField(max_length=20)`
- [ ] Campo `address`: `models.TextField()`
- [ ] Campo `tax_id`: `models.CharField(max_length=50, unique=True)` — NIT / RUT
- [ ] Campo `contact_name`: `models.CharField(max_length=255)` — persona de contacto
- [ ] Campo `is_active`: `models.BooleanField(default=True)`
- [ ] Clase `Meta`:
  - `ordering = ['-created_at']`
  - `verbose_name = 'Supplier'`
  - `verbose_name_plural = 'Suppliers'`
- [ ] Método `__str__` retorna `f"{self.name} ({self.tax_id})"`

---

## Serializers (`apps/suppliers/serializers.py`)

Supplier no tiene ForeignKeys propios — un serializer único es suficiente.

- [ ] Crear `SupplierSerializer(serializers.ModelSerializer)`:
  - `fields = ['id', 'name', 'email', 'phone', 'address', 'tax_id', 'contact_name', 'is_active', 'created_at', 'updated_at']`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`

---

## Permisos (`apps/suppliers/permissions.py`)

Según `docs/architecture.md`: solo `admin` tiene acceso a suppliers. `warehouse_staff` no está listado para este módulo.

- [ ] Crear clase `IsAdminGroup(BasePermission)` en `apps/suppliers/permissions.py`
- [ ] Implementar `has_permission(self, request, view)`:
  - Retorna `True` si usuario autenticado Y (`is_superuser` O en grupo `admin`)
  - `request.user.is_superuser or request.user.groups.filter(name='admin').exists()`

---

## ViewSet (`apps/suppliers/views.py`)

- [ ] Crear `SupplierViewSet(ModelViewSet)`:
  - `queryset = Supplier.objects.all()`
  - `serializer_class = SupplierSerializer`
  - `permission_classes = [IsAuthenticated, IsAdminGroup]`
  - `filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]`
  - `filterset_fields = ['is_active']`
  - `search_fields = ['name', 'email', 'tax_id', 'contact_name']`
  - `ordering_fields = ['name', 'created_at']`
  - `ordering = ['-created_at']`

---

## URLs (`apps/suppliers/urls.py`)

- [ ] Importar `DefaultRouter` y `SupplierViewSet`
- [ ] Definir `app_name = 'suppliers'`
- [ ] Registrar: `router.register(r'', SupplierViewSet, basename='supplier')`
- [ ] Exponer `urlpatterns = router.urls`

La ruta ya está montada en `config/urls.py` como `path('api/v1/suppliers/', include('apps.suppliers.urls'))`.

---

## Admin (`apps/suppliers/admin.py`)

- [ ] Registrar `Supplier` con clase `SupplierAdmin(admin.ModelAdmin)`:
  - `list_display = ['name', 'email', 'tax_id', 'contact_name', 'is_active', 'created_at']`
  - `list_filter = ['is_active']`
  - `search_fields = ['name', 'email', 'tax_id', 'contact_name']`
  - `readonly_fields = ['created_at', 'updated_at']`

---

## Tests

### `apps/suppliers/tests/test_models.py`

- [ ] `test_create_supplier`: crear Supplier con todos los campos obligatorios, verificar que persiste
- [ ] `test_str`: verificar que `str(supplier)` retorna `"Nombre (tax_id)"`
- [ ] `test_tax_id_unique`: crear dos suppliers con mismo `tax_id` → debe lanzar `IntegrityError`
- [ ] `test_is_active_default_true`: crear Supplier sin `is_active`, verificar que es `True`
- [ ] `test_timestamps_auto_generated`: verificar que `created_at` y `updated_at` no son `None`

### `apps/suppliers/tests/test_api.py`

- [ ] `setUp`:
  - Crear superusuario, obtener JWT, configurar `Authorization: Bearer`
  - Crear un supplier de prueba base
- [ ] `test_list_suppliers`: GET `/api/v1/suppliers/` → 200, claves `count` y `results`
- [ ] `test_create_supplier`: POST con payload válido → 201, `id` en respuesta
- [ ] `test_retrieve_supplier`: GET `/api/v1/suppliers/{id}/` → 200, campos correctos
- [ ] `test_update_supplier`: PUT con payload completo → 200, cambios persistidos
- [ ] `test_partial_update_supplier`: PATCH `{"contact_name": "Nuevo Contacto"}` → 200
- [ ] `test_delete_supplier`: DELETE → 204, objeto eliminado de BD
- [ ] `test_unauthenticated_returns_401`: GET sin token → 401
- [ ] `test_create_duplicate_tax_id`: POST con `tax_id` ya existente → 400
- [ ] `test_filter_by_is_active`: GET `?is_active=true` → solo suppliers activos
- [ ] `test_search_by_name`: GET `?search=Tech` → resultados que contienen "Tech"
