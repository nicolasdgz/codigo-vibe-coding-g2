# Spec: shipments

## Modelos

### `Shipment` (hereda `TimeStampedModel`)

| Campo | Tipo Django | Notas |
|---|---|---|
| `tracking_number` | `CharField(max_length=50, unique=True, blank=True)` | auto-generado en `save()` si vacío |
| `customer` | `ForeignKey('customers.Customer', on_delete=PROTECT)` | |
| `origin_warehouse` | `ForeignKey('warehouses.Warehouse', on_delete=PROTECT)` | |
| `destination_address` | `TextField()` | |
| `destination_city` | `CharField(max_length=100)` | |
| `destination_country` | `CharField(max_length=100)` | |
| `status` | `CharField(max_length=20, choices=ShipmentStatus.choices, default=ShipmentStatus.PENDING)` | |
| `route` | `ForeignKey('routes.Route', on_delete=SET_NULL, null=True, blank=True)` | asignado al despacho |
| `estimated_delivery` | `DateField(null=True, blank=True)` | |
| `actual_delivery` | `DateTimeField(null=True, blank=True)` | |
| `total_weight_kg` | `DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))` | recalculado al agregar/quitar items |
| `calculated_cost` | `DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))` | ingresado manualmente |
| `notes` | `TextField(null=True, blank=True)` | |
| `created_by` | `ForeignKey(settings.AUTH_USER_MODEL, on_delete=PROTECT, related_name='shipments_created')` | asignado desde `request.user` en ViewSet |

**Choices internos:**
```python
class ShipmentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    IN_TRANSIT = 'in_transit', 'In Transit'
    DELIVERED = 'delivered', 'Delivered'
    CANCELLED = 'cancelled', 'Cancelled'
    RETURNED = 'returned', 'Returned'
```

**`save()` override** — generar `tracking_number` si no existe:
```python
def save(self, *args, **kwargs):
    if not self.tracking_number:
        self.tracking_number = self._generate_tracking_number()
    super().save(*args, **kwargs)

def _generate_tracking_number(self):
    import uuid
    return f"TRK-{uuid.uuid4().hex[:10].upper()}"
```

**`recalculate_weight()` method:**
```python
def recalculate_weight(self):
    from decimal import Decimal
    total = sum(
        item.product.weight_kg * item.quantity
        for item in self.items.select_related('product').all()
    )
    self.total_weight_kg = total or Decimal('0.00')
    self.save(update_fields=['total_weight_kg'])
```

**`__str__`:** `f"{self.tracking_number} — {self.get_status_display()}"`

---

### `ShipmentItem` (NO hereda `TimeStampedModel` — sin timestamps según schema)

| Campo | Tipo Django | Notas |
|---|---|---|
| `shipment` | `ForeignKey(Shipment, on_delete=CASCADE, related_name='items')` | |
| `product` | `ForeignKey('products.Product', on_delete=PROTECT)` | |
| `quantity` | `PositiveIntegerField()` | |
| `unit_price` | `DecimalField(max_digits=10, decimal_places=2)` | snapshot del precio al momento del envío |
| `subtotal` | `DecimalField(max_digits=10, decimal_places=2, editable=False)` | calculado en `save()` |

**`save()` override:**
```python
def save(self, *args, **kwargs):
    self.subtotal = self.unit_price * self.quantity
    super().save(*args, **kwargs)
```

**`__str__`:** `f"{self.product.name} x{self.quantity} (Envío {self.shipment.tracking_number})"`

---

## Serializers

### Serializers de lectura anidados (inline)

```python
class CustomerSummarySerializer(serializers.ModelSerializer):
    fields = ['id', 'name', 'email', 'customer_type']

class WarehouseSummarySerializer(serializers.ModelSerializer):
    fields = ['id', 'name', 'city']

class RouteSummarySerializer(serializers.ModelSerializer):
    fields = ['id', 'name', 'status']

class UserSummarySerializer(serializers.ModelSerializer):
    fields = ['id', 'username', 'email']
```

