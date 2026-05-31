from unittest.mock import MagicMock
from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.transport.models import Transport
from apps.transport.permissions import IsAdminGroup


TRANSPORT_URL = '/api/v1/transport/'


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


def _auth(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


def _make_transport(**kwargs):
    defaults = {
        'plate_number': 'PRM-001',
        'vehicle_type': 'truck',
        'brand': 'Kenworth',
        'model': 'T680',
        'year': 2022,
        'capacity_kg': '15000.00',
        'capacity_units': 100,
    }
    defaults.update(kwargs)
    return Transport.objects.create(**defaults)


# ---------------------------------------------------------------------------
# IsAdminGroup — lógica interna del permiso
# ---------------------------------------------------------------------------

class IsAdminGroupPermissionLogicTest(APITestCase):
    """Verifica has_permission directamente sin pasar por la vista."""

    def _make_request(self, is_authenticated=True, is_superuser=False, group_exists=False):
        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = is_authenticated
        request.user.is_superuser = is_superuser
        request.user.groups.filter.return_value.exists.return_value = group_exists
        return permission, request

    def test_allows_superuser(self):
        permission, request = self._make_request(is_superuser=True)
        self.assertTrue(permission.has_permission(request, MagicMock()))

    def test_allows_user_in_admin_group(self):
        permission, request = self._make_request(is_superuser=False, group_exists=True)
        self.assertTrue(permission.has_permission(request, MagicMock()))

    def test_denies_unauthenticated_user(self):
        permission, request = self._make_request(is_authenticated=False)
        self.assertFalse(permission.has_permission(request, MagicMock()))

    def test_denies_regular_user_without_groups(self):
        permission, request = self._make_request(is_superuser=False, group_exists=False)
        self.assertFalse(permission.has_permission(request, MagicMock()))

    def test_denies_when_user_is_none(self):
        permission = IsAdminGroup()
        request = MagicMock()
        request.user = None
        self.assertFalse(permission.has_permission(request, MagicMock()))


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso permitido via HTTP
# ---------------------------------------------------------------------------

class TransportPermissionAllowedTest(APITestCase):
    """Usuarios que SÍ deben poder acceder al endpoint /api/v1/transport/."""

    def setUp(self):
        self.transport = _make_transport()

    def test_superuser_can_list(self):
        user = _create_user('super1', is_superuser=True)
        _auth(self.client, user)
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_create(self):
        user = _create_user('super2', is_superuser=True)
        _auth(self.client, user)
        payload = {
            'plate_number': 'SUP-CRT',
            'vehicle_type': 'van',
            'brand': 'Ford',
            'model': 'Transit',
            'year': 2021,
            'capacity_kg': '2000.00',
            'capacity_units': 15,
        }
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_superuser_can_retrieve(self):
        user = _create_user('super3', is_superuser=True)
        _auth(self.client, user)
        response = self.client.get(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_patch(self):
        user = _create_user('super4', is_superuser=True)
        _auth(self.client, user)
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'year': 2024},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_delete(self):
        user = _create_user('super5', is_superuser=True)
        _auth(self.client, user)
        response = self.client.delete(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_group_user_can_list(self):
        user = _create_user('admin_usr1', groups=['admin'])
        _auth(self.client, user)
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_create(self):
        user = _create_user('admin_usr2', groups=['admin'])
        _auth(self.client, user)
        payload = {
            'plate_number': 'ADM-CRT',
            'vehicle_type': 'truck',
            'brand': 'Volvo',
            'model': 'FH',
            'year': 2022,
            'capacity_kg': '18000.00',
            'capacity_units': 130,
        }
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_group_user_can_retrieve(self):
        user = _create_user('admin_usr3', groups=['admin'])
        _auth(self.client, user)
        response = self.client.get(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_patch(self):
        user = _create_user('admin_usr4', groups=['admin'])
        _auth(self.client, user)
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'brand': 'NuevaMarca'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_delete(self):
        transport2 = _make_transport(plate_number='DEL-ADM')
        user = _create_user('admin_usr5', groups=['admin'])
        _auth(self.client, user)
        response = self.client.delete(f'{TRANSPORT_URL}{transport2.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso denegado via HTTP
# ---------------------------------------------------------------------------

class TransportPermissionDeniedTest(APITestCase):
    """Usuarios que NO deben poder acceder al endpoint /api/v1/transport/."""

    def setUp(self):
        self.transport = _make_transport()

    def test_unauthenticated_list_returns_401(self):
        self.client.credentials()
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        self.client.credentials()
        payload = {
            'plate_number': 'UNAUTH-1',
            'vehicle_type': 'van',
            'brand': 'X',
            'model': 'Y',
            'year': 2020,
            'capacity_kg': '1000.00',
            'capacity_units': 10,
        }
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_groups_list_returns_403(self):
        user = _create_user('singrupo1')
        _auth(self.client, user)
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_create_returns_403(self):
        user = _create_user('singrupo2')
        _auth(self.client, user)
        payload = {
            'plate_number': 'NOGRP-1',
            'vehicle_type': 'car',
            'brand': 'X',
            'model': 'Y',
            'year': 2020,
            'capacity_kg': '500.00',
            'capacity_units': 4,
        }
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_retrieve_returns_403(self):
        user = _create_user('singrupo3')
        _auth(self.client, user)
        response = self.client.get(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_patch_returns_403(self):
        user = _create_user('singrupo4')
        _auth(self.client, user)
        response = self.client.patch(
            f'{TRANSPORT_URL}{self.transport.pk}/',
            {'year': 2020},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_delete_returns_403(self):
        user = _create_user('singrupo5')
        _auth(self.client, user)
        response = self.client.delete(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_returns_403(self):
        """warehouse_staff no tiene acceso a transport (solo admin group)."""
        user = _create_user('wh_staff1', groups=['warehouse_staff'])
        _auth(self.client, user)
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_list_returns_403(self):
        """El grupo 'driver' no tiene acceso a transport."""
        user = _create_user('conductor1', groups=['driver'])
        _auth(self.client, user)
        response = self.client.get(TRANSPORT_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_create_returns_403(self):
        user = _create_user('conductor2', groups=['driver'])
        _auth(self.client, user)
        payload = {
            'plate_number': 'DRV-001',
            'vehicle_type': 'motorcycle',
            'brand': 'Honda',
            'model': 'CB',
            'year': 2021,
            'capacity_kg': '150.00',
            'capacity_units': 2,
        }
        response = self.client.post(TRANSPORT_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_retrieve_returns_403(self):
        user = _create_user('conductor3', groups=['driver'])
        _auth(self.client, user)
        response = self.client.get(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_delete_returns_403(self):
        user = _create_user('conductor4', groups=['driver'])
        _auth(self.client, user)
        response = self.client.delete(f'{TRANSPORT_URL}{self.transport.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
