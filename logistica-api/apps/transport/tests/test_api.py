from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.drivers.models import Driver
from apps.transport.models import Transport


TRANSPORT_URL = '/api/v1/transport/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_admin(username='admin_transport'):
    return User.objects.create_superuser(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
    )


def _make_driver_user(username='conductor_test', first_name='Pedro', last_name='Ramírez'):
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
        license_expiry='2027-08-15',
        phone='+57 315 222 3333',
    )


def _make_transport(**kwargs):
    defaults = {
        'plate_number': 'KWH-001',
        'vehicle_type': 'truck',
        'brand': 'Kenworth',
        'model': 'T680',
        'year': 2022,
        'capacity_kg': '15000.00',
        'capacity_units': 100,
    }
    defaults.update(kwargs)
    return Transport.objects.create(**defaults)


def _auth(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


class BaseTransportAPITest(APITestCase):
    """Base con usuario admin autenticado via JWT."""

    def setUp(self):
        self.admin = _make_admin()
        _auth(self.client, self.admin)


# ---------------------------------------------------------------------------
# GET /api/v1/transport/ — listar
# ---------------------------------------------------------------------------

class TransportListTest(BaseTransportAPITest):

    def setUp(self):
        super().setUp()
        self.driver = _make_driver_user()
        self.transport = _make_transport(driver=self.driver)

    def test_list_returns_200(self):
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_has_pagination_structure(self):
        response = self.client.get(TRANSPORT_URL)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_list_includes_created_transport(self):
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.data['count'], 1)

    def test_list_result_contains_expected_fields(self):
        response = self.client.get(TRANSPORT_URL)
        result = response.data['results'][0]
        for field in [
            'id', 'plate_number', 'vehicle_type', 'brand', 'model', 'year',
            'capacity_kg', 'capacity_units', 'driver', 'is_active',
            'created_at', 'updated_at',
        ]:
            self.assertIn(field, result)

    def test_list_driver_field_is_nested_object(self):
        response = self.client.get(TRANSPORT_URL)
        result = response.data['results'][0]
        driver_data = result['driver']
        self.assertIsInstance(driver_data, dict)
        self.assertIn('id', driver_data)
        self.assertIn('license_number', driver_data)
        self.assertIn('name', driver_data)
        self.assertIn('is_available', driver_data)

    def test_list_driver_name_uses_full_name(self):
        """DriverSummarySerializer.get_name debe retornar get_full_name cuando está disponible."""
        response = self.client.get(TRANSPORT_URL)
        result = response.data['results'][0]
        self.assertEqual(result['driver']['name'], 'Pedro Ramírez')

    def test_list_transport_without_driver_returns_null(self):
        _make_transport(plate_number='SIN-DRV', vehicle_type='van', brand='Ford',
                        model='Transit', year=2020, capacity_kg='2000.00', capacity_units=15)
        response = self.client.get(TRANSPORT_URL)
        no_driver = next(r for r in response.data['results'] if r['driver'] is None)
        self.assertIsNone(no_driver['driver'])

    def test_list_empty_returns_200_with_zero_count(self):
        Transport.objects.all().delete()
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# POST /api/v1/transport/ — crear
# ---------------------------------------------------------------------------

