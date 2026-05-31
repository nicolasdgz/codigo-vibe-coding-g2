from django.test import TestCase
from django.db import IntegrityError, transaction
from django.contrib.auth.models import User
from apps.drivers.models import Driver
from apps.transport.models import Transport


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_driver(username='conductor1', first_name='Carlos', last_name='López'):
    user = User.objects.create_user(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
        first_name=first_name,
        last_name=last_name,
    )
    return Driver.objects.create(
        user=user,
        license_number=f'LIC-{username.upper()}',
        license_expiry='2027-06-30',
        phone='+57 310 111 2222',
    )


def _make_transport(**kwargs):
    defaults = {
        'plate_number': 'ABC-123',
        'vehicle_type': Transport.VehicleType.TRUCK,
        'brand': 'Kenworth',
        'model': 'T680',
        'year': 2022,
        'capacity_kg': '15000.00',
        'capacity_units': 100,
    }
    defaults.update(kwargs)
    return Transport.objects.create(**defaults)


# ---------------------------------------------------------------------------
# __str__
# ---------------------------------------------------------------------------

class TransportStrTest(TestCase):

    def test_str_truck(self):
        transport = _make_transport(plate_number='KWH-001', vehicle_type='truck')
        self.assertEqual(str(transport), 'KWH-001 — Truck')

    def test_str_van(self):
        transport = _make_transport(plate_number='VAN-002', vehicle_type='van')
        self.assertEqual(str(transport), 'VAN-002 — Van')

    def test_str_motorcycle(self):
        transport = _make_transport(plate_number='MOT-003', vehicle_type='motorcycle')
        self.assertEqual(str(transport), 'MOT-003 — Motorcycle')

    def test_str_car(self):
        transport = _make_transport(plate_number='CAR-004', vehicle_type='car')
        self.assertEqual(str(transport), 'CAR-004 — Car')


# ---------------------------------------------------------------------------
# Defaults y campos básicos
# ---------------------------------------------------------------------------

class TransportDefaultsTest(TestCase):

    def test_is_active_default_true(self):
        transport = _make_transport()
        self.assertTrue(transport.is_active)

    def test_driver_nullable_by_default(self):
        transport = _make_transport()
        self.assertIsNone(transport.driver)

    def test_timestamps_auto_generated(self):
        transport = _make_transport()
        self.assertIsNotNone(transport.created_at)
        self.assertIsNotNone(transport.updated_at)

    def test_capacity_kg_stored_as_decimal(self):
        transport = _make_transport(capacity_kg='2500.50')
        transport.refresh_from_db()
        self.assertEqual(float(transport.capacity_kg), 2500.50)

    def test_capacity_units_stored_as_integer(self):
        transport = _make_transport(capacity_units=25)
        self.assertEqual(transport.capacity_units, 25)

    def test_year_stored_correctly(self):
        transport = _make_transport(year=2019)
        self.assertEqual(transport.year, 2019)


# ---------------------------------------------------------------------------
# Constraint unique en plate_number
# ---------------------------------------------------------------------------

class TransportPlateNumberUniqueTest(TestCase):

    def test_duplicate_plate_number_raises_integrity_error(self):
        _make_transport(plate_number='DUP-001')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                _make_transport(plate_number='DUP-001', brand='OtraMarca')

    def test_different_plate_numbers_allowed(self):
        _make_transport(plate_number='UNQ-001')
        _make_transport(plate_number='UNQ-002')
        self.assertEqual(Transport.objects.count(), 2)


# ---------------------------------------------------------------------------
# FK a drivers
# ---------------------------------------------------------------------------

class TransportDriverRelationTest(TestCase):

    def setUp(self):
        self.driver = _make_driver()

    def test_create_with_driver_assigned(self):
        transport = _make_transport(driver=self.driver)
        self.assertEqual(transport.driver, self.driver)

    def test_create_without_driver(self):
        transport = _make_transport()
        self.assertIsNone(transport.driver)

    def test_driver_set_null_on_driver_delete(self):
        transport = _make_transport(driver=self.driver)
        self.driver.delete()
        transport.refresh_from_db()
        self.assertIsNone(transport.driver)

    def test_multiple_transports_can_share_same_driver(self):
        """Un conductor puede estar asignado a más de un vehículo."""
        t1 = _make_transport(plate_number='MUL-001', driver=self.driver)
        t2 = _make_transport(plate_number='MUL-002', driver=self.driver)
        self.assertEqual(t1.driver, self.driver)
        self.assertEqual(t2.driver, self.driver)

    def test_driver_vehicles_reverse_relation(self):
        _make_transport(plate_number='REV-001', driver=self.driver)
        _make_transport(plate_number='REV-002', driver=self.driver)
        self.assertEqual(self.driver.vehicles.count(), 2)


# ---------------------------------------------------------------------------
# VehicleType choices
# ---------------------------------------------------------------------------

class TransportVehicleTypeChoicesTest(TestCase):

    def test_all_choices_are_valid(self):
        valid_types = ['truck', 'van', 'motorcycle', 'car']
        for i, vtype in enumerate(valid_types):
            t = _make_transport(plate_number=f'CHO-00{i}', vehicle_type=vtype)
            self.assertEqual(t.vehicle_type, vtype)

    def test_choices_display_labels(self):
        expected = {
            'truck': 'Truck',
            'van': 'Van',
            'motorcycle': 'Motorcycle',
            'car': 'Car',
        }
        for vtype, label in expected.items():
            self.assertEqual(Transport.VehicleType(vtype).label, label)

    def test_vehicle_type_choices_count(self):
        self.assertEqual(len(Transport.VehicleType.choices), 4)


# ---------------------------------------------------------------------------
# is_active flag
# ---------------------------------------------------------------------------

class TransportIsActiveTest(TestCase):

    def test_deactivate_transport(self):
        transport = _make_transport()
        transport.is_active = False
        transport.save()
        transport.refresh_from_db()
        self.assertFalse(transport.is_active)

    def test_reactivate_transport(self):
        transport = _make_transport(is_active=False)
        transport.is_active = True
        transport.save()
        transport.refresh_from_db()
        self.assertTrue(transport.is_active)

    def test_create_inactive_transport(self):
        transport = _make_transport(is_active=False)
        self.assertFalse(transport.is_active)


# ---------------------------------------------------------------------------
# Meta y ordenamiento
# ---------------------------------------------------------------------------

class TransportMetaTest(TestCase):

    def test_default_ordering_by_created_at_descending(self):
        """El queryset por defecto debe estar ordenado por -created_at."""
        t1 = _make_transport(plate_number='ORD-001')
        t2 = _make_transport(plate_number='ORD-002')
        t3 = _make_transport(plate_number='ORD-003')
        transports = list(Transport.objects.all())
        # El más reciente debe aparecer primero
        self.assertEqual(transports[0], t3)
        self.assertEqual(transports[2], t1)

    def test_verbose_name(self):
        self.assertEqual(Transport._meta.verbose_name, 'Transport')

    def test_verbose_name_plural(self):
        self.assertEqual(Transport._meta.verbose_name_plural, 'Transports')
