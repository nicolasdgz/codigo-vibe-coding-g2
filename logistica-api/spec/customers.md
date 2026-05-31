# Spec: Módulo `customers`

> Generado por Agente Spec — pendiente aprobación humana antes de Implement.

---

## Modelo (`apps/customers/models.py`)

- [ ] Crear clase `Customer(TimeStampedModel)` importando desde `apps.core.models`
- [ ] Clase interna `CustomerType(models.TextChoices)` con:
  - `COMPANY = 'company', 'Company'`
  - `PERSON = 'person', 'Person'`
- [ ] Campo `name`: `models.CharField(max_length=255)`
- [ ] Campo `customer_type`: `models.CharField(max_length=10, choices=CustomerType.choices)`
- [ ] Campo `email`: `models.EmailField(max_length=254, unique=True)`
- [ ] Campo `phone`: `models.CharField(max_length=20)`
- [ ] Campo `address`: `models.TextField()`
- [ ] Campo `tax_id`: `models.CharField(max_length=50, unique=True, null=True, blank=True)` — NIT/RUT opcional
- [ ] Campo `is_active`: `models.BooleanField(default=True)`
- [ ] Clase `Meta`:
  - `ordering = ['-created_at']`
  - `verbose_name = 'Customer'`
  - `verbose_name_plural = 'Customers'`
- [ ] Método `__str__` retorna `f"{self.name} ({self.get_customer_type_display()})"`

---

## Serializers (`apps/customers/serializers.py`)

Customer no tiene ForeignKeys propios — un serializer único es suficiente.

- [ ] Crear `CustomerSerializer(serializers.ModelSerializer)`:
  - `fields = ['id', 'name', 'customer_type', 'email', 'phone', 'address', 'tax_id', 'is_active', 'created_at', 'updated_at']`
  - `read_only_fields = ['id', 'created_at', 'updated_at']`

---

## Permisos (`apps/customers/permissions.py`)

Según `docs/architecture.md`: solo `admin` tiene CRUD en customers. `warehouse_staff` no está listado para este módulo.

- [ ] Crear clase `IsAdminGroup(BasePermission)`:
  - Retorna `True` si `request.user.is_authenticated` Y (`is_superuser` O en grupo `admin`)
  - `request.user.is_superuser or request.user.groups.filter(name='admin').exists()`

---

## ViewSet (`apps/customers/views.py`)

- [ ] Crear `CustomerViewSet(ModelViewSet)`:
  - `queryset = Customer.objects.all()`
  - `serializer_class = CustomerSerializer`
  - `permission_classes = [IsAuthenticated, IsAdminGroup]`
  - `filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]`
  - `filterset_fields = ['customer_type', 'is_active']`
  - `search_fields = ['name', 'email', 'tax_id']`
  - `ordering_fields = ['name', 'customer_type', 'created_at']`
  - `ordering = ['-created_at']`

---

## URLs (`apps/customers/urls.py`)

- [ ] Importar `DefaultRouter` y `CustomerViewSet`
- [ ] Definir `app_name = 'customers'`
- [ ] Registrar: `router.register(r'', CustomerViewSet, basename='customer')`
- [ ] Exponer `urlpatterns = router.urls`

La ruta ya está montada en `config/urls.py` como `path('api/v1/customers/', include('apps.customers.urls'))`.

---

## Admin (`apps/customers/admin.py`)

- [ ] Registrar `Customer` con clase `CustomerAdmin(admin.ModelAdmin)`:
  - `list_display = ['name', 'customer_type', 'email', 'tax_id', 'is_active', 'created_at']`
  - `list_filter = ['customer_type', 'is_active']`
  - `search_fields = ['name', 'email', 'tax_id']`
  - `readonly_fields = ['created_at', 'updated_at']`

---

## Tests

### `apps/customers/tests/test_models.py`

- [ ] `test_create_customer_company`: crear Customer con `customer_type='company'`, verificar que persiste
- [ ] `test_create_customer_person`: crear Customer con `customer_type='person'`, verificar que persiste
- [ ] `test_str`: verificar que `str(customer)` retorna `"Nombre (Company)"` o `"Nombre (Person)"`
- [ ] `test_email_unique`: dos customers con mismo `email` → `IntegrityError`
- [ ] `test_tax_id_nullable`: crear Customer sin `tax_id` → válido
- [ ] `test_tax_id_unique_when_set`: dos customers con mismo `tax_id` no nulo → `IntegrityError`
- [ ] `test_is_active_default_true`: verificar que `is_active` es `True` por defecto
- [ ] `test_timestamps_auto_generated`: verificar `created_at` y `updated_at` no son `None`

### `apps/customers/tests/test_api.py`

- [ ] `setUp`:
  - Crear superusuario, obtener JWT, configurar `Authorization: Bearer`
  - Crear un customer de prueba base (`customer_type='company'`)
- [ ] `test_list_customers`: GET `/api/v1/customers/` → 200, claves `count` y `results`
- [ ] `test_create_customer`: POST con payload válido → 201, `id` en respuesta
- [ ] `test_retrieve_customer`: GET `/api/v1/customers/{id}/` → 200, campos correctos
- [ ] `test_update_customer`: PUT con payload completo → 200, cambios persistidos
- [ ] `test_partial_update_customer`: PATCH `{"phone": "+57 999 999 9999"}` → 200
- [ ] `test_delete_customer`: DELETE → 204, objeto eliminado de BD
- [ ] `test_unauthenticated_returns_401`: GET sin token → 401
- [ ] `test_create_duplicate_email`: POST con `email` ya existente → 400
- [ ] `test_filter_by_customer_type`: GET `?customer_type=company` → solo empresas
- [ ] `test_filter_by_is_active`: GET `?is_active=true` → solo customers activos
- [ ] `test_search_by_name`: GET `?search=Empresa` → resultados que contienen "Empresa"
