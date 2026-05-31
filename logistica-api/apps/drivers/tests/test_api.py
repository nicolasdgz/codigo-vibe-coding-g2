from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.drivers.models import Driver


DRIVERS_URL = '/api/v1/drivers/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(username, is_superuser=False, first_name='', last_name='', **kwargs):
    if is_superuser:
        return User.objects.create_superuser(
            username=username,
            email=f'{username}@logistica.com',
            password='TestPass9!',
            first_name=first_name,
            last_name=last_name,
            **kwargs,
        )
    return User.objects.create_user(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
        first_name=first_name,
        last_name=last_name,
        **kwargs,
    )


def _auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def _make_driver(user, license_number='LIC-COL-001', **kwargs):
    defaults = {
        'license_expiry': '2027-06-30',
        'phone': '+57 310 000 0001',
    }
    defaults.update(kwargs)
    return Driver.objects.create(user=user, license_number=license_number, **defaults)


class BaseDriverAPITest(APITestCase):
    """Base con superuser autenticado via JWT listo para cada test."""

    def setUp(self):
        self.admin_user = _make_user('admin_base', is_superuser=True)
        _auth_client(self.client, self.admin_user)


# ---------------------------------------------------------------------------
# GET /api/v1/drivers/ — listar
# ---------------------------------------------------------------------------

class DriverListTest(BaseDriverAPITest):

    def setUp(self):
        super().setUp()
        self.driver_user = _make_user(
            'carlos_test', first_name='Carlos', last_name='Ramírez',
        )
        self.driver = _make_driver(self.driver_user, 'LIC-LIST-001')

    def test_list_returns_200(self):
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_has_pagination_structure(self):
        response = self.client.get(DRIVERS_URL)
        for key in ['count', 'results', 'next', 'previous']:
            self.assertIn(key, response.data)

    def test_list_includes_created_driver(self):
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.data['count'], 1)

    def test_list_result_contains_expected_fields(self):
        response = self.client.get(DRIVERS_URL)
        result = response.data['results'][0]
        for field in ['id', 'user', 'license_number', 'license_expiry',
                      'phone', 'is_available', 'created_at', 'updated_at']:
            self.assertIn(field, result)

    def test_list_user_field_is_nested_object(self):
        response = self.client.get(DRIVERS_URL)
        user_data = response.data['results'][0]['user']
        for field in ['id', 'username', 'email', 'first_name', 'last_name']:
            self.assertIn(field, user_data)

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_when_no_drivers(self):
        Driver.objects.all().delete()
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])

    def test_list_multiple_drivers_returns_correct_count(self):
        extra_user = _make_user('extra_driver')
        _make_driver(extra_user, 'LIC-LIST-002')
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.data['count'], 2)


# ---------------------------------------------------------------------------
# POST /api/v1/drivers/ — crear
# ---------------------------------------------------------------------------

