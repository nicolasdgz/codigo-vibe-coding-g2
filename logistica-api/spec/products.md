# Spec: Módulo `products`

> Generado por Agente Spec — pendiente aprobación humana antes de Implement.

---

## Modelo (`apps/products/models.py`)

- [ ] Crear clase `Product(TimeStampedModel)` importando desde `apps.core.models`
- [ ] Campo `name`: `models.CharField(max_length=255)`
- [ ] Campo `description`: `models.TextField(null=True, blank=True)`
- [ ] Campo `sku`: `models.CharField(max_length=100, unique=True)`
- [ ] Campo `weight_kg`: `models.DecimalField(max_digits=8, decimal_places=2)`
- [ ] Campo `dimensions`: `models.CharField(max_length=50, null=True, blank=True)` — formato `LxWxH cm`
- [ ] Campo `unit_price`: `models.DecimalField(max_digits=10, decimal_places=2)`
- [ ] Campo `stock`: `models.PositiveIntegerField(default=0)`
- [ ] Campo `supplier`: `models.ForeignKey('suppliers.Supplier', on_delete=models.PROTECT, related_name='products')`
- [ ] Campo `warehouse`: `models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='products')`
- [ ] Campo `is_active`: `models.BooleanField(default=True)`
- [ ] Clase `Meta`:
  - `ordering = ['-created_at']`
  - `verbose_name = 'Product'`
  - `verbose_name_plural = 'Products'`
- [ ] Método `__str__` retorna `f"{self.name} ({self.sku})"`

---

## Serializers (`apps/products/serializers.py`)

Product tiene FKs a Supplier y Warehouse — requiere serializers de lectura y escritura separados.

