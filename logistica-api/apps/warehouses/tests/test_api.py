from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.warehouses.models import Warehouse


WAREHOUSES_URL = '/api/v1/warehouses/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(username='bodeguero', is_superuser=True, **kwargs):
    if is_superuser:
        return User.objects.create_superuser(
            username=username,
            email=f'{username}@logistica.com',
            password='TestPass9!',
            **kwargs,
        )
    return User.objects.create_user(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
        **kwargs,
    )


def _make_warehouse(**kwargs):
    defaults = {
        'name': 'Bodega Central',
        'address': 'Calle 100 # 15-20',
        'city': 'Bogotá',
        'country': 'Colombia',
        'capacity': 500,
    }
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


class BaseWarehouseAPITest(APITestCase):
    """Base con autenticación JWT de superuser lista."""

    def setUp(self):
        self.user = _make_user()
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


# ---------------------------------------------------------------------------
# GET /api/v1/warehouses/ — listar
# ---------------------------------------------------------------------------

class WarehouseListTest(BaseWarehouseAPITest):

    def setUp(self):
        super().setUp()
        self.warehouse = _make_warehouse()

    def test_list_returns_200(self):
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_has_pagination_structure(self):
        response = self.client.get(WAREHOUSES_URL)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_list_includes_created_warehouse(self):
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.data['count'], 1)

    def test_list_result_contains_expected_fields(self):
        response = self.client.get(WAREHOUSES_URL)
        result = response.data['results'][0]
        for field in ['id', 'name', 'address', 'city', 'country',
                      'latitude', 'longitude', 'capacity', 'is_active',
                      'created_at', 'updated_at']:
            self.assertIn(field, result)

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_when_no_warehouses(self):
        Warehouse.objects.all().delete()
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])


# ---------------------------------------------------------------------------
# POST /api/v1/warehouses/ — crear
# ---------------------------------------------------------------------------

class WarehouseCreateTest(BaseWarehouseAPITest):

    def setUp(self):
        super().setUp()
        self.valid_payload = {
            'name': 'Bodega Norte',
            'address': 'Carrera 30 # 10-5',
            'city': 'Medellín',
            'country': 'Colombia',
            'capacity': 300,
        }

    def test_create_valid_payload_returns_201(self):
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_response_contains_id(self):
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)

    def test_create_response_reflects_payload(self):
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(response.data['name'], self.valid_payload['name'])
        self.assertEqual(response.data['city'], self.valid_payload['city'])
        self.assertEqual(response.data['capacity'], self.valid_payload['capacity'])

    def test_create_persists_to_database(self):
        self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(Warehouse.objects.filter(name='Bodega Norte').count(), 1)

    def test_create_with_coordinates_returns_201(self):
        payload = {**self.valid_payload, 'latitude': '6.244203', 'longitude': '-75.581211'}
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['latitude'])
        self.assertIsNotNone(response.data['longitude'])

    def test_create_is_active_defaults_to_true(self):
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertTrue(response.data['is_active'])

    def test_create_with_is_active_false(self):
        payload = {**self.valid_payload, 'is_active': False}
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_active'])

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(WAREHOUSES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_name_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_missing_address_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'address'}
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('address', response.data)

    def test_create_missing_city_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'city'}
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('city', response.data)

    def test_create_missing_country_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'country'}
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('country', response.data)

    def test_create_missing_capacity_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'capacity'}
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity', response.data)

    def test_create_empty_payload_returns_400(self):
        response = self.client.post(WAREHOUSES_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_negative_capacity_returns_400(self):
        """PositiveIntegerField no acepta valores negativos."""
        payload = {**self.valid_payload, 'capacity': -10}
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_read_only_fields_ignored(self):
        """id, created_at, updated_at son read-only — el cliente no puede sobreescribirlos."""
        payload = {**self.valid_payload, 'id': 9999, 'created_at': '2020-01-01T00:00:00Z'}
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)


# ---------------------------------------------------------------------------
# GET /api/v1/warehouses/{id}/ — detalle
# ---------------------------------------------------------------------------