class DriverCreateTest(BaseDriverAPITest):

    def setUp(self):
        super().setUp()
        self.free_user = _make_user('free_user_create')
        self.valid_payload = {
            'user': self.free_user.id,
            'license_number': 'LIC-NEW-001',
            'license_expiry': '2028-12-31',
            'phone': '+57 315 123 4567',
        }

    def test_create_valid_payload_returns_201(self):
        response = self.client.post(DRIVERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_response_contains_id(self):
        response = self.client.post(DRIVERS_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)

    def test_create_response_reflects_payload(self):
        response = self.client.post(DRIVERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.data['license_number'], self.valid_payload['license_number'])
        self.assertEqual(response.data['phone'], self.valid_payload['phone'])

    def test_create_persists_to_database(self):
        self.client.post(DRIVERS_URL, self.valid_payload, format='json')
        self.assertTrue(Driver.objects.filter(license_number='LIC-NEW-001').exists())

    def test_create_is_available_defaults_to_true(self):
        response = self.client.post(DRIVERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_available'])

    def test_create_with_is_available_false(self):
        payload = {**self.valid_payload, 'is_available': False}
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_available'])

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(DRIVERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_user_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'user'}
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('user', response.data)

    def test_create_missing_license_number_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'license_number'}
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_number', response.data)

    def test_create_missing_license_expiry_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'license_expiry'}
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_expiry', response.data)

    def test_create_missing_phone_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'phone'}
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', response.data)

    def test_create_empty_payload_returns_400(self):
        response = self.client.post(DRIVERS_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_nonexistent_user_fk_returns_400(self):
        payload = {**self.valid_payload, 'user': 99999}
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_license_number_returns_400(self):
        """license_number unique=True — el segundo intento debe fallar."""
        driver_user = _make_user('existing_driver_user')
        _make_driver(driver_user, 'LIC-DUP-001')
        payload = {**self.valid_payload, 'license_number': 'LIC-DUP-001'}
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_second_driver_for_same_user_is_blocked_at_db(self):
        """OneToOne: un user ya vinculado a un Driver no puede tener otro.
        El serializer DRF no valida la constraint OneToOne a nivel de
        validación, por lo que el error llega como IntegrityError a la DB.
        Verificamos el comportamiento real de la capa de persistencia."""
        from django.db import IntegrityError, transaction
        existing_driver_user = _make_user('already_driver')
        _make_driver(existing_driver_user, 'LIC-121-001')
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Driver.objects.create(
                    user=existing_driver_user,
                    license_number='LIC-121-002',
                    license_expiry='2028-01-01',
                    phone='+57 310 999 0000',
                )

    def test_create_read_only_fields_ignored(self):
        """id, created_at, updated_at son read-only."""
        payload = {**self.valid_payload, 'id': 9999}
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)


# ---------------------------------------------------------------------------
# GET /api/v1/drivers/{id}/ — detalle
# ---------------------------------------------------------------------------

