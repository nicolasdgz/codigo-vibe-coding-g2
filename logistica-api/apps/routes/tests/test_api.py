from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.warehouses.models import Warehouse
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route, RouteStop


ROUTES_URL = '/api/v1/routes/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_admin_user(username='admin_user'):
    return User.objects.create_superuser(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
    )


def _auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def _make_warehouse(name='Bodega Central', city='Bogotá'):
    return Warehouse.objects.create(
        name=name,
        address='Calle 100 # 15-20',
        city=city,
        country='Colombia',
        capacity=500,
    )


def _make_transport(plate='TRK-001'):
    user = User.objects.create_user(username=f'driver_{plate}', password='pass123')
    driver = Driver.objects.create(
        user=user,
        license_number=f'LIC-{plate}',
        license_expiry='2027-12-31',
        phone='+57 300 000 0001',
    )
    return Transport.objects.create(
        plate_number=plate,
        vehicle_type='truck',
        brand='Kenworth',
        model='T680',
        year=2022,
        capacity_kg='15000.00',
        capacity_units=100,
        driver=driver,
    )


def _make_route(warehouse, transport, name='Ruta Norte', status='planned',
                scheduled_date='2026-06-01'):
    return Route.objects.create(
        name=name,
        origin_warehouse=warehouse,
        transport=transport,
        status=status,
        scheduled_date=scheduled_date,
    )


# ---------------------------------------------------------------------------
# Base con autenticación JWT de admin lista
# ---------------------------------------------------------------------------

class BaseRouteAPITest(APITestCase):

    def setUp(self):
        self.admin = _make_admin_user()
        _auth_client(self.client, self.admin)
        self.warehouse = _make_warehouse()
        self.transport = _make_transport()
        self.route = _make_route(self.warehouse, self.transport)


# ---------------------------------------------------------------------------
# GET /api/v1/routes/ — listar
# ---------------------------------------------------------------------------

class RouteListTest(BaseRouteAPITest):

    def test_list_returns_200(self):
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_has_pagination_structure(self):
        response = self.client.get(ROUTES_URL)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_list_includes_created_route(self):
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.data['count'], 1)

    def test_list_result_contains_expected_fields(self):
        response = self.client.get(ROUTES_URL)
        result = response.data['results'][0]
        for field in ['id', 'name', 'origin_warehouse', 'transport', 'status',
                      'scheduled_date', 'stops', 'created_at', 'updated_at']:
            self.assertIn(field, result)

    def test_list_origin_warehouse_is_nested_object(self):
        response = self.client.get(ROUTES_URL)
        result = response.data['results'][0]
        self.assertIsInstance(result['origin_warehouse'], dict)
        self.assertIn('name', result['origin_warehouse'])

    def test_list_transport_is_nested_object(self):
        response = self.client.get(ROUTES_URL)
        result = response.data['results'][0]
        self.assertIsInstance(result['transport'], dict)
        self.assertIn('plate_number', result['transport'])

    def test_list_stops_is_list(self):
        response = self.client.get(ROUTES_URL)
        result = response.data['results'][0]
        self.assertIsInstance(result['stops'], list)

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_when_no_routes(self):
        Route.objects.all().delete()
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])

    def test_list_multiple_routes(self):
        transport2 = _make_transport(plate='TRK-002')
        _make_route(self.warehouse, transport2, name='Ruta Sur')
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.data['count'], 2)


# ---------------------------------------------------------------------------
# POST /api/v1/routes/ — crear
# ---------------------------------------------------------------------------

