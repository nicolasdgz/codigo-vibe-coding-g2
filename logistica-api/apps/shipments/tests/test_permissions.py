"""
Tests para el permiso IsAdminGroup utilizado en ShipmentViewSet.
Solo superusuarios y usuarios del grupo 'admin' pueden acceder.
"""
from decimal import Decimal
from unittest.mock import MagicMock
from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.suppliers.models import Supplier
from apps.shipments.permissions import IsAdminGroup


SHIPMENTS_URL = '/api/v1/shipments/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_user(username, is_superuser=False, groups=None):
    if is_superuser:
        user = User.objects.create_superuser(
            username=username,
            email=f'{username}@logistica.com',
            password='TestPass9!',
        )
    else:
        user = User.objects.create_user(
            username=username,
            email=f'{username}@logistica.com',
            password='TestPass9!',
        )
    if groups:
        for group_name in groups:
            group, _ = Group.objects.get_or_create(name=group_name)
            user.groups.add(group)
    return user


def _auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def _make_base_data():
    warehouse = Warehouse.objects.create(
        name='Bodega Perm', address='Calle 1', city='Bogotá', country='Colombia', capacity=200,
    )
    customer = Customer.objects.create(
        name='Cliente Perm', email='perm@test.com', phone='+57 300 000 0000',
        address='Av. 1', customer_type='company',
    )
    return warehouse, customer


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso permitido
# ---------------------------------------------------------------------------

class ShipmentPermissionAllowedTest(APITestCase):
    """Usuarios que SI deben poder acceder al endpoint de envíos."""

    def setUp(self):
        self.warehouse, self.customer = _make_base_data()

    def test_superuser_can_list(self):
        user = _create_user('superuser_ship', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_create(self):
        user = _create_user('superuser_create', is_superuser=True)
        _auth_client(self.client, user)
        payload = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'Cra. 1',
            'destination_city': 'Bogotá',
            'destination_country': 'Colombia',
            'calculated_cost': '100.00',
        }
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_group_user_can_list(self):
        user = _create_user('admin_group_ship', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_create(self):
        user = _create_user('admin_group_create', groups=['admin'])
        _auth_client(self.client, user)
        payload = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'Calle 5',
            'destination_city': 'Medellín',
            'destination_country': 'Colombia',
            'calculated_cost': '200.00',
        }
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_in_multiple_groups_including_admin_can_access(self):
        user = _create_user('multigroup', groups=['admin', 'driver'])
        _auth_client(self.client, user)
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso denegado
# ---------------------------------------------------------------------------

class ShipmentPermissionDeniedTest(APITestCase):
    """Usuarios que NO deben poder acceder al endpoint de envíos."""

    def setUp(self):
        self.warehouse, self.customer = _make_base_data()

    def test_unauthenticated_list_returns_401(self):
        self.client.credentials()
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        self.client.credentials()
        payload = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'X', 'destination_city': 'X',
            'destination_country': 'X', 'calculated_cost': '1.00',
        }
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_groups_list_returns_403(self):
        user = _create_user('nogroup_ship')
        _auth_client(self.client, user)
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_create_returns_403(self):
        user = _create_user('nogroup_create')
        _auth_client(self.client, user)
        payload = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'X', 'destination_city': 'X',
            'destination_country': 'X', 'calculated_cost': '1.00',
        }
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_returns_403(self):
        user = _create_user('staffperm', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_list_returns_403(self):
        user = _create_user('driver_ship', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_create_returns_403(self):
        user = _create_user('driver_create', groups=['driver'])
        _auth_client(self.client, user)
        payload = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'X', 'destination_city': 'X',
            'destination_country': 'X', 'calculated_cost': '1.00',
        }
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_retrieve_returns_403(self):
        """Crear un envío con superuser y luego verificar que warehouse_staff no puede leerlo."""
        superuser = _create_user('super_create2', is_superuser=True)
        _auth_client(self.client, superuser)
        payload = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'Calle 10',
            'destination_city': 'Cali',
            'destination_country': 'Colombia',
            'calculated_cost': '50.00',
        }
        create_resp = self.client.post(SHIPMENTS_URL, payload, format='json')
        shipment_id = create_resp.data['id']

        staff_user = _create_user('staff_retrieve', groups=['warehouse_staff'])
        _auth_client(self.client, staff_user)
        response = self.client.get(f'{SHIPMENTS_URL}{shipment_id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# IsAdminGroup — lógica interna del permiso
# ---------------------------------------------------------------------------

class IsAdminGroupPermissionLogicTest(APITestCase):
    """Verifica la lógica interna de has_permission directamente."""

    def test_permission_allows_superuser(self):
        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = True
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_allows_admin_group_user(self):
        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = True

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_denies_unauthenticated(self):
        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = False
        request.user.is_superuser = False

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_denies_regular_user_without_groups(self):
        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_denies_none_user(self):
        permission = IsAdminGroup()
        request = MagicMock()
        request.user = None

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)