### `ShipmentItemReadSerializer`

```python
class ProductSummarySerializer(serializers.ModelSerializer):
    fields = ['id', 'name', 'sku', 'weight_kg']

class ShipmentItemReadSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(read_only=True)
    fields = ['id', 'product', 'quantity', 'unit_price', 'subtotal']
    read_only_fields = ['id', 'subtotal']
```

### `ShipmentItemWriteSerializer`

```python
class ShipmentItemWriteSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))
    # unit_price: si no se provee, tomar product.unit_price en validate()
    fields = ['product', 'quantity', 'unit_price']
```

**`validate()` — copiar precio del producto si no se provee:**
```python
def validate(self, data):
    if 'unit_price' not in data or data.get('unit_price') is None:
        data['unit_price'] = data['product'].unit_price
    return data
```

### `ShipmentReadSerializer`

```python
class ShipmentReadSerializer(serializers.ModelSerializer):
    customer = CustomerSummarySerializer(read_only=True)
    origin_warehouse = WarehouseSummarySerializer(read_only=True)
    route = RouteSummarySerializer(read_only=True)
    created_by = UserSummarySerializer(read_only=True)
    items = ShipmentItemReadSerializer(many=True, read_only=True)
    fields = [
        'id', 'tracking_number', 'customer', 'origin_warehouse',
        'destination_address', 'destination_city', 'destination_country',
        'status', 'route', 'estimated_delivery', 'actual_delivery',
        'total_weight_kg', 'calculated_cost', 'notes', 'created_by',
        'items', 'created_at', 'updated_at',
    ]
    read_only_fields = ['id', 'tracking_number', 'total_weight_kg', 'created_at', 'updated_at']
```

### `ShipmentWriteSerializer`

```python
class ShipmentWriteSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.filter(is_active=True))
    origin_warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.filter(is_active=True))
    route = serializers.PrimaryKeyRelatedField(queryset=Route.objects.all(), allow_null=True, required=False)
    # created_by: excluir — se asigna en perform_create()
    fields = [
        'id', 'customer', 'origin_warehouse',
        'destination_address', 'destination_city', 'destination_country',
        'status', 'route', 'estimated_delivery', 'actual_delivery',
        'calculated_cost', 'notes',
    ]
    read_only_fields = ['id']
```

---

## ViewSet

### `ShipmentViewSet(ModelViewSet)`

```python
queryset = Shipment.objects.select_related(
    'customer', 'origin_warehouse', 'route', 'created_by',
).prefetch_related('items', 'items__product').all()
permission_classes = [IsAuthenticated, IsAdminGroup]
filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
filterset_fields = ['status', 'customer', 'origin_warehouse', 'route']
search_fields = ['tracking_number', 'destination_city', 'destination_country']
ordering_fields = ['created_at', 'scheduled_date', 'total_weight_kg', 'calculated_cost']
ordering = ['-created_at']
```

**`get_serializer_class()`:**
- list / retrieve → `ShipmentReadSerializer`
- create / update / partial_update → `ShipmentWriteSerializer`

**`perform_create()`:**
```python
def perform_create(self, serializer):
    serializer.save(created_by=self.request.user)
```

**`@action items`** — gestionar items del envío:
```python
@action(detail=True, methods=['get', 'post'], url_path='items')
def items(self, request, pk=None):
    shipment = self.get_object()
    if request.method == 'GET':
        serializer = ShipmentItemReadSerializer(shipment.items.select_related('product').all(), many=True)
        return Response(serializer.data)
    serializer = ShipmentItemWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    item = serializer.save(shipment=shipment)
    shipment.recalculate_weight()
    return Response(ShipmentItemReadSerializer(item).data, status=status.HTTP_201_CREATED)
```

