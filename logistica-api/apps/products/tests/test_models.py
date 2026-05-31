from django.test import TestCase
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse
from apps.products.models import Product


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_supplier(**kwargs):
    """Crea un Supplier con datos mínimos válidos."""
    defaults = {
        'name': 'Tech Supplies S.A.',
        'email': 'contacto@techsupplies.com',
        'phone': '+57 310 000 0000',
        'address': 'Carrera 15 # 80-20',
        'tax_id': 'TS-900123456-1',
        'contact_name': 'Ana Gómez',
    }
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


def _make_warehouse(**kwargs):
    """Crea un Warehouse con datos mínimos válidos."""
    defaults = {
        'name': 'Bodega Central',
        'address': 'Calle 100 # 15-20',
        'city': 'Bogotá',
        'country': 'Colombia',
        'capacity': 500,
    }
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


def _make_product(supplier, warehouse, **kwargs):
    """Crea un Product con datos mínimos válidos."""
    defaults = {
        'name': 'Laptop Pro X1',
        'sku': 'LAP-PRO-X1',
        'weight_kg': '1.50',
        'unit_price': '2500000.00',
        'supplier': supplier,
        'warehouse': warehouse,
    }
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


# ---------------------------------------------------------------------------
# __str__
# ---------------------------------------------------------------------------