### Serializer de lectura (`ProductReadSerializer`)
- [ ] Crear clase anidada `SupplierSummarySerializer` con campos: `id`, `name`
- [ ] Crear clase anidada `WarehouseSummarySerializer` con campos: `id`, `name`, `city`
- [ ] Crear `ProductReadSerializer(serializers.ModelSerializer)`:
  - Campo `supplier`: `SupplierSummarySerializer(read_only=True)`
  - Campo `warehouse`: `WarehouseSummarySerializer(read_only=True)`
  - `fields = ['id', 'name', 'description', 'sku', 'weight_kg', 'dimensions', 'unit_price', 'stock', 'supplier', 'warehouse', 'is_active', 'created_at', 'updated_at']`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`

### Serializer de escritura (`ProductWriteSerializer`)
- [ ] Crear `ProductWriteSerializer(serializers.ModelSerializer)`:
  - `supplier` y `warehouse` como `PrimaryKeyRelatedField` (aceptan IDs)
  - `fields = ['id', 'name', 'description', 'sku', 'weight_kg', 'dimensions', 'unit_price', 'stock', 'supplier', 'warehouse', 'is_active']`
  - `read_only_fields = ['id']`

---

## Permisos (`apps/products/permissions.py`)

Según `docs/architecture.md`: `admin` y `warehouse_staff` tienen CRUD en products.

- [ ] Crear clase `IsAdminOrWarehouseStaff(BasePermission)`:
  - Retorna `True` si autenticado Y (`is_superuser` O en grupo `admin` o `warehouse_staff`)
  - `request.user.groups.filter(name__in=['admin', 'warehouse_staff']).exists()`

---

## ViewSet (`apps/products/views.py`)

- [ ] Crear `ProductViewSet(ModelViewSet)`:
  - `queryset = Product.objects.select_related('supplier', 'warehouse').all()`
  - `permission_classes = [IsAuthenticated, IsAdminOrWarehouseStaff]`
  - `filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]`
  - `filterset_fields = ['supplier', 'warehouse', 'is_active']`
  - `search_fields = ['name', 'sku', 'description']`
  - `ordering_fields = ['name', 'sku', 'unit_price', 'stock', 'created_at']`
  - `ordering = ['-created_at']`
- [ ] Implementar `get_serializer_class()`:
  - Acciones `list` y `retrieve` → `ProductReadSerializer`
  - Resto → `ProductWriteSerializer`

---

## URLs (`apps/products/urls.py`)

- [ ] Importar `DefaultRouter` y `ProductViewSet`
- [ ] Definir `app_name = 'products'`
- [ ] Registrar: `router.register(r'', ProductViewSet, basename='product')`
- [ ] Exponer `urlpatterns = router.urls`

La ruta ya está montada en `config/urls.py` como `path('api/v1/products/', include('apps.products.urls'))`.

---

## Admin (`apps/products/admin.py`)

- [ ] Registrar `Product` con clase `ProductAdmin(admin.ModelAdmin)`:
  - `list_display = ['name', 'sku', 'supplier', 'warehouse', 'unit_price', 'stock', 'is_active', 'created_at']`
  - `list_filter = ['is_active', 'supplier', 'warehouse']`
  - `search_fields = ['name', 'sku', 'description']`
  - `readonly_fields = ['created_at', 'updated_at']`
  - `autocomplete_fields = ['supplier', 'warehouse']`

  Nota: para que `autocomplete_fields` funcione, `SupplierAdmin` y `WarehouseAdmin` deben tener `search_fields` definido (ya está en sus respectivos admins).

---

## Tests

### `apps/products/tests/test_models.py`

- [ ] `setUp`: crear Supplier y Warehouse de apoyo para los tests
- [ ] `test_create_product`: crear Product con todos los campos, verificar persistencia
- [ ] `test_str`: verificar `str(product)` retorna `"Nombre (SKU)"`
- [ ] `test_sku_unique`: dos products con mismo `sku` → `IntegrityError`
- [ ] `test_description_nullable`: crear Product sin `description` → válido
- [ ] `test_dimensions_nullable`: crear Product sin `dimensions` → válido
- [ ] `test_stock_default_zero`: crear Product sin `stock` → `stock == 0`
- [ ] `test_is_active_default_true`: crear Product sin `is_active` → `True`
- [ ] `test_timestamps_auto_generated`: `created_at` y `updated_at` no son `None`
- [ ] `test_supplier_protect_on_delete`: intentar eliminar Supplier con products → `ProtectedError`
- [ ] `test_warehouse_protect_on_delete`: intentar eliminar Warehouse con products → `ProtectedError`

### `apps/products/tests/test_api.py`

- [ ] `setUp`:
  - Crear superusuario, obtener JWT, configurar `Authorization: Bearer`
  - Crear Supplier y Warehouse de apoyo
  - Crear un Product de prueba base
- [ ] `test_list_products`: GET `/api/v1/products/` → 200, `count` y `results`
- [ ] `test_list_returns_nested_supplier_and_warehouse`: verificar que la respuesta incluye `supplier.name` y `warehouse.name` (no solo IDs)
- [ ] `test_create_product`: POST con `supplier` y `warehouse` como IDs → 201
- [ ] `test_retrieve_product`: GET `/api/v1/products/{id}/` → 200, campos anidados presentes
- [ ] `test_update_product`: PUT con payload completo → 200
- [ ] `test_partial_update_product`: PATCH `{"stock": 50}` → 200
- [ ] `test_delete_product`: DELETE → 204
- [ ] `test_unauthenticated_returns_401`: GET sin token → 401
- [ ] `test_create_duplicate_sku`: POST con `sku` ya existente → 400
- [ ] `test_filter_by_supplier`: GET `?supplier={id}` → solo products de ese supplier
- [ ] `test_filter_by_warehouse`: GET `?warehouse={id}` → solo products de ese warehouse
- [ ] `test_filter_by_is_active`: GET `?is_active=true` → solo products activos
- [ ] `test_search_by_sku`: GET `?search=SKU-001` → producto correcto