**`@action item_detail`** — actualizar/eliminar item individual:
```python
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
```

---

## URLs

`apps/shipments/urls.py`:
```python
from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet

app_name = 'shipments'
router = DefaultRouter()
router.register(r'', ShipmentViewSet, basename='shipment')
urlpatterns = router.urls
```

Montado en `config/urls.py` como:
```python
path('api/v1/shipments/', include('apps.shipments.urls')),
```

---

## Admin

```python
class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 0
    fields = ['product', 'quantity', 'unit_price', 'subtotal']
    readonly_fields = ['subtotal']

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['tracking_number', 'customer', 'status', 'destination_city', 'total_weight_kg', 'calculated_cost', 'created_at']
    list_filter = ['status']
    search_fields = ['tracking_number', 'destination_city', 'destination_country']
    readonly_fields = ['tracking_number', 'total_weight_kg', 'created_at', 'updated_at']
    autocomplete_fields = ['customer', 'origin_warehouse', 'route']
    inlines = [ShipmentItemInline]
```

---

## Permisos

`apps/shipments/permissions.py`:
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

### `test_models.py` (10 tests)

- [ ] `test_create_shipment` — crear Shipment con todos los campos requeridos, verificar count=1
- [ ] `test_tracking_number_auto_generated` — `tracking_number` empieza con `"TRK-"` y no vacío
- [ ] `test_tracking_number_unique` — `IntegrityError` al duplicar tracking_number manualmente
- [ ] `test_shipment_str` — `f"{tracking_number} — Pending"`
- [ ] `test_default_status_pending` — status default = `'pending'`
- [ ] `test_shipment_item_subtotal_computed` — `subtotal = quantity * unit_price` al guardar
- [ ] `test_shipment_item_str` — verificar `__str__` de ShipmentItem
- [ ] `test_items_cascade_on_shipment_delete` — al borrar Shipment, items se eliminan
- [ ] `test_recalculate_weight` — agregar 2 items, llamar `recalculate_weight()`, verificar `total_weight_kg`
- [ ] `test_shipment_protect_on_customer_delete` — `ProtectedError` al borrar customer con envíos

### `test_api.py` (17 tests)

**Setup:** crear admin, warehouse, customer, product (con supplier+warehouse), route — autenticar con JWT

- [ ] `test_list_shipments` — GET 200, paginado `count`+`results`
- [ ] `test_list_returns_nested_objects` — resultado contiene `customer.name`, `origin_warehouse.name`, `items`
- [ ] `test_create_shipment` — POST 201, `tracking_number` generado automáticamente
- [ ] `test_create_sets_created_by` — `created_by.id` == admin.id en respuesta
- [ ] `test_retrieve_shipment` — GET 200, incluye `items` (lista)
- [ ] `test_update_shipment` — PUT 200, cambiar `destination_city`
- [ ] `test_partial_update_status` — PATCH 200, cambiar `status` a `in_transit`
- [ ] `test_assign_route` — PATCH 200, asignar `route`
- [ ] `test_delete_shipment` — DELETE 204, `Shipment.objects.count() == 0`
- [ ] `test_unauthenticated_returns_401` — GET sin token → 401
- [ ] `test_filter_by_status` — `?status=pending` filtra correctamente
- [ ] `test_search_by_tracking` — `?search=TRK` retorna resultados
- [ ] `test_add_item` — POST `/api/v1/shipments/{id}/items/` → 201, `subtotal` calculado
- [ ] `test_add_item_uses_product_price_by_default` — POST sin `unit_price` → usa `product.unit_price`
- [ ] `test_list_items` — GET `/api/v1/shipments/{id}/items/` → 200, lista de items
- [ ] `test_delete_item_updates_weight` — DELETE item → 204 + `total_weight_kg` se actualiza
- [ ] `test_patch_item` — PATCH `/api/v1/shipments/{id}/items/{item_id}/` → 200, subtotal recalculado