class ProductStrTest(TestCase):

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()

    def test_str_returns_name_and_sku(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertEqual(str(product), 'Laptop Pro X1 (LAP-PRO-X1)')

    def test_str_with_different_name_and_sku(self):
        product = _make_product(
            self.supplier, self.warehouse,
            name='Monitor 4K UHD', sku='MON-4K-27',
        )
        self.assertEqual(str(product), 'Monitor 4K UHD (MON-4K-27)')

    def test_str_with_special_characters_in_name(self):
        product = _make_product(
            self.supplier, self.warehouse,
            name='Teclado Mecánico RGB', sku='TEC-MEC-RGB',
        )
        self.assertEqual(str(product), 'Teclado Mecánico RGB (TEC-MEC-RGB)')


# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

class ProductDefaultsTest(TestCase):

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()

    def test_stock_defaults_to_zero(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertEqual(product.stock, 0)

    def test_is_active_defaults_to_true(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertTrue(product.is_active)

    def test_description_defaults_to_none(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertIsNone(product.description)

    def test_dimensions_defaults_to_none(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertIsNone(product.dimensions)

    def test_created_at_auto_populated(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertIsNotNone(product.created_at)

    def test_updated_at_auto_populated(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertIsNotNone(product.updated_at)


# ---------------------------------------------------------------------------
# Campos nullable y opcionales
# ---------------------------------------------------------------------------

class ProductNullableFieldsTest(TestCase):

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()

    def test_description_can_be_set(self):
        product = _make_product(
            self.supplier, self.warehouse,
            description='Laptop de alto rendimiento con procesador Intel i7',
        )
        self.assertEqual(product.description, 'Laptop de alto rendimiento con procesador Intel i7')

    def test_dimensions_can_be_set(self):
        product = _make_product(
            self.supplier, self.warehouse,
            dimensions='35x24x2 cm',
        )
        self.assertEqual(product.dimensions, '35x24x2 cm')

    def test_description_and_dimensions_can_be_set_simultaneously(self):
        product = _make_product(
            self.supplier, self.warehouse,
            description='Mouse inalámbrico ergonómico',
            dimensions='12x7x4 cm',
        )
        self.assertIsNotNone(product.description)
        self.assertIsNotNone(product.dimensions)

    def test_description_can_be_cleared(self):
        product = _make_product(
            self.supplier, self.warehouse,
            description='Descripción temporal',
        )
        product.description = None
        product.save()
        product.refresh_from_db()
        self.assertIsNone(product.description)


# ---------------------------------------------------------------------------
# Campo SKU — unicidad
# ---------------------------------------------------------------------------

class ProductSkuUniquenessTest(TestCase):

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()

    def test_sku_unique_raises_integrity_error(self):
        _make_product(self.supplier, self.warehouse, sku='UNIQUE-SKU-001')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                _make_product(
                    self.supplier, self.warehouse,
                    sku='UNIQUE-SKU-001',
                    name='Otro Producto',
                )

    def test_different_skus_can_coexist(self):
        _make_product(self.supplier, self.warehouse, sku='SKU-001', name='Producto A')
        _make_product(self.supplier, self.warehouse, sku='SKU-002', name='Producto B')
        self.assertEqual(Product.objects.count(), 2)

    def test_sku_is_case_sensitive(self):
        """SKUs con distinto case son distintos."""
        _make_product(self.supplier, self.warehouse, sku='sku-lower')
        _make_product(self.supplier, self.warehouse, sku='SKU-LOWER', name='Producto Upper')
        self.assertEqual(Product.objects.count(), 2)


# ---------------------------------------------------------------------------
# Campos decimales — weight_kg y unit_price
# ---------------------------------------------------------------------------

class ProductDecimalFieldsTest(TestCase):

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()

    def test_weight_kg_stores_decimal(self):
        product = _make_product(
            self.supplier, self.warehouse,
            weight_kg='0.35',
        )
        self.assertEqual(float(product.weight_kg), 0.35)

    def test_unit_price_stores_large_decimal(self):
        product = _make_product(
            self.supplier, self.warehouse,
            unit_price='12500000.99',
        )
        self.assertIsNotNone(product.unit_price)
        self.assertEqual(float(product.unit_price), 12500000.99)

    def test_weight_kg_with_many_decimals(self):
        product = _make_product(
            self.supplier, self.warehouse,
            weight_kg='1.75',
        )
        self.assertEqual(float(product.weight_kg), 1.75)


# ---------------------------------------------------------------------------
# Campo is_active
# ---------------------------------------------------------------------------

class ProductIsActiveTest(TestCase):

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()

    def test_is_active_can_be_set_to_false(self):
        product = _make_product(self.supplier, self.warehouse, is_active=False)
        self.assertFalse(product.is_active)

    def test_is_active_can_be_toggled(self):
        product = _make_product(self.supplier, self.warehouse)
        product.is_active = False
        product.save()
        product.refresh_from_db()
        self.assertFalse(product.is_active)

    def test_multiple_products_with_mixed_active_status(self):
        _make_product(self.supplier, self.warehouse, sku='ACTIVE-001', is_active=True)
        _make_product(self.supplier, self.warehouse, sku='INACTIVE-001', is_active=False)
        active_count = Product.objects.filter(is_active=True).count()
        inactive_count = Product.objects.filter(is_active=False).count()
        self.assertEqual(active_count, 1)
        self.assertEqual(inactive_count, 1)


# ---------------------------------------------------------------------------
# FK relaciones — PROTECT on delete
# ---------------------------------------------------------------------------

class ProductForeignKeyTest(TestCase):

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()

    def test_supplier_protect_on_delete(self):
        """Eliminar el supplier asociado lanza ProtectedError."""
        _make_product(self.supplier, self.warehouse)
        with self.assertRaises(ProtectedError):
            with transaction.atomic():
                self.supplier.delete()

    def test_warehouse_protect_on_delete(self):
        """Eliminar el warehouse asociado lanza ProtectedError."""
        _make_product(self.supplier, self.warehouse)
        with self.assertRaises(ProtectedError):
            with transaction.atomic():
                self.warehouse.delete()

    def test_supplier_can_be_deleted_when_no_products_exist(self):
        """Sin productos asociados, el supplier se puede eliminar."""
        supplier = _make_supplier(
            name='Proveedor Sin Productos',
            email='sinproductos@prov.com',
            tax_id='SP-999999-1',
        )
        pk = supplier.pk
        supplier.delete()
        self.assertFalse(Supplier.objects.filter(pk=pk).exists())

    def test_warehouse_can_be_deleted_when_no_products_exist(self):
        """Sin productos asociados, el warehouse se puede eliminar."""
        warehouse = _make_warehouse(name='Bodega Vacía', city='Manizales')
        pk = warehouse.pk
        warehouse.delete()
        self.assertFalse(Warehouse.objects.filter(pk=pk).exists())

    def test_product_belongs_to_correct_supplier(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertEqual(product.supplier.pk, self.supplier.pk)

    def test_product_belongs_to_correct_warehouse(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertEqual(product.warehouse.pk, self.warehouse.pk)


# ---------------------------------------------------------------------------
# Ordering
# ---------------------------------------------------------------------------

class ProductOrderingTest(TestCase):

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()

    def test_default_ordering_is_newest_first(self):
        """Meta.ordering = ['-created_at'] — el último creado aparece primero."""
        p1 = _make_product(self.supplier, self.warehouse, sku='SKU-FIRST', name='Primero')
        p2 = _make_product(self.supplier, self.warehouse, sku='SKU-SECOND', name='Segundo')
        products = list(Product.objects.all())
        self.assertEqual(products[0].id, p2.id)
        self.assertEqual(products[1].id, p1.id)


# ---------------------------------------------------------------------------
# Creación y persistencia
# ---------------------------------------------------------------------------

class ProductCreationTest(TestCase):

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()

    def test_create_product_increments_count(self):
        self.assertEqual(Product.objects.count(), 0)
        _make_product(self.supplier, self.warehouse)
        self.assertEqual(Product.objects.count(), 1)

    def test_create_multiple_products(self):
        _make_product(self.supplier, self.warehouse, sku='SKU-A', name='Producto A')
        _make_product(self.supplier, self.warehouse, sku='SKU-B', name='Producto B')
        _make_product(self.supplier, self.warehouse, sku='SKU-C', name='Producto C')
        self.assertEqual(Product.objects.count(), 3)

    def test_all_fields_persist_correctly(self):
        product = _make_product(
            self.supplier, self.warehouse,
            name='Auriculares Bluetooth Pro',
            sku='AUR-BT-PRO',
            weight_kg='0.35',
            dimensions='20x15x8 cm',
            unit_price='350000.00',
            stock=100,
            description='Auriculares con cancelación de ruido activa',
            is_active=True,
        )
        saved = Product.objects.get(pk=product.pk)
        self.assertEqual(saved.name, 'Auriculares Bluetooth Pro')
        self.assertEqual(saved.sku, 'AUR-BT-PRO')
        self.assertEqual(float(saved.weight_kg), 0.35)
        self.assertEqual(saved.dimensions, '20x15x8 cm')
        self.assertEqual(float(saved.unit_price), 350000.00)
        self.assertEqual(saved.stock, 100)
        self.assertEqual(saved.description, 'Auriculares con cancelación de ruido activa')
        self.assertTrue(saved.is_active)

    def test_update_product_name(self):
        product = _make_product(self.supplier, self.warehouse, name='Nombre Original')
        product.name = 'Nombre Actualizado'
        product.save()
        product.refresh_from_db()
        self.assertEqual(product.name, 'Nombre Actualizado')

    def test_update_product_stock(self):
        product = _make_product(self.supplier, self.warehouse)
        self.assertEqual(product.stock, 0)
        product.stock = 250
        product.save()
        product.refresh_from_db()
        self.assertEqual(product.stock, 250)

    def test_delete_product(self):
        product = _make_product(self.supplier, self.warehouse)
        pk = product.pk
        product.delete()
        self.assertFalse(Product.objects.filter(pk=pk).exists())

    def test_product_queryset_select_related(self):
        """El queryset del ViewSet usa select_related para evitar N+1."""
        _make_product(self.supplier, self.warehouse)
        products = list(Product.objects.select_related('supplier', 'warehouse').all())
        self.assertEqual(len(products), 1)
        # Acceder a FK sin query adicional
        self.assertEqual(products[0].supplier.name, self.supplier.name)
        self.assertEqual(products[0].warehouse.name, self.warehouse.name)
