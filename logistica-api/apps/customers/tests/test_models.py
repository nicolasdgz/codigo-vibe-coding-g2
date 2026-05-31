from django.test import TestCase
from django.db import IntegrityError, transaction
from apps.customers.models import Customer


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_company(**kwargs):
    defaults = {
        'name': 'Empresa ABC',
        'customer_type': 'company',
        'email': 'contacto@empresaabc.com',
        'phone': '+57 310 111 2222',
        'address': 'Calle 72 # 10-30, Bogotá',
    }
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


def _make_person(**kwargs):
    defaults = {
        'name': 'Juan Pérez',
        'customer_type': 'person',
        'email': 'juan@personal.com',
        'phone': '+57 320 333 4444',
        'address': 'Carrera 5 # 20-10, Medellín',
    }
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


# ---------------------------------------------------------------------------
# __str__
# ---------------------------------------------------------------------------

class CustomerStrTest(TestCase):

    def test_str_company_type(self):
        customer = _make_company()
        self.assertEqual(str(customer), 'Empresa ABC (Company)')

    def test_str_person_type(self):
        customer = _make_person()
        self.assertEqual(str(customer), 'Juan Pérez (Person)')

    def test_str_uses_display_value_not_code(self):
        """El __str__ usa get_customer_type_display(), no el código 'company'."""
        customer = _make_company(name='Tech S.A.')
        result = str(customer)
        self.assertNotIn('company', result)
        self.assertIn('Company', result)


# ---------------------------------------------------------------------------
# Campos básicos y creación
# ---------------------------------------------------------------------------

class CustomerCreationTest(TestCase):

    def test_create_company_persists(self):
        customer = _make_company()
        self.assertEqual(Customer.objects.count(), 1)
        self.assertEqual(customer.customer_type, 'company')

    def test_create_person_persists(self):
        customer = _make_person()
        self.assertEqual(customer.customer_type, 'person')

    def test_name_stored_correctly(self):
        customer = _make_company(name='Distribuidora El Sol')
        self.assertEqual(customer.name, 'Distribuidora El Sol')

    def test_email_stored_correctly(self):
        customer = _make_company(email='info@distribuidora.com')
        self.assertEqual(customer.email, 'info@distribuidora.com')

    def test_phone_stored_correctly(self):
        customer = _make_company(phone='+57 1 234 5678')
        self.assertEqual(customer.phone, '+57 1 234 5678')

    def test_address_stored_correctly(self):
        address = 'Avenida El Dorado # 103-15, Bogotá'
        customer = _make_company(address=address)
        self.assertEqual(customer.address, address)


# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

class CustomerDefaultsTest(TestCase):

    def test_is_active_default_true(self):
        customer = _make_company()
        self.assertTrue(customer.is_active)

    def test_tax_id_default_none(self):
        customer = _make_company()
        self.assertIsNone(customer.tax_id)

    def test_can_set_is_active_false_on_create(self):
        customer = _make_company(is_active=False)
        self.assertFalse(customer.is_active)


# ---------------------------------------------------------------------------
# Timestamps
# ---------------------------------------------------------------------------

class CustomerTimestampTest(TestCase):

    def test_created_at_auto_generated(self):
        customer = _make_company()
        self.assertIsNotNone(customer.created_at)

    def test_updated_at_auto_generated(self):
        customer = _make_company()
        self.assertIsNotNone(customer.updated_at)

    def test_updated_at_changes_on_save(self):
        customer = _make_company()
        original_updated = customer.updated_at
        customer.name = 'Empresa ABC Modificada'
        customer.save()
        customer.refresh_from_db()
        self.assertGreaterEqual(customer.updated_at, original_updated)


# ---------------------------------------------------------------------------
# Unicidad de email
# ---------------------------------------------------------------------------

class CustomerEmailUniqueTest(TestCase):

    def test_email_unique_raises_integrity_error(self):
        _make_company(email='duplicado@test.com')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                _make_person(email='duplicado@test.com')

    def test_different_emails_allowed(self):
        _make_company(email='empresa@test.com')
        _make_person(email='persona@test.com')
        self.assertEqual(Customer.objects.count(), 2)


# ---------------------------------------------------------------------------
# Unicidad y nulabilidad de tax_id
# ---------------------------------------------------------------------------

class CustomerTaxIdTest(TestCase):

    def test_tax_id_nullable(self):
        customer = _make_company()
        self.assertIsNone(customer.tax_id)

    def test_tax_id_can_be_set(self):
        customer = _make_company(tax_id='900-111-222-1')
        self.assertEqual(customer.tax_id, '900-111-222-1')

    def test_tax_id_unique_raises_integrity_error(self):
        _make_company(tax_id='NIT-1234567-8')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                _make_person(tax_id='NIT-1234567-8')

    def test_two_customers_without_tax_id_allowed(self):
        """null=True permite múltiples registros con tax_id=NULL."""
        _make_company()
        _make_person()
        self.assertEqual(Customer.objects.count(), 2)

    def test_tax_id_blank_string_not_same_as_null(self):
        """tax_id blank=True: se puede almacenar cadena vacía."""
        customer = _make_company(tax_id='')
        self.assertEqual(customer.tax_id, '')


# ---------------------------------------------------------------------------
# Choices de customer_type
# ---------------------------------------------------------------------------

class CustomerTypeChoicesTest(TestCase):

    def test_customer_type_company_value(self):
        self.assertEqual(Customer.CustomerType.COMPANY, 'company')

    def test_customer_type_person_value(self):
        self.assertEqual(Customer.CustomerType.PERSON, 'person')

    def test_customer_type_company_label(self):
        self.assertEqual(Customer.CustomerType.COMPANY.label, 'Company')

    def test_customer_type_person_label(self):
        self.assertEqual(Customer.CustomerType.PERSON.label, 'Person')

    def test_choices_has_two_options(self):
        self.assertEqual(len(Customer.CustomerType.choices), 2)


# ---------------------------------------------------------------------------
# Ordering
# ---------------------------------------------------------------------------

class CustomerOrderingTest(TestCase):

    def test_default_ordering_is_created_at_descending(self):
        """El Meta.ordering = ['-created_at'] devuelve el más reciente primero."""
        first = _make_company(name='Empresa Alfa', email='alfa@test.com')
        second = _make_person(name='Juan Beta', email='beta@test.com')
        customers = list(Customer.objects.all())
        # El segundo creado aparece primero (más reciente)
        self.assertEqual(customers[0].pk, second.pk)
        self.assertEqual(customers[1].pk, first.pk)