class TransportCreateTest(BaseTransportAPITest):

    def setUp(self):
        super().setUp()
        self.driver = _make_driver_user()
        self.valid_payload = {
            'plate_number': 'MER-001',
            'vehicle_type': 'van',
            'brand': 'Mercedes-Benz',
            'model': 'Sprinter',
            'year': 2021,
            'capacity_kg': '2500.00',
            'capacity_units': 20,
        }

    def test_create_valid_payload_returns_201(self):
        response = self.client.post(TRANSPORT_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_response_contains_id(self):
        response = self.client.post(TRANSPORT_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)

    def test_create_persists_to_database(self):
        self.client.post(TRANSPORT_URL, self.valid_payload, format='json')
        self.assertTrue(Transport.objects.filter(plate_number='MER-001').exists())

    def test_create_with_driver_returns_201(self):
        payload = {**self.valid_payload, 'driver': self.driver.id}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_without_driver_sets_null(self):
        response = self.client.post(TRANSPORT_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['driver'])

    def test_create_is_active_defaults_to_true(self):
        response = self.client.post(TRANSPORT_URL, self.valid_payload, format='json')
        self.assertTrue(response.data['is_active'])

    def test_create_with_is_active_false(self):
        payload = {**self.valid_payload, 'is_active': False}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_active'])

    def test_create_all_vehicle_types(self):
        for i, vtype in enumerate(['truck', 'van', 'motorcycle', 'car']):
            payload = {
                **self.valid_payload,
                'plate_number': f'VTP-00{i}',
                'vehicle_type': vtype,
            }
            response = self.client.post(TRANSPORT_URL, payload, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=f'Falló para {vtype}')

    def test_create_missing_plate_number_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'plate_number'}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('plate_number', response.data)

    def test_create_missing_vehicle_type_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'vehicle_type'}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vehicle_type', response.data)

    def test_create_missing_brand_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'brand'}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('brand', response.data)

    def test_create_missing_model_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'model'}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('model', response.data)

    def test_create_missing_year_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'year'}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('year', response.data)

    def test_create_missing_capacity_kg_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'capacity_kg'}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity_kg', response.data)

    def test_create_missing_capacity_units_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'capacity_units'}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity_units', response.data)

    def test_create_empty_payload_returns_400(self):
        response = self.client.post(TRANSPORT_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_plate_number_returns_400(self):
        _make_transport(plate_number='DUP-001')
        payload = {**self.valid_payload, 'plate_number': 'DUP-001'}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_nonexistent_driver_fk_returns_400(self):
        payload = {**self.valid_payload, 'driver': 99999}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(TRANSPORT_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_read_only_id_ignored(self):
        payload = {**self.valid_payload, 'id': 9999}
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)


# ---------------------------------------------------------------------------
# GET /api/v1/transport/{id}/ — detalle
# ---------------------------------------------------------------------------

class TransportRetrieveTest(BaseTransportAPITest):

    def setUp(self):
        super().setUp()
        self.driver = _make_driver_user()
        self.transport = _make_transport(
            plate_number='RTV-001',
            vehicle_type='truck',
            brand='Volvo',
            model='FH16',
            year=2023,
            capacity_kg='20000.00',
            capacity_units=150,
            driver=self.driver,
        )

    def test_retrieve_existing_returns_200(self):
        response = self.client.get(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_fields(self):
        response = self.client.get(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.data['plate_number'], 'RTV-001')
        self.assertEqual(response.data['brand'], 'Volvo')
        self.assertEqual(response.data['year'], 2023)

    def test_retrieve_includes_nested_driver(self):
        response = self.client.get(f'{TRANSPORT_URL}{self.transport.pk}/')
        driver_data = response.data['driver']
        self.assertIsNotNone(driver_data)
        self.assertIn('license_number', driver_data)
        self.assertIn('name', driver_data)
        self.assertIn('is_available', driver_data)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{TRANSPORT_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PUT /api/v1/transport/{id}/ — actualización completa
# ---------------------------------------------------------------------------

class TransportFullUpdateTest(BaseTransportAPITest):

    def setUp(self):
        super().setUp()
        self.driver = _make_driver_user()
        self.transport = _make_transport(
            plate_number='UPD-001',
            vehicle_type='truck',
            brand='Kenworth',
            model='T680',
            year=2020,
            capacity_kg='10000.00',
            capacity_units=80,
        )
        self.full_payload = {
            'plate_number': 'UPD-001',
            'vehicle_type': 'van',
            'brand': 'Mercedes-Benz',
            'model': 'Vito',
            'year': 2023,
            'capacity_kg': '3000.00',
            'capacity_units': 30,
            'driver': self.driver.id,
        }

    def test_full_update_returns_200(self):
        response = self.client.put(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_changes_fields(self):
        response = self.client.put(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.data['vehicle_type'], 'van')
        self.assertEqual(response.data['brand'], 'Mercedes-Benz')
        self.assertEqual(response.data['year'], 2023)

    def test_full_update_assigns_driver(self):
        response = self.client.put(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.driver, self.driver)

    def test_full_update_persists_to_database(self):
        self.client.put(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            self.full_payload,
            format='json',
        )
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.brand, 'Mercedes-Benz')
        self.assertEqual(self.transport.year, 2023)

    def test_full_update_nonexistent_returns_404(self):
        response = self.client.put(
            f'{TRANSPORT_URL}99999/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_full_update_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.put(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PATCH /api/v1/transport/{id}/ — actualización parcial
# ---------------------------------------------------------------------------

class TransportPartialUpdateTest(BaseTransportAPITest):

    def setUp(self):
        super().setUp()
        self.driver = _make_driver_user()
        self.transport = _make_transport(
            plate_number='PAT-001',
            vehicle_type='truck',
            brand='Scania',
            model='R500',
            year=2021,
            capacity_kg='12000.00',
            capacity_units=90,
            driver=self.driver,
        )

    def test_patch_single_field_returns_200(self):
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'year': 2024},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_only_specified_field(self):
        original_brand = self.transport.brand
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'year': 2024},
            format='json',
        )
        self.assertEqual(response.data['year'], 2024)
        self.assertEqual(response.data['brand'], original_brand)

    def test_patch_unassign_driver_sets_null(self):
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'driver': None},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['driver'])

    def test_patch_is_active_to_false(self):
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'is_active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    def test_patch_capacity_kg(self):
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'capacity_kg': '14000.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(response.data['capacity_kg']), '14000.00')

    def test_patch_duplicate_plate_number_returns_400(self):
        _make_transport(plate_number='DUP-PLT')
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'plate_number': 'DUP-PLT'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_nonexistent_returns_404(self):
        response = self.client.patch(
            f'{TRANSPORT_URL}99999/',
            {'year': 2024},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'year': 2024},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_persists_to_database(self):
        self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'model': 'R450'},
            format='json',
        )
        self.transport.refresh_from_db()
        self.assertEqual(self.transport.model, 'R450')