class DriverRetrieveTest(BaseDriverAPITest):

    def setUp(self):
        super().setUp()
        self.driver_user = _make_user(
            'retrieve_driver', first_name='Laura', last_name='Mendoza',
        )
        self.driver = _make_driver(self.driver_user, 'LIC-RET-001')

    def test_retrieve_existing_returns_200(self):
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_license_number(self):
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.data['license_number'], 'LIC-RET-001')

    def test_retrieve_user_field_is_nested_with_expected_fields(self):
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        user_data = response.data['user']
        self.assertEqual(user_data['username'], 'retrieve_driver')
        self.assertEqual(user_data['first_name'], 'Laura')
        self.assertEqual(user_data['last_name'], 'Mendoza')

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{DRIVERS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PUT /api/v1/drivers/{id}/ — reemplazo completo
# ---------------------------------------------------------------------------

class DriverFullUpdateTest(BaseDriverAPITest):

    def setUp(self):
        super().setUp()
        self.driver_user = _make_user('put_driver_user')
        self.driver = _make_driver(self.driver_user, 'LIC-PUT-001')
        self.full_payload = {
            'user': self.driver_user.id,
            'license_number': 'LIC-PUT-001',
            'license_expiry': '2029-01-01',
            'phone': '+57 300 999 0000',
            'is_available': False,
        }

    def test_full_update_returns_200(self):
        response = self.client.put(
            f'{DRIVERS_URL}{self.driver.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_changes_all_fields(self):
        response = self.client.put(
            f'{DRIVERS_URL}{self.driver.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.data['license_expiry'], '2029-01-01')
        self.assertEqual(response.data['phone'], '+57 300 999 0000')
        self.assertFalse(response.data['is_available'])

    def test_full_update_persists_to_database(self):
        self.client.put(
            f'{DRIVERS_URL}{self.driver.pk}/',
            self.full_payload,
            format='json',
        )
        self.driver.refresh_from_db()
        self.assertEqual(str(self.driver.license_expiry), '2029-01-01')

    def test_full_update_nonexistent_returns_404(self):
        response = self.client.put(
            f'{DRIVERS_URL}99999/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_full_update_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.put(
            f'{DRIVERS_URL}{self.driver.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PATCH /api/v1/drivers/{id}/ — actualización parcial
# ---------------------------------------------------------------------------

class DriverPartialUpdateTest(BaseDriverAPITest):

    def setUp(self):
        super().setUp()
        self.driver_user = _make_user('patch_driver_user')
        self.driver = _make_driver(self.driver_user, 'LIC-PAT-001', is_available=True)

    def test_patch_single_field_returns_200(self):
        response = self.client.patch(
            f'{DRIVERS_URL}{self.driver.pk}/',
            {'is_available': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_only_specified_field(self):
        original_license = self.driver.license_number
        response = self.client.patch(
            f'{DRIVERS_URL}{self.driver.pk}/',
            {'is_available': False},
            format='json',
        )
        self.assertFalse(response.data['is_available'])
        self.assertEqual(response.data['license_number'], original_license)

    def test_patch_phone_updates_correctly(self):
        response = self.client.patch(
            f'{DRIVERS_URL}{self.driver.pk}/',
            {'phone': '+57 320 888 7777'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '+57 320 888 7777')

    def test_patch_persists_to_database(self):
        self.client.patch(
            f'{DRIVERS_URL}{self.driver.pk}/',
            {'phone': '+57 320 111 2222'},
            format='json',
        )
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.phone, '+57 320 111 2222')

    def test_patch_nonexistent_returns_404(self):
        response = self.client.patch(
            f'{DRIVERS_URL}99999/',
            {'is_available': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            f'{DRIVERS_URL}{self.driver.pk}/',
            {'is_available': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_duplicate_license_returns_400(self):
        other_user = _make_user('patch_other_user')
        other_driver = _make_driver(other_user, 'LIC-PAT-002')
        # Intentar poner la licencia del otro driver en este driver
        response = self.client.patch(
            f'{DRIVERS_URL}{self.driver.pk}/',
            {'license_number': 'LIC-PAT-002'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# DELETE /api/v1/drivers/{id}/ — eliminar
# ---------------------------------------------------------------------------

class DriverDeleteTest(BaseDriverAPITest):

    def setUp(self):
        super().setUp()
        self.driver_user = _make_user('delete_driver_user')
        self.driver = _make_driver(self.driver_user, 'LIC-DEL-001')

    def test_delete_existing_returns_204(self):
        response = self.client.delete(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        pk = self.driver.pk
        self.client.delete(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertFalse(Driver.objects.filter(pk=pk).exists())

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(f'{DRIVERS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_response_has_no_body(self):
        response = self.client.delete(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertFalse(response.content)

    def test_delete_reduces_driver_count(self):
        initial_count = Driver.objects.count()
        self.client.delete(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(Driver.objects.count(), initial_count - 1)


# ---------------------------------------------------------------------------
# Filtros — ?is_available=
# ---------------------------------------------------------------------------

class DriverFilterTest(BaseDriverAPITest):

    def setUp(self):
        super().setUp()
        self.user_avail1 = _make_user('filter_avail1')
        self.user_avail2 = _make_user('filter_avail2')
        self.user_unavail = _make_user('filter_unavail')
        _make_driver(self.user_avail1, 'LIC-FILT-001', is_available=True)
        _make_driver(self.user_avail2, 'LIC-FILT-002', is_available=True)
        _make_driver(self.user_unavail, 'LIC-FILT-003', is_available=False)

    def test_filter_is_available_true_returns_only_available(self):
        response = self.client.get(f'{DRIVERS_URL}?is_available=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        for result in response.data['results']:
            self.assertTrue(result['is_available'])

    def test_filter_is_available_false_returns_only_unavailable(self):
        response = self.client.get(f'{DRIVERS_URL}?is_available=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertFalse(response.data['results'][0]['is_available'])

    def test_no_filter_returns_all_drivers(self):
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)


# ---------------------------------------------------------------------------
# Búsqueda — ?search=
# ---------------------------------------------------------------------------

class DriverSearchTest(BaseDriverAPITest):

    def setUp(self):
        super().setUp()
        user1 = _make_user('jperez', first_name='Jorge', last_name='Pérez')
        user2 = _make_user('mrodriguez', first_name='María', last_name='Rodríguez')
        user3 = _make_user('lsanchez', first_name='Luis', last_name='Sánchez')
        _make_driver(user1, 'LIC-SRCH-001')
        _make_driver(user2, 'LIC-SRCH-002')
        _make_driver(user3, 'LIC-SRCH-003')

    def test_search_by_license_number_returns_match(self):
        response = self.client.get(f'{DRIVERS_URL}?search=LIC-SRCH-001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['license_number'], 'LIC-SRCH-001')

    def test_search_by_username_returns_match(self):
        response = self.client.get(f'{DRIVERS_URL}?search=jperez')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_first_name_returns_match(self):
        response = self.client.get(f'{DRIVERS_URL}?search=María')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_last_name_returns_match(self):
        response = self.client.get(f'{DRIVERS_URL}?search=Sánchez')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_partial_license_number_returns_match(self):
        response = self.client.get(f'{DRIVERS_URL}?search=SRCH')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_search_no_match_returns_empty(self):
        response = self.client.get(f'{DRIVERS_URL}?search=TerminoInexistente99999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)


# ---------------------------------------------------------------------------
# Ordering — ?ordering=
# ---------------------------------------------------------------------------

class DriverOrderingTest(BaseDriverAPITest):

    def setUp(self):
        super().setUp()
        user1 = _make_user('ord_user1')
        user2 = _make_user('ord_user2')
        user3 = _make_user('ord_user3')
        _make_driver(user1, 'LIC-ORD-001', license_expiry='2025-01-01')
        _make_driver(user2, 'LIC-ORD-002', license_expiry='2027-06-15')
        _make_driver(user3, 'LIC-ORD-003', license_expiry='2026-03-20')

    def test_ordering_by_license_expiry_ascending(self):
        response = self.client.get(f'{DRIVERS_URL}?ordering=license_expiry')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['license_expiry'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_license_expiry_descending(self):
        response = self.client.get(f'{DRIVERS_URL}?ordering=-license_expiry')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['license_expiry'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))

    def test_ordering_by_created_at_descending(self):
        response = self.client.get(f'{DRIVERS_URL}?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        timestamps = [r['created_at'] for r in response.data['results']]
        self.assertEqual(timestamps, sorted(timestamps, reverse=True))

    def test_ordering_by_created_at_ascending(self):
        response = self.client.get(f'{DRIVERS_URL}?ordering=created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        timestamps = [r['created_at'] for r in response.data['results']]
        self.assertEqual(timestamps, sorted(timestamps))


# ---------------------------------------------------------------------------
# Serializer — uso de DriverReadSerializer vs DriverWriteSerializer
# ---------------------------------------------------------------------------

class DriverSerializerSelectionTest(BaseDriverAPITest):
    """Verifica que list/retrieve usan DriverReadSerializer (user anidado)
    y create/update usan DriverWriteSerializer (user como PK)."""

    def setUp(self):
        super().setUp()
        self.driver_user = _make_user('ser_driver_user', first_name='Sergio', last_name='Gómez')
        self.driver = _make_driver(self.driver_user, 'LIC-SER-001')

    def test_list_returns_nested_user_object(self):
        response = self.client.get(DRIVERS_URL)
        user_field = response.data['results'][0]['user']
        self.assertIsInstance(user_field, dict)

    def test_retrieve_returns_nested_user_object(self):
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        user_field = response.data['user']
        self.assertIsInstance(user_field, dict)
        self.assertEqual(user_field['first_name'], 'Sergio')

    def test_create_accepts_user_as_integer_pk(self):
        free_user = _make_user('ser_free_user')
        payload = {
            'user': free_user.id,
            'license_number': 'LIC-SER-002',
            'license_expiry': '2028-01-01',
            'phone': '+57 300 111 2222',
        }
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