class WarehouseRetrieveTest(BaseWarehouseAPITest):

    def setUp(self):
        super().setUp()
        self.warehouse = _make_warehouse(
            name='Bodega Sur',
            address='Avenida 68 # 50-12',
            city='Cali',
            country='Colombia',
            capacity=400,
        )

    def test_retrieve_existing_returns_200(self):
        response = self.client.get(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_data(self):
        response = self.client.get(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.data['name'], 'Bodega Sur')
        self.assertEqual(response.data['city'], 'Cali')
        self.assertEqual(response.data['capacity'], 400)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{WAREHOUSES_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PUT /api/v1/warehouses/{id}/ — reemplazo completo
# ---------------------------------------------------------------------------

class WarehouseUpdateTest(BaseWarehouseAPITest):

    def setUp(self):
        super().setUp()
        self.warehouse = _make_warehouse(name='Bodega Original', city='Bogotá', capacity=200)
        self.full_payload = {
            'name': 'Bodega Modificada',
            'address': 'Nueva Dirección 123',
            'city': 'Pereira',
            'country': 'Colombia',
            'capacity': 800,
        }

    def test_full_update_returns_200(self):
        response = self.client.put(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_changes_all_fields(self):
        response = self.client.put(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.data['name'], 'Bodega Modificada')
        self.assertEqual(response.data['city'], 'Pereira')
        self.assertEqual(response.data['capacity'], 800)

    def test_full_update_persists_to_database(self):
        self.client.put(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            self.full_payload,
            format='json',
        )
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Bodega Modificada')

    def test_full_update_nonexistent_returns_404(self):
        response = self.client.put(f'{WAREHOUSES_URL}99999/', self.full_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_full_update_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.put(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PATCH /api/v1/warehouses/{id}/ — actualización parcial
# ---------------------------------------------------------------------------

class WarehousePartialUpdateTest(BaseWarehouseAPITest):

    def setUp(self):
        super().setUp()
        self.warehouse = _make_warehouse(
            name='Bodega Existente', city='Barranquilla', capacity=600,
        )

    def test_patch_single_field_returns_200(self):
        response = self.client.patch(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            {'capacity': 999},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_only_specified_field(self):
        original_name = self.warehouse.name
        response = self.client.patch(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            {'capacity': 999},
            format='json',
        )
        self.assertEqual(response.data['capacity'], 999)
        self.assertEqual(response.data['name'], original_name)

    def test_patch_is_active_to_false(self):
        response = self.client.patch(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            {'is_active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    def test_patch_coordinates(self):
        response = self.client.patch(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            {'latitude': '10.963889', 'longitude': '-74.796387'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['latitude'])
        self.assertIsNotNone(response.data['longitude'])

    def test_patch_nonexistent_returns_404(self):
        response = self.client.patch(f'{WAREHOUSES_URL}99999/', {'capacity': 1}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            {'capacity': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_negative_capacity_returns_400(self):
        response = self.client.patch(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            {'capacity': -5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# DELETE /api/v1/warehouses/{id}/ — eliminar
# ---------------------------------------------------------------------------

class WarehouseDeleteTest(BaseWarehouseAPITest):

    def setUp(self):
        super().setUp()
        self.warehouse = _make_warehouse(name='Bodega a Eliminar', city='Manizales')

    def test_delete_existing_returns_204(self):
        response = self.client.delete(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        pk = self.warehouse.pk
        self.client.delete(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertFalse(Warehouse.objects.filter(pk=pk).exists())

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(f'{WAREHOUSES_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_response_has_no_body(self):
        response = self.client.delete(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(response.content)


# ---------------------------------------------------------------------------
# Filtros — ?city= / ?country= / ?is_active=
# ---------------------------------------------------------------------------

class WarehouseFilterTest(BaseWarehouseAPITest):

    def setUp(self):
        super().setUp()
        self.bogota = _make_warehouse(name='Bodega Bogotá', city='Bogotá', country='Colombia')
        self.medellin = _make_warehouse(name='Bodega Medellín', city='Medellín', country='Colombia')
        self.lima = _make_warehouse(name='Bodega Lima', city='Lima', country='Perú')
        self.inactiva = _make_warehouse(
            name='Bodega Inactiva', city='Cali', country='Colombia', is_active=False,
        )

    def test_filter_by_city_returns_matching(self):
        response = self.client.get(f'{WAREHOUSES_URL}?city=Bogotá')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['city'], 'Bogotá')

    def test_filter_by_city_returns_empty_for_nonexistent(self):
        response = self.client.get(f'{WAREHOUSES_URL}?city=Caracas')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_filter_by_country_returns_matching(self):
        response = self.client.get(f'{WAREHOUSES_URL}?country=Perú')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['city'], 'Lima')

    def test_filter_by_country_colombia_returns_three(self):
        response = self.client.get(f'{WAREHOUSES_URL}?country=Colombia')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_filter_by_is_active_true(self):
        response = self.client.get(f'{WAREHOUSES_URL}?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertTrue(result['is_active'])

    def test_filter_by_is_active_false(self):
        response = self.client.get(f'{WAREHOUSES_URL}?is_active=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertFalse(response.data['results'][0]['is_active'])

    def test_filter_city_and_country_combined(self):
        response = self.client.get(f'{WAREHOUSES_URL}?city=Medellín&country=Colombia')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)


# ---------------------------------------------------------------------------
# Búsqueda — ?search=
# ---------------------------------------------------------------------------

class WarehouseSearchTest(BaseWarehouseAPITest):

    def setUp(self):
        super().setUp()
        _make_warehouse(name='Bodega Central Norte', address='Calle 72 # 10-20', city='Bogotá')
        _make_warehouse(name='Bodega Secundaria', address='Avenida El Dorado', city='Bogotá')
        _make_warehouse(name='Almacén Sur', address='Calle 80 # 30-10', city='Cali')

    def test_search_by_name_returns_matching(self):
        response = self.client.get(f'{WAREHOUSES_URL}?search=Central')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)
        for result in response.data['results']:
            name_match = 'Central' in result['name']
            city_match = 'Central' in result['city']
            address_match = 'Central' in result['address']
            self.assertTrue(name_match or city_match or address_match)

    def test_search_by_city_returns_matching(self):
        response = self.client.get(f'{WAREHOUSES_URL}?search=Cali')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_address_keyword(self):
        response = self.client.get(f'{WAREHOUSES_URL}?search=Dorado')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_no_match_returns_empty(self):
        response = self.client.get(f'{WAREHOUSES_URL}?search=TerminoInexistente12345')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)


# ---------------------------------------------------------------------------
# Ordering — ?ordering=
# ---------------------------------------------------------------------------

class WarehouseOrderingTest(BaseWarehouseAPITest):

    def setUp(self):
        super().setUp()
        _make_warehouse(name='Alfa', city='Bogotá', capacity=100)
        _make_warehouse(name='Beta', city='Cali', capacity=500)
        _make_warehouse(name='Gamma', city='Medellín', capacity=300)

    def test_ordering_by_name_ascending(self):
        response = self.client.get(f'{WAREHOUSES_URL}?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        response = self.client.get(f'{WAREHOUSES_URL}?ordering=-name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_capacity_ascending(self):
        response = self.client.get(f'{WAREHOUSES_URL}?ordering=capacity')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [r['capacity'] for r in response.data['results']]
        self.assertEqual(capacities, sorted(capacities))

    def test_ordering_by_capacity_descending(self):
        response = self.client.get(f'{WAREHOUSES_URL}?ordering=-capacity')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        capacities = [r['capacity'] for r in response.data['results']]
        self.assertEqual(capacities, sorted(capacities, reverse=True))

    def test_ordering_by_city(self):
        response = self.client.get(f'{WAREHOUSES_URL}?ordering=city')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cities = [r['city'] for r in response.data['results']]
        self.assertEqual(cities, sorted(cities))

    def test_ordering_by_created_at_descending(self):
        response = self.client.get(f'{WAREHOUSES_URL}?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))