# ---------------------------------------------------------------------------
# DELETE /api/v1/transport/{id}/ — eliminar
# ---------------------------------------------------------------------------

class TransportDeleteTest(BaseTransportAPITest):

    def setUp(self):
        super().setUp()
        self.transport = _make_transport(
            plate_number='DEL-001',
            vehicle_type='motorcycle',
            brand='Honda',
            model='CB500X',
            year=2022,
            capacity_kg='150.00',
            capacity_units=2,
        )

    def test_delete_existing_returns_204(self):
        response = self.client.delete(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        pk = self.transport.pk
        self.client.delete(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertFalse(Transport.objects.filter(pk=pk).exists())

    def test_delete_response_has_no_body(self):
        response = self.client.delete(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertFalse(response.content)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(f'{TRANSPORT_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# Filtros — ?vehicle_type= / ?is_active= / ?driver=
# ---------------------------------------------------------------------------

class TransportFilterTest(BaseTransportAPITest):

    def setUp(self):
        super().setUp()
        self.driver = _make_driver_user()
        self.truck = _make_transport(
            plate_number='FLT-TRK',
            vehicle_type='truck',
            brand='Kenworth',
            model='T680',
            year=2022,
            capacity_kg='15000.00',
            capacity_units=100,
            driver=self.driver,
        )
        self.van = _make_transport(
            plate_number='FLT-VAN',
            vehicle_type='van',
            brand='Ford',
            model='Transit',
            year=2020,
            capacity_kg='2000.00',
            capacity_units=15,
        )
        self.inactive = _make_transport(
            plate_number='FLT-INAC',
            vehicle_type='car',
            brand='Toyota',
            model='Corolla',
            year=2019,
            capacity_kg='500.00',
            capacity_units=4,
            is_active=False,
        )

    def test_filter_by_vehicle_type_truck(self):
        response = self.client.get(f'{TRANSPORT_URL}?vehicle_type=truck')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['vehicle_type'], 'truck')

    def test_filter_by_vehicle_type_van(self):
        response = self.client.get(f'{TRANSPORT_URL}?vehicle_type=van')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['vehicle_type'], 'van')

    def test_filter_by_vehicle_type_nonexistent(self):
        response = self.client.get(f'{TRANSPORT_URL}?vehicle_type=motorcycle')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_filter_by_is_active_true(self):
        response = self.client.get(f'{TRANSPORT_URL}?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertTrue(result['is_active'])

    def test_filter_by_is_active_false(self):
        response = self.client.get(f'{TRANSPORT_URL}?is_active=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertFalse(response.data['results'][0]['is_active'])

    def test_filter_by_driver_id(self):
        response = self.client.get(f'{TRANSPORT_URL}?driver={self.driver.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['plate_number'], 'FLT-TRK')

    def test_filter_by_vehicle_type_and_is_active_combined(self):
        response = self.client.get(f'{TRANSPORT_URL}?vehicle_type=truck&is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        result = response.data['results'][0]
        self.assertEqual(result['vehicle_type'], 'truck')
        self.assertTrue(result['is_active'])


# ---------------------------------------------------------------------------
# Búsqueda — ?search=
# ---------------------------------------------------------------------------

class TransportSearchTest(BaseTransportAPITest):

    def setUp(self):
        super().setUp()
        _make_transport(
            plate_number='KWH-SCN',
            vehicle_type='truck',
            brand='Kenworth',
            model='T680',
            year=2022,
            capacity_kg='15000.00',
            capacity_units=100,
        )
        _make_transport(
            plate_number='VOL-SCN',
            vehicle_type='truck',
            brand='Volvo',
            model='FH16',
            year=2021,
            capacity_kg='18000.00',
            capacity_units=120,
        )
        _make_transport(
            plate_number='HON-SCN',
            vehicle_type='motorcycle',
            brand='Honda',
            model='CB500X',
            year=2022,
            capacity_kg='150.00',
            capacity_units=2,
        )

    def test_search_by_plate_number_returns_matching(self):
        response = self.client.get(f'{TRANSPORT_URL}?search=KWH')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)
        plates = [r['plate_number'] for r in response.data['results']]
        self.assertTrue(any('KWH' in p for p in plates))

    def test_search_by_brand_returns_matching(self):
        response = self.client.get(f'{TRANSPORT_URL}?search=Volvo')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['brand'], 'Volvo')

    def test_search_by_model_returns_matching(self):
        response = self.client.get(f'{TRANSPORT_URL}?search=CB500X')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['model'], 'CB500X')

    def test_search_no_match_returns_empty(self):
        response = self.client.get(f'{TRANSPORT_URL}?search=TerminoInexistente99999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)


# ---------------------------------------------------------------------------
# Ordering — ?ordering=
# ---------------------------------------------------------------------------

class TransportOrderingTest(BaseTransportAPITest):

    def setUp(self):
        super().setUp()
        _make_transport(
            plate_number='AAA-001', vehicle_type='car', brand='Alfa',
            model='Giulia', year=2019, capacity_kg='500.00', capacity_units=4,
        )
        _make_transport(
            plate_number='ZZZ-999', vehicle_type='truck', brand='Zenith',
            model='Heavy', year=2023, capacity_kg='20000.00', capacity_units=200,
        )
        _make_transport(
            plate_number='MMM-500', vehicle_type='van', brand='Medium',
            model='Cargo', year=2021, capacity_kg='3000.00', capacity_units=25,
        )

    def test_ordering_by_plate_number_ascending(self):
        response = self.client.get(f'{TRANSPORT_URL}?ordering=plate_number')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [r['plate_number'] for r in response.data['results']]
        self.assertEqual(plates, sorted(plates))

    def test_ordering_by_plate_number_descending(self):
        response = self.client.get(f'{TRANSPORT_URL}?ordering=-plate_number')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        plates = [r['plate_number'] for r in response.data['results']]
        self.assertEqual(plates, sorted(plates, reverse=True))

    def test_ordering_by_year_ascending(self):
        response = self.client.get(f'{TRANSPORT_URL}?ordering=year')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        years = [r['year'] for r in response.data['results']]
        self.assertEqual(years, sorted(years))

    def test_ordering_by_year_descending(self):
        response = self.client.get(f'{TRANSPORT_URL}?ordering=-year')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        years = [r['year'] for r in response.data['results']]
        self.assertEqual(years, sorted(years, reverse=True))

    def test_ordering_by_capacity_kg_ascending(self):
        response = self.client.get(f'{TRANSPORT_URL}?ordering=capacity_kg')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [float(r['capacity_kg']) for r in response.data['results']]
        self.assertEqual(capacities, sorted(capacities))

    def test_ordering_by_capacity_kg_descending(self):
        response = self.client.get(f'{TRANSPORT_URL}?ordering=-capacity_kg')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [float(r['capacity_kg']) for r in response.data['results']]
        self.assertEqual(capacities, sorted(capacities, reverse=True))

    def test_ordering_by_created_at_descending(self):
        response = self.client.get(f'{TRANSPORT_URL}?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))


# ---------------------------------------------------------------------------
# Serializer — DriverSummarySerializer name fallback
# ---------------------------------------------------------------------------

class TransportDriverNameFallbackTest(BaseTransportAPITest):
    """Verifica que DriverSummarySerializer usa username cuando no hay nombre completo."""

    def test_driver_name_falls_back_to_username_when_no_full_name(self):
        user = User.objects.create_user(
            username='sinNombre99',
            email='sinnombre@logistica.com',
            password='TestPass9!',
            # sin first_name ni last_name
        )
        driver = Driver.objects.create(
            user=user,
            license_number='LIC-SINNOMBRE',
            license_expiry='2027-01-01',
            phone='+57 300 000 0001',
        )
        _make_transport(
            plate_number='NOM-001',
            vehicle_type='car',
            brand='Renault',
            model='Sandero',
            year=2020,
            capacity_kg='600.00',
            capacity_units=5,
            driver=driver,
        )
        response = self.client.get(TRANSPORT_URL)
        result = next(r for r in response.data['results'] if r['plate_number'] == 'NOM-001')
        self.assertEqual(result['driver']['name'], 'sinNombre99')

    def test_driver_name_uses_full_name_when_available(self):
        user = User.objects.create_user(
            username='conNombre99',
            email='connombre@logistica.com',
            password='TestPass9!',
            first_name='María',
            last_name='González',
        )
        driver = Driver.objects.create(
            user=user,
            license_number='LIC-CONNOMBRE',
            license_expiry='2027-01-01',
            phone='+57 300 000 0002',
        )
        _make_transport(
            plate_number='NOM-002',
            vehicle_type='van',
            brand='Renault',
            model='Master',
            year=2021,
            capacity_kg='2000.00',
            capacity_units=18,
            driver=driver,
        )
        response = self.client.get(TRANSPORT_URL)
        result = next(r for r in response.data['results'] if r['plate_number'] == 'NOM-002')
        self.assertEqual(result['driver']['name'], 'María González')
