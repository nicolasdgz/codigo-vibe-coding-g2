from django.test import TestCase
from django.db import IntegrityError, transaction
from django.contrib.auth.models import User
from apps.drivers.models import Driver


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(username='driver_user', first_name='', last_name='', **kwargs):
    return User.objects.create_user(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
        first_name=first_name,
        last_name=last_name,
        **kwargs,
    )


def _make_driver(user, license_number='LIC-COL-001', **kwargs):
    defaults = {
        'license_expiry': '2027-06-30',
        'phone': '+57 310 000 0001',
    }
    defaults.update(kwargs)
    return Driver.objects.create(user=user, license_number=license_number, **defaults)


# ---------------------------------------------------------------------------
# __str__ representation
# ---------------------------------------------------------------------------

class DriverStrTest(TestCase):

    def test_str_with_full_name_uses_full_name(self):
        user = _make_user('carlos_lopez', first_name='Carlos', last_name='López')
        driver = _make_driver(user, 'LIC-COL-100')
        self.assertEqual(str(driver), 'Carlos López — LIC-COL-100')

    def test_str_without_name_falls_back_to_username(self):
        user = _make_user('driver_sin_nombre')
        driver = _make_driver(user, 'LIC-COL-200')
        self.assertEqual(str(driver), 'driver_sin_nombre — LIC-COL-200')

    def test_str_with_only_first_name_uses_first_name(self):
        """get_full_name() retorna solo first_name si last_name está vacío."""
        user = _make_user('juan_solo', first_name='Juan')
        driver = _make_driver(user, 'LIC-COL-300')
        # get_full_name() con solo first_name devuelve 'Juan' (no vacío → se usa)
        self.assertIn('Juan', str(driver))
        self.assertIn('LIC-COL-300', str(driver))

    def test_str_separator_is_em_dash(self):
        user = _make_user('user_separator')
        driver = _make_driver(user, 'LIC-COL-400')
        self.assertIn(' — ', str(driver))


# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

class DriverDefaultsTest(TestCase):

    def test_is_available_defaults_to_true(self):
        user = _make_user('user_default')
        driver = _make_driver(user, 'LIC-DEF-001')
        self.assertTrue(driver.is_available)

    def test_is_available_can_be_set_to_false(self):
        user = _make_user('user_unavail')
        driver = _make_driver(user, 'LIC-DEF-002', is_available=False)
        self.assertFalse(driver.is_available)


# ---------------------------------------------------------------------------
# Timestamps
# ---------------------------------------------------------------------------

class DriverTimestampsTest(TestCase):

    def test_created_at_is_auto_generated(self):
        user = _make_user('user_ts1')
        driver = _make_driver(user, 'LIC-TS-001')
        self.assertIsNotNone(driver.created_at)

    def test_updated_at_is_auto_generated(self):
        user = _make_user('user_ts2')
        driver = _make_driver(user, 'LIC-TS-002')
        self.assertIsNotNone(driver.updated_at)

    def test_updated_at_changes_on_save(self):
        user = _make_user('user_ts3')
        driver = _make_driver(user, 'LIC-TS-003')
        original_updated_at = driver.updated_at
        driver.phone = '+57 300 999 8888'
        driver.save()
        driver.refresh_from_db()
        self.assertGreaterEqual(driver.updated_at, original_updated_at)


# ---------------------------------------------------------------------------
# Constraints de unicidad
# ---------------------------------------------------------------------------

class DriverUniquenessTest(TestCase):

    def test_license_number_must_be_unique(self):
        user1 = _make_user('user_uniq1')
        user2 = _make_user('user_uniq2')
        _make_driver(user1, 'LIC-UNIQ-001')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                _make_driver(user2, 'LIC-UNIQ-001')

    def test_user_is_one_to_one(self):
        user = _make_user('user_121')
        _make_driver(user, 'LIC-121-001')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                _make_driver(user, 'LIC-121-002')

    def test_different_users_can_have_different_licenses(self):
        user1 = _make_user('user_diff1')
        user2 = _make_user('user_diff2')
        d1 = _make_driver(user1, 'LIC-DIFF-001')
        d2 = _make_driver(user2, 'LIC-DIFF-002')
        self.assertEqual(Driver.objects.count(), 2)
        self.assertNotEqual(d1.pk, d2.pk)


# ---------------------------------------------------------------------------
# Relación OneToOne con auth.User (CASCADE)
# ---------------------------------------------------------------------------

class DriverUserRelationTest(TestCase):

    def test_cascade_deletes_driver_when_user_deleted(self):
        user = _make_user('user_cascade')
        _make_driver(user, 'LIC-CAS-001')
        self.assertEqual(Driver.objects.count(), 1)
        user.delete()
        self.assertEqual(Driver.objects.count(), 0)

    def test_driver_is_accessible_via_related_name(self):
        user = _make_user('user_related')
        driver = _make_driver(user, 'LIC-REL-001')
        self.assertEqual(user.driver_profile.pk, driver.pk)

    def test_driver_has_reference_to_user(self):
        user = _make_user('user_backref')
        driver = _make_driver(user, 'LIC-BKR-001')
        driver.refresh_from_db()
        self.assertEqual(driver.user.username, 'user_backref')


# ---------------------------------------------------------------------------
# Creación y persistencia básica
# ---------------------------------------------------------------------------

class DriverCreationTest(TestCase):

    def test_create_driver_persists_all_fields(self):
        user = _make_user('user_persist', first_name='Ana', last_name='García')
        driver = _make_driver(
            user,
            'LIC-PER-001',
            license_expiry='2028-03-15',
            phone='+57 315 123 4567',
            is_available=True,
        )
        driver.refresh_from_db()
        self.assertEqual(driver.license_number, 'LIC-PER-001')
        self.assertEqual(str(driver.license_expiry), '2028-03-15')
        self.assertEqual(driver.phone, '+57 315 123 4567')
        self.assertTrue(driver.is_available)

    def test_driver_count_increases_on_create(self):
        user1 = _make_user('user_count1')
        user2 = _make_user('user_count2')
        self.assertEqual(Driver.objects.count(), 0)
        _make_driver(user1, 'LIC-CNT-001')
        self.assertEqual(Driver.objects.count(), 1)
        _make_driver(user2, 'LIC-CNT-002')
        self.assertEqual(Driver.objects.count(), 2)

    def test_meta_ordering_by_created_at_desc(self):
        """Meta.ordering = ['-created_at'] — el más reciente primero."""
        user1 = _make_user('user_ord1')
        user2 = _make_user('user_ord2')
        d1 = _make_driver(user1, 'LIC-ORD-001')
        d2 = _make_driver(user2, 'LIC-ORD-002')
        drivers = list(Driver.objects.all())
        # El segundo creado aparece primero (ordering inverso)
        self.assertEqual(drivers[0].pk, d2.pk)
        self.assertEqual(drivers[1].pk, d1.pk)
