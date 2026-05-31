from django.test import TestCase
from apps.warehouses.models import Warehouse


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_warehouse(**kwargs):
    """Crea un Warehouse con datos mínimos válidos. kwargs sobrescriben defaults."""
    defaults = {
        'name': 'Bodega Central',
        'address': 'Calle 100 # 15-20',
        'city': 'Bogotá',
        'country': 'Colombia',
        'capacity': 500,
    }
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


# ---------------------------------------------------------------------------
# __str__
# ---------------------------------------------------------------------------

class WarehouseStrTest(TestCase):

    def test_str_returns_name_and_city(self):
        warehouse = _make_warehouse(name='Bodega Central', city='Bogotá')
        self.assertEqual(str(warehouse), 'Bodega Central — Bogotá')

    def test_str_with_different_city(self):
        warehouse = _make_warehouse(name='Bodega Norte', city='Medellín')
        self.assertEqual(str(warehouse), 'Bodega Norte — Medellín')

    def test_str_with_international_city(self):
        warehouse = _make_warehouse(name='Warehouse Lima', city='Lima', country='Perú')
        self.assertEqual(str(warehouse), 'Warehouse Lima — Lima')


# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

class WarehouseDefaultsTest(TestCase):

    def test_is_active_defaults_to_true(self):
        warehouse = _make_warehouse()
        self.assertTrue(warehouse.is_active)

    def test_latitude_defaults_to_none(self):
        warehouse = _make_warehouse()
        self.assertIsNone(warehouse.latitude)

    def test_longitude_defaults_to_none(self):
        warehouse = _make_warehouse()
        self.assertIsNone(warehouse.longitude)

    def test_created_at_auto_populated(self):
        warehouse = _make_warehouse()
        self.assertIsNotNone(warehouse.created_at)

    def test_updated_at_auto_populated(self):
        warehouse = _make_warehouse()
        self.assertIsNotNone(warehouse.updated_at)


# ---------------------------------------------------------------------------
# Campos opcionales y nullable
# ---------------------------------------------------------------------------

class WarehouseNullableFieldsTest(TestCase):

    def test_latitude_longitude_accept_valid_coordinates(self):
        warehouse = _make_warehouse(latitude='4.710989', longitude='-74.072092')
        self.assertEqual(float(warehouse.latitude), 4.710989)
        self.assertEqual(float(warehouse.longitude), -74.072092)

    def test_latitude_longitude_can_be_set_and_cleared(self):
        warehouse = _make_warehouse(latitude='6.244203', longitude='-75.581211')
        warehouse.latitude = None
        warehouse.longitude = None
        warehouse.save()
        warehouse.refresh_from_db()
        self.assertIsNone(warehouse.latitude)
        self.assertIsNone(warehouse.longitude)

    def test_latitude_accepts_negative_value(self):
        """Coordenadas del hemisferio sur tienen latitud negativa."""
        warehouse = _make_warehouse(latitude='-33.450000', longitude='-70.667000')
        self.assertLess(float(warehouse.latitude), 0)


# ---------------------------------------------------------------------------
# Campos de control
# ---------------------------------------------------------------------------

class WarehouseIsActiveTest(TestCase):

    def test_is_active_can_be_set_to_false(self):
        warehouse = _make_warehouse(is_active=False)
        self.assertFalse(warehouse.is_active)

    def test_is_active_can_be_toggled(self):
        warehouse = _make_warehouse()
        warehouse.is_active = False
        warehouse.save()
        warehouse.refresh_from_db()
        self.assertFalse(warehouse.is_active)

    def test_multiple_warehouses_with_mixed_active_status(self):
        _make_warehouse(name='Activa', city='Bogotá')
        _make_warehouse(name='Inactiva', city='Cali', is_active=False)
        active_count = Warehouse.objects.filter(is_active=True).count()
        inactive_count = Warehouse.objects.filter(is_active=False).count()
        self.assertEqual(active_count, 1)
        self.assertEqual(inactive_count, 1)


# ---------------------------------------------------------------------------
# Capacity (PositiveIntegerField)
# ---------------------------------------------------------------------------

class WarehouseCapacityTest(TestCase):

    def test_capacity_stores_large_value(self):
        warehouse = _make_warehouse(capacity=1000000)
        self.assertEqual(warehouse.capacity, 1000000)

    def test_capacity_stores_minimum_value(self):
        """PositiveIntegerField permite 0."""
        warehouse = _make_warehouse(capacity=0)
        self.assertEqual(warehouse.capacity, 0)


# ---------------------------------------------------------------------------
# Ordering
# ---------------------------------------------------------------------------

class WarehouseOrderingTest(TestCase):

    def test_default_ordering_is_newest_first(self):
        """Meta.ordering = ['-created_at'] — el último creado aparece primero."""
        w1 = _make_warehouse(name='Primera Bodega', city='Bogotá')
        w2 = _make_warehouse(name='Segunda Bodega', city='Medellín')
        warehouses = list(Warehouse.objects.all())
        self.assertEqual(warehouses[0].id, w2.id)
        self.assertEqual(warehouses[1].id, w1.id)


# ---------------------------------------------------------------------------
# Creación y persistencia
# ---------------------------------------------------------------------------

class WarehouseCreationTest(TestCase):

    def test_create_warehouse_increments_count(self):
        self.assertEqual(Warehouse.objects.count(), 0)
        _make_warehouse()
        self.assertEqual(Warehouse.objects.count(), 1)

    def test_create_multiple_warehouses(self):
        _make_warehouse(name='Bodega A', city='Bogotá')
        _make_warehouse(name='Bodega B', city='Cali')
        _make_warehouse(name='Bodega C', city='Barranquilla')
        self.assertEqual(Warehouse.objects.count(), 3)

    def test_warehouse_fields_persist_correctly(self):
        warehouse = _make_warehouse(
            name='Bodega Especial',
            address='Transversal 48 # 12-34',
            city='Cartagena',
            country='Colombia',
            capacity=750,
            latitude='10.391049',
            longitude='-75.479426',
        )
        saved = Warehouse.objects.get(pk=warehouse.pk)
        self.assertEqual(saved.name, 'Bodega Especial')
        self.assertEqual(saved.address, 'Transversal 48 # 12-34')
        self.assertEqual(saved.city, 'Cartagena')
        self.assertEqual(saved.country, 'Colombia')
        self.assertEqual(saved.capacity, 750)
        self.assertIsNotNone(saved.latitude)
        self.assertIsNotNone(saved.longitude)

    def test_update_warehouse_name(self):
        warehouse = _make_warehouse(name='Nombre Original')
        warehouse.name = 'Nombre Actualizado'
        warehouse.save()
        warehouse.refresh_from_db()
        self.assertEqual(warehouse.name, 'Nombre Actualizado')

    def test_delete_warehouse(self):
        warehouse = _make_warehouse()
        pk = warehouse.pk
        warehouse.delete()
        self.assertFalse(Warehouse.objects.filter(pk=pk).exists())
