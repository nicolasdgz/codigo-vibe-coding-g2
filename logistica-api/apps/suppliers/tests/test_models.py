from django.test import TestCase
from django.db import IntegrityError, transaction
from apps.suppliers.models import Supplier


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_supplier(**kwargs):
    """Crea un Supplier con datos mínimos válidos. kwargs sobrescriben defaults."""
    defaults = {
        'name': 'Tech Supplies S.A.',
        'email': 'contacto@techsupplies.com',
        'phone': '+57 310 000 0000',
        'address': 'Carrera 15 # 80-20, Bogotá',
        'tax_id': '900123456-1',
        'contact_name': 'Ana Gómez',
    }
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


# ---------------------------------------------------------------------------
# __str__
# ---------------------------------------------------------------------------

class SupplierStrTest(TestCase):

    def test_str_returns_name_and_tax_id(self):
        supplier = _make_supplier(name='Tech Supplies S.A.', tax_id='900123456-1')
        self.assertEqual(str(supplier), 'Tech Supplies S.A. (900123456-1)')

    def test_str_with_different_name(self):
        supplier = _make_supplier(name='Global Electrónica Ltda', tax_id='800987654-2')
        self.assertEqual(str(supplier), 'Global Electrónica Ltda (800987654-2)')

    def test_str_with_numeric_tax_id(self):
        supplier = _make_supplier(name='Proveedor XYZ', tax_id='NIT-12345678-9')
        self.assertEqual(str(supplier), 'Proveedor XYZ (NIT-12345678-9)')


# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

class SupplierDefaultsTest(TestCase):

    def test_is_active_defaults_to_true(self):
        supplier = _make_supplier()
        self.assertTrue(supplier.is_active)

    def test_created_at_auto_populated(self):
        supplier = _make_supplier()
        self.assertIsNotNone(supplier.created_at)

    def test_updated_at_auto_populated(self):
        supplier = _make_supplier()
        self.assertIsNotNone(supplier.updated_at)


# ---------------------------------------------------------------------------
# Unique constraints
# ---------------------------------------------------------------------------

class SupplierUniqueTest(TestCase):

    def test_tax_id_unique_raises_integrity_error(self):
        _make_supplier(tax_id='900123456-1')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                _make_supplier(name='Otro Proveedor', email='otro@otro.com', tax_id='900123456-1')

    def test_two_suppliers_with_different_tax_id_allowed(self):
        _make_supplier(tax_id='900111111-1')
        _make_supplier(name='Segundo Proveedor', email='seg@seg.com', tax_id='900222222-2')
        self.assertEqual(Supplier.objects.count(), 2)


# ---------------------------------------------------------------------------
# is_active control
# ---------------------------------------------------------------------------

class SupplierIsActiveTest(TestCase):

    def test_is_active_can_be_set_to_false_on_creation(self):
        supplier = _make_supplier(is_active=False)
        self.assertFalse(supplier.is_active)

    def test_is_active_can_be_toggled_to_false(self):
        supplier = _make_supplier()
        supplier.is_active = False
        supplier.save()
        supplier.refresh_from_db()
        self.assertFalse(supplier.is_active)

    def test_is_active_can_be_toggled_back_to_true(self):
        supplier = _make_supplier(is_active=False)
        supplier.is_active = True
        supplier.save()
        supplier.refresh_from_db()
        self.assertTrue(supplier.is_active)

    def test_mixed_active_status(self):
        _make_supplier(name='Activo', tax_id='111-1')
        _make_supplier(name='Inactivo', email='i@i.com', tax_id='222-2', is_active=False)
        active_count = Supplier.objects.filter(is_active=True).count()
        inactive_count = Supplier.objects.filter(is_active=False).count()
        self.assertEqual(active_count, 1)
        self.assertEqual(inactive_count, 1)


# ---------------------------------------------------------------------------
# Ordering
# ---------------------------------------------------------------------------

class SupplierOrderingTest(TestCase):

    def test_default_ordering_is_newest_first(self):
        """Meta.ordering = ['-created_at'] — el último creado aparece primero."""
        s1 = _make_supplier(name='Primero', tax_id='TAX-001')
        s2 = _make_supplier(name='Segundo', email='seg@seg.com', tax_id='TAX-002')
        suppliers = list(Supplier.objects.all())
        self.assertEqual(suppliers[0].id, s2.id)
        self.assertEqual(suppliers[1].id, s1.id)


# ---------------------------------------------------------------------------
# Creación y persistencia
# ---------------------------------------------------------------------------

class SupplierCreationTest(TestCase):

    def test_create_supplier_increments_count(self):
        self.assertEqual(Supplier.objects.count(), 0)
        _make_supplier()
        self.assertEqual(Supplier.objects.count(), 1)

    def test_create_multiple_suppliers(self):
        _make_supplier(name='A', tax_id='TAX-A')
        _make_supplier(name='B', email='b@b.com', tax_id='TAX-B')
        _make_supplier(name='C', email='c@c.com', tax_id='TAX-C')
        self.assertEqual(Supplier.objects.count(), 3)

    def test_supplier_fields_persist_correctly(self):
        supplier = _make_supplier(
            name='Global Tech Ltda',
            email='global@globaltech.com',
            phone='+57 320 111 2222',
            address='Calle 72 # 10-30, Bogotá',
            tax_id='800987654-2',
            contact_name='Carlos Ruiz',
        )
        saved = Supplier.objects.get(pk=supplier.pk)
        self.assertEqual(saved.name, 'Global Tech Ltda')
        self.assertEqual(saved.email, 'global@globaltech.com')
        self.assertEqual(saved.phone, '+57 320 111 2222')
        self.assertEqual(saved.address, 'Calle 72 # 10-30, Bogotá')
        self.assertEqual(saved.tax_id, '800987654-2')
        self.assertEqual(saved.contact_name, 'Carlos Ruiz')

    def test_update_supplier_name(self):
        supplier = _make_supplier(name='Nombre Original')
        supplier.name = 'Nombre Actualizado'
        supplier.save()
        supplier.refresh_from_db()
        self.assertEqual(supplier.name, 'Nombre Actualizado')

    def test_update_supplier_contact_name(self):
        supplier = _make_supplier(contact_name='Contacto Viejo')
        supplier.contact_name = 'Contacto Nuevo'
        supplier.save()
        supplier.refresh_from_db()
        self.assertEqual(supplier.contact_name, 'Contacto Nuevo')

    def test_delete_supplier(self):
        supplier = _make_supplier()
        pk = supplier.pk
        supplier.delete()
        self.assertFalse(Supplier.objects.filter(pk=pk).exists())
