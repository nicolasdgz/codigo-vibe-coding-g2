"""
Tests para las @actions de stops anidados en RouteViewSet:
  GET    /api/v1/routes/{id}/stops/
  POST   /api/v1/routes/{id}/stops/
  PATCH  /api/v1/routes/{id}/stops/{stop_id}/
  DELETE /api/v1/routes/{id}/stops/{stop_id}/
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.warehouses.models import Warehouse
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route, RouteStop


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_admin(username='admin_stops'):
    return User.objects.create_superuser(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
    )


def _auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def _make_warehouse(name='Bodega Stops', city='Bogotá'):
    return Warehouse.objects.create(
        name=name,
        address='Carrera 50 # 10-20',
        city=city,
        country='Colombia',
        capacity=400,
    )


def _make_transport(plate='STP-001'):
    user = User.objects.create_user(username=f'drv_{plate}', password='pass123')
    driver = Driver.objects.create(
        user=user,
        license_number=f'LIC-{plate}',
        license_expiry='2027-12-31',
        phone='+57 315 000 0000',
    )
    return Transport.objects.create(
        plate_number=plate,
        vehicle_type='truck',
        brand='Mercedes',
        model='Actros',
        year=2023,
        capacity_kg='20000.00',
        capacity_units=150,
        driver=driver,
    )


def _make_route(warehouse, transport, name='Ruta Stops'):
    return Route.objects.create(
        name=name,
        origin_warehouse=warehouse,
        transport=transport,
        status='planned',
        scheduled_date='2026-06-15',
    )


def _stops_url(route_id):
    return f'/api/v1/routes/{route_id}/stops/'


def _stop_detail_url(route_id, stop_id):
    return f'/api/v1/routes/{route_id}/stops/{stop_id}/'


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class BaseStopsTest(APITestCase):

    def setUp(self):
        self.admin = _make_admin()
        _auth_client(self.client, self.admin)
        self.warehouse = _make_warehouse()
        self.transport = _make_transport()
        self.route = _make_route(self.warehouse, self.transport)
        self.stop = RouteStop.objects.create(
            route=self.route,
            order=1,
            address='Av. El Dorado # 68-10',
            city='Bogotá',
        )


# ---------------------------------------------------------------------------
# GET /api/v1/routes/{id}/stops/ — listar paradas
# ---------------------------------------------------------------------------

class StopsListTest(BaseStopsTest):

    def test_list_stops_returns_200(self):
        response = self.client.get(_stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_stops_returns_list(self):
        response = self.client.get(_stops_url(self.route.pk))
        self.assertIsInstance(response.data, list)

    def test_list_stops_count(self):
        RouteStop.objects.create(
            route=self.route, order=2, address='Calle 80 # 20-10', city='Medellín',
        )
        response = self.client.get(_stops_url(self.route.pk))
        self.assertEqual(len(response.data), 2)

    def test_list_stops_contains_expected_fields(self):
        response = self.client.get(_stops_url(self.route.pk))
        stop_data = response.data[0]
        for field in ['id', 'order', 'address', 'city', 'estimated_arrival', 'actual_arrival']:
            self.assertIn(field, stop_data)

    def test_list_stops_ordered_by_order_field(self):
        RouteStop.objects.create(
            route=self.route, order=3, address='Dir C', city='Cali',
        )
        RouteStop.objects.create(
            route=self.route, order=2, address='Dir B', city='Barranquilla',
        )
        response = self.client.get(_stops_url(self.route.pk))
        orders = [s['order'] for s in response.data]
        self.assertEqual(orders, sorted(orders))

    def test_list_stops_shows_city_correctly(self):
        response = self.client.get(_stops_url(self.route.pk))
        self.assertEqual(response.data[0]['city'], 'Bogotá')

    def test_list_stops_route_not_found_returns_404(self):
        response = self.client.get(_stops_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_stops_empty_route_returns_empty_list(self):
        transport2 = _make_transport(plate='STP-002')
        empty_route = _make_route(self.warehouse, transport2, name='Ruta Sin Paradas')
        response = self.client.get(_stops_url(empty_route.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_stops_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(_stops_url(self.route.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_stops_only_shows_stops_of_requested_route(self):
        transport2 = _make_transport(plate='STP-003')
        other_route = _make_route(self.warehouse, transport2, name='Otra Ruta')
        RouteStop.objects.create(
            route=other_route, order=1, address='Dir Otra', city='Pereira',
        )
        response = self.client.get(_stops_url(self.route.pk))
        for stop in response.data:
            self.assertNotEqual(stop['city'], 'Pereira')


# ---------------------------------------------------------------------------
# POST /api/v1/routes/{id}/stops/ — crear parada
# ---------------------------------------------------------------------------

class StopsCreateTest(BaseStopsTest):

    def setUp(self):
        super().setUp()
        self.valid_payload = {
            'order': 2,
            'address': 'Carrera 10 # 20-30',
            'city': 'Cali',
        }

    def test_create_stop_returns_201(self):
        response = self.client.post(
            _stops_url(self.route.pk), self.valid_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_stop_response_contains_id(self):
        response = self.client.post(
            _stops_url(self.route.pk), self.valid_payload, format='json',
        )
        self.assertIn('id', response.data)

    def test_create_stop_response_reflects_payload(self):
        response = self.client.post(
            _stops_url(self.route.pk), self.valid_payload, format='json',
        )
        self.assertEqual(response.data['city'], 'Cali')
        self.assertEqual(response.data['order'], 2)
        self.assertEqual(response.data['address'], 'Carrera 10 # 20-30')

    def test_create_stop_persists_to_database(self):
        self.client.post(_stops_url(self.route.pk), self.valid_payload, format='json')
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 2)

    def test_create_stop_with_estimated_arrival(self):
        payload = {**self.valid_payload, 'estimated_arrival': '2026-06-15T10:00:00Z'}
        response = self.client.post(_stops_url(self.route.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['estimated_arrival'])

    def test_create_stop_with_actual_arrival(self):
        payload = {
            **self.valid_payload,
            'estimated_arrival': '2026-06-15T10:00:00Z',
            'actual_arrival': '2026-06-15T10:30:00Z',
        }
        response = self.client.post(_stops_url(self.route.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['actual_arrival'])

    def test_create_stop_without_arrivals_returns_201(self):
        """estimated_arrival y actual_arrival son opcionales."""
        payload = {'order': 3, 'address': 'Terminal Norte', 'city': 'Manizales'}
        response = self.client.post(_stops_url(self.route.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['estimated_arrival'])
        self.assertIsNone(response.data['actual_arrival'])

    def test_create_stop_missing_order_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'order'}
        response = self.client.post(_stops_url(self.route.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('order', response.data)

    def test_create_stop_missing_address_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'address'}
        response = self.client.post(_stops_url(self.route.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('address', response.data)

    def test_create_stop_missing_city_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'city'}
        response = self.client.post(_stops_url(self.route.pk), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('city', response.data)

    def test_create_stop_empty_payload_returns_400(self):
        response = self.client.post(_stops_url(self.route.pk), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_route_not_found_returns_404(self):
        response = self.client.post(_stops_url(99999), self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_stop_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(
            _stops_url(self.route.pk), self.valid_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_stop_associated_to_correct_route(self):
        response = self.client.post(
            _stops_url(self.route.pk), self.valid_payload, format='json',
        )
        stop_id = response.data['id']
        stop = RouteStop.objects.get(pk=stop_id)
        self.assertEqual(stop.route, self.route)


# ---------------------------------------------------------------------------
# PATCH /api/v1/routes/{id}/stops/{stop_id}/ — actualizar parada
# ---------------------------------------------------------------------------

class StopDetailPatchTest(BaseStopsTest):

    def test_patch_city_returns_200(self):
        response = self.client.patch(
            _stop_detail_url(self.route.pk, self.stop.pk),
            {'city': 'Barranquilla'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Barranquilla')

    def test_patch_address_returns_200(self):
        response = self.client.patch(
            _stop_detail_url(self.route.pk, self.stop.pk),
            {'address': 'Nueva Dirección 999'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['address'], 'Nueva Dirección 999')

    def test_patch_order_returns_200(self):
        response = self.client.patch(
            _stop_detail_url(self.route.pk, self.stop.pk),
            {'order': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['order'], 5)

    def test_patch_estimated_arrival_returns_200(self):
        response = self.client.patch(
            _stop_detail_url(self.route.pk, self.stop.pk),
            {'estimated_arrival': '2026-06-15T14:00:00Z'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['estimated_arrival'])

    def test_patch_actual_arrival_returns_200(self):
        response = self.client.patch(
            _stop_detail_url(self.route.pk, self.stop.pk),
            {'actual_arrival': '2026-06-15T14:45:00Z'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['actual_arrival'])

    def test_patch_updates_only_specified_field(self):
        original_order = self.stop.order
        response = self.client.patch(
            _stop_detail_url(self.route.pk, self.stop.pk),
            {'city': 'Manizales'},
            format='json',
        )
        self.assertEqual(response.data['city'], 'Manizales')
        self.assertEqual(response.data['order'], original_order)

    def test_patch_persists_to_database(self):
        self.client.patch(
            _stop_detail_url(self.route.pk, self.stop.pk),
            {'city': 'Cartagena'},
            format='json',
        )
        self.stop.refresh_from_db()
        self.assertEqual(self.stop.city, 'Cartagena')

    def test_patch_stop_not_found_returns_404(self):
        response = self.client.patch(
            _stop_detail_url(self.route.pk, 99999),
            {'city': 'Pereira'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_route_not_found_returns_404(self):
        response = self.client.patch(
            _stop_detail_url(99999, self.stop.pk),
            {'city': 'Pereira'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_stop_belongs_to_different_route_returns_404(self):
        """Stop de otra ruta no debe ser accesible vía esta ruta."""
        transport2 = _make_transport(plate='STP-010')
        other_route = _make_route(self.warehouse, transport2, name='Otra Ruta Patch')
        other_stop = RouteStop.objects.create(
            route=other_route, order=1, address='Dir Otra', city='Ibagué',
        )
        response = self.client.patch(
            _stop_detail_url(self.route.pk, other_stop.pk),
            {'city': 'Pasto'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            _stop_detail_url(self.route.pk, self.stop.pk),
            {'city': 'Cúcuta'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_response_contains_all_stop_fields(self):
        response = self.client.patch(
            _stop_detail_url(self.route.pk, self.stop.pk),
            {'city': 'Villavicencio'},
            format='json',
        )
        for field in ['id', 'order', 'address', 'city', 'estimated_arrival', 'actual_arrival']:
            self.assertIn(field, response.data)


# ---------------------------------------------------------------------------
# DELETE /api/v1/routes/{id}/stops/{stop_id}/ — eliminar parada
# ---------------------------------------------------------------------------

class StopDetailDeleteTest(BaseStopsTest):

    def test_delete_stop_returns_204(self):
        response = self.client.delete(
            _stop_detail_url(self.route.pk, self.stop.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_stop_removes_from_database(self):
        stop_pk = self.stop.pk
        self.client.delete(_stop_detail_url(self.route.pk, self.stop.pk))
        self.assertFalse(RouteStop.objects.filter(pk=stop_pk).exists())

    def test_delete_stop_response_has_no_body(self):
        response = self.client.delete(
            _stop_detail_url(self.route.pk, self.stop.pk),
        )
        self.assertFalse(response.content)

    def test_delete_stop_not_found_returns_404(self):
        response = self.client.delete(
            _stop_detail_url(self.route.pk, 99999),
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_route_not_found_returns_404(self):
        response = self.client.delete(
            _stop_detail_url(99999, self.stop.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_stop_belongs_to_different_route_returns_404(self):
        transport2 = _make_transport(plate='STP-020')
        other_route = _make_route(self.warehouse, transport2, name='Otra Ruta Delete')
        other_stop = RouteStop.objects.create(
            route=other_route, order=1, address='Dir Ajena', city='Neiva',
        )
        response = self.client.delete(
            _stop_detail_url(self.route.pk, other_stop.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(RouteStop.objects.filter(pk=other_stop.pk).exists())

    def test_delete_one_stop_does_not_affect_others(self):
        stop2 = RouteStop.objects.create(
            route=self.route, order=2, address='Dir B', city='Bucaramanga',
        )
        self.client.delete(_stop_detail_url(self.route.pk, self.stop.pk))
        self.assertTrue(RouteStop.objects.filter(pk=stop2.pk).exists())
        self.assertEqual(self.route.stops.count(), 1)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(
            _stop_detail_url(self.route.pk, self.stop.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