class RouteCreateTest(BaseRouteAPITest):

    def setUp(self):
        super().setUp()
        self.valid_payload = {
            'name': 'Ruta Sur',
            'origin_warehouse': self.warehouse.id,
            'transport': self.transport.id,
            'status': 'planned',
            'scheduled_date': '2026-07-01',
        }

    def test_create_valid_payload_returns_201(self):
        response = self.client.post(ROUTES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_response_contains_id(self):
        response = self.client.post(ROUTES_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)

    def test_create_response_reflects_payload(self):
        response = self.client.post(ROUTES_URL, self.valid_payload, format='json')
        self.assertEqual(response.data['name'], 'Ruta Sur')
        self.assertEqual(response.data['status'], 'planned')
        self.assertEqual(response.data['scheduled_date'], '2026-07-01')

    def test_create_persists_to_database(self):
        self.client.post(ROUTES_URL, self.valid_payload, format='json')
        self.assertEqual(Route.objects.filter(name='Ruta Sur').count(), 1)

    def test_create_default_status_planned(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'status'}
        response = self.client.post(ROUTES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'planned')

    def test_create_with_in_progress_status(self):
        payload = {**self.valid_payload, 'status': 'in_progress'}
        response = self.client.post(ROUTES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'in_progress')

    def test_create_missing_name_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(ROUTES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_missing_origin_warehouse_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'origin_warehouse'}
        response = self.client.post(ROUTES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('origin_warehouse', response.data)

    def test_create_missing_transport_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'transport'}
        response = self.client.post(ROUTES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('transport', response.data)

    def test_create_missing_scheduled_date_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'scheduled_date'}
        response = self.client.post(ROUTES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('scheduled_date', response.data)

    def test_create_empty_payload_returns_400(self):
        response = self.client.post(ROUTES_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_warehouse_fk_returns_400(self):
        payload = {**self.valid_payload, 'origin_warehouse': 99999}
        response = self.client.post(ROUTES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_transport_fk_returns_400(self):
        payload = {**self.valid_payload, 'transport': 99999}
        response = self.client.post(ROUTES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(ROUTES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_read_only_fields_ignored(self):
        payload = {**self.valid_payload, 'id': 9999}
        response = self.client.post(ROUTES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)


# ---------------------------------------------------------------------------
# GET /api/v1/routes/{id}/ — detalle
# ---------------------------------------------------------------------------

class RouteRetrieveTest(BaseRouteAPITest):

    def setUp(self):
        super().setUp()
        self.stop = RouteStop.objects.create(
            route=self.route, order=1, address='Av. Principal 1', city='Medellín',
        )

    def test_retrieve_existing_returns_200(self):
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_name(self):
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.data['name'], 'Ruta Norte')

    def test_retrieve_includes_stops(self):
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertIn('stops', response.data)
        self.assertEqual(len(response.data['stops']), 1)

    def test_retrieve_stop_has_expected_fields(self):
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        stop_data = response.data['stops'][0]
        for field in ['id', 'order', 'address', 'city', 'estimated_arrival', 'actual_arrival']:
            self.assertIn(field, stop_data)

    def test_retrieve_origin_warehouse_nested(self):
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertIsInstance(response.data['origin_warehouse'], dict)
        self.assertEqual(response.data['origin_warehouse']['name'], 'Bodega Central')

    def test_retrieve_transport_nested(self):
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertIsInstance(response.data['transport'], dict)
        self.assertEqual(response.data['transport']['plate_number'], 'TRK-001')

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{ROUTES_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PUT /api/v1/routes/{id}/ — reemplazo completo
# ---------------------------------------------------------------------------

class RouteFullUpdateTest(BaseRouteAPITest):

    def setUp(self):
        super().setUp()
        self.full_payload = {
            'name': 'Ruta Norte Modificada',
            'origin_warehouse': self.warehouse.id,
            'transport': self.transport.id,
            'status': 'in_progress',
            'scheduled_date': '2026-08-15',
        }

    def test_full_update_returns_200(self):
        response = self.client.put(
            f'{ROUTES_URL}{self.route.pk}/', self.full_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_changes_name(self):
        response = self.client.put(
            f'{ROUTES_URL}{self.route.pk}/', self.full_payload, format='json',
        )
        self.assertEqual(response.data['name'], 'Ruta Norte Modificada')

    def test_full_update_changes_status(self):
        response = self.client.put(
            f'{ROUTES_URL}{self.route.pk}/', self.full_payload, format='json',
        )
        self.assertEqual(response.data['status'], 'in_progress')

    def test_full_update_changes_scheduled_date(self):
        response = self.client.put(
            f'{ROUTES_URL}{self.route.pk}/', self.full_payload, format='json',
        )
        self.assertEqual(response.data['scheduled_date'], '2026-08-15')

    def test_full_update_persists_to_database(self):
        self.client.put(f'{ROUTES_URL}{self.route.pk}/', self.full_payload, format='json')
        self.route.refresh_from_db()
        self.assertEqual(self.route.name, 'Ruta Norte Modificada')
        self.assertEqual(self.route.status, 'in_progress')

    def test_full_update_nonexistent_returns_404(self):
        response = self.client.put(
            f'{ROUTES_URL}99999/', self.full_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_full_update_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.put(
            f'{ROUTES_URL}{self.route.pk}/', self.full_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_full_update_missing_required_field_returns_400(self):
        payload = {k: v for k, v in self.full_payload.items() if k != 'name'}
        response = self.client.put(f'{ROUTES_URL}{self.route.pk}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# PATCH /api/v1/routes/{id}/ — actualización parcial
# ---------------------------------------------------------------------------

class RoutePartialUpdateTest(BaseRouteAPITest):

    def test_patch_name_returns_200(self):
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'name': 'Ruta Renombrada'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Ruta Renombrada')

    def test_patch_status_returns_200(self):
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'status': 'in_progress'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_progress')

    def test_patch_status_to_completed(self):
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'status': 'completed'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'completed')

    def test_patch_status_to_cancelled(self):
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'status': 'cancelled'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelled')

    def test_patch_scheduled_date(self):
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'scheduled_date': '2026-09-30'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['scheduled_date'], '2026-09-30')

    def test_patch_updates_only_specified_field(self):
        original_status = self.route.status
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'name': 'Solo Nombre'}, format='json',
        )
        self.assertEqual(response.data['name'], 'Solo Nombre')
        self.assertEqual(response.data['status'], original_status)

    def test_patch_persists_to_database(self):
        self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'status': 'completed'}, format='json',
        )
        self.route.refresh_from_db()
        self.assertEqual(self.route.status, 'completed')

    def test_patch_nonexistent_returns_404(self):
        response = self.client.patch(
            f'{ROUTES_URL}99999/', {'status': 'cancelled'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'status': 'cancelled'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_transport_to_another_valid_transport(self):
        transport2 = _make_transport(plate='TRK-099')
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'transport': transport2.id}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_invalid_transport_fk_returns_400(self):
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'transport': 99999}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# DELETE /api/v1/routes/{id}/ — eliminar
# ---------------------------------------------------------------------------

class RouteDeleteTest(BaseRouteAPITest):

    def test_delete_existing_returns_204(self):
        response = self.client.delete(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        pk = self.route.pk
        self.client.delete(f'{ROUTES_URL}{self.route.pk}/')
        self.assertFalse(Route.objects.filter(pk=pk).exists())

    def test_delete_cascades_stops(self):
        RouteStop.objects.create(route=self.route, order=1, address='Dir A', city='Bogotá')
        RouteStop.objects.create(route=self.route, order=2, address='Dir B', city='Cali')
        route_id = self.route.pk
        self.client.delete(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(RouteStop.objects.filter(route_id=route_id).count(), 0)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(f'{ROUTES_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_response_has_no_body(self):
        response = self.client.delete(f'{ROUTES_URL}{self.route.pk}/')
        self.assertFalse(response.content)


# ---------------------------------------------------------------------------
# Filtros — ?status= / ?transport= / ?origin_warehouse=
# ---------------------------------------------------------------------------

class RouteFilterTest(BaseRouteAPITest):

    def setUp(self):
        super().setUp()
        transport2 = _make_transport(plate='TRK-002')
        warehouse2 = _make_warehouse(name='Bodega Sur', city='Cali')
        self.route_ip = _make_route(
            self.warehouse, transport2, name='Ruta En Progreso', status='in_progress',
        )
        self.route_other_wh = _make_route(
            warehouse2, self.transport, name='Ruta Otra Bodega', status='completed',
        )

    def test_filter_by_status_planned(self):
        response = self.client.get(f'{ROUTES_URL}?status=planned')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['status'], 'planned')

    def test_filter_by_status_in_progress(self):
        response = self.client.get(f'{ROUTES_URL}?status=in_progress')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Ruta En Progreso')

    def test_filter_by_status_completed(self):
        response = self.client.get(f'{ROUTES_URL}?status=completed')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_status_invalid_value_returns_400(self):
        """django-filter valida choices: un valor inválido retorna 400."""
        response = self.client.get(f'{ROUTES_URL}?status=nonexistent')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_transport_returns_correct_routes(self):
        response = self.client.get(f'{ROUTES_URL}?transport={self.transport.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['transport']['id'], self.transport.id)

    def test_filter_by_origin_warehouse(self):
        response = self.client.get(f'{ROUTES_URL}?origin_warehouse={self.warehouse.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['origin_warehouse']['id'], self.warehouse.id)

    def test_filter_by_transport_invalid_id_returns_400(self):
        """django-filter valida FK: un ID que no existe retorna 400."""
        response = self.client.get(f'{ROUTES_URL}?transport=99999')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Búsqueda — ?search=
# ---------------------------------------------------------------------------

class RouteSearchTest(BaseRouteAPITest):

    def setUp(self):
        super().setUp()
        transport2 = _make_transport(plate='TRK-003')
        _make_route(self.warehouse, transport2, name='Ruta Costa Caribe')

    def test_search_by_name_returns_matching(self):
        response = self.client.get(f'{ROUTES_URL}?search=Norte')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Ruta Norte')

    def test_search_by_partial_name(self):
        response = self.client.get(f'{ROUTES_URL}?search=Costa')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_search_no_match_returns_empty(self):
        response = self.client.get(f'{ROUTES_URL}?search=TerminoQueNoExiste12345')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_search_case_insensitive(self):
        response = self.client.get(f'{ROUTES_URL}?search=norte')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)


# ---------------------------------------------------------------------------
# Ordering — ?ordering=
# ---------------------------------------------------------------------------

class RouteOrderingTest(BaseRouteAPITest):

    def setUp(self):
        super().setUp()
        transport2 = _make_transport(plate='TRK-004')
        transport3 = _make_transport(plate='TRK-005')
        _make_route(
            self.warehouse, transport2, name='Ruta Alpha', scheduled_date='2026-05-01',
        )
        _make_route(
            self.warehouse, transport3, name='Ruta Zeta', scheduled_date='2026-09-01',
        )

    def test_ordering_by_scheduled_date_ascending(self):
        response = self.client.get(f'{ROUTES_URL}?ordering=scheduled_date')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['scheduled_date'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_scheduled_date_descending(self):
        response = self.client.get(f'{ROUTES_URL}?ordering=-scheduled_date')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['scheduled_date'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))

    def test_ordering_by_created_at_descending(self):
        response = self.client.get(f'{ROUTES_URL}?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        created_dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(created_dates, sorted(created_dates, reverse=True))

    def test_ordering_by_status(self):
        response = self.client.get(f'{ROUTES_URL}?ordering=status')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        statuses = [r['status'] for r in response.data['results']]
        self.assertEqual(statuses, sorted(statuses))
