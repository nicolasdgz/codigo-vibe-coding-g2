from unittest.mock import MagicMock
from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.customers.models import Customer
from apps.customers.permissions import IsAdminGroup


CUSTOMERS_URL = '/api/v1/customers/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_user(username, is_superuser=False, groups=None):
    """Crea un usuario con grupos opcionales."""
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
    """Configura las credenciales JWT en el cliente."""
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def _make_customer(**kwargs):
    defaults = {
        'name': 'Empresa Permisos',
        'customer_type': 'company',
        'email': 'permisos@empresa.com',
        'phone': '+57 310 000 0001',
        'address': 'Calle 50 # 10-20, Bogotá',
    }
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso permitido
# ---------------------------------------------------------------------------

class CustomerPermissionAllowedTest(APITestCase):
    """Usuarios que SÍ deben poder acceder al endpoint de customers."""

    def setUp(self):
        self.customer = _make_customer()
        self.valid_payload = {
            'name': 'Nueva Empresa',
            'customer_type': 'company',
            'email': 'nueva@empresa.com',
            'phone': '+57 300 111 2222',
            'address': 'Av. Principal 100',
        }

    def test_superuser_can_list(self):
        user = _create_user('superusuario', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_create(self):
        user = _create_user('superusuario2', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_superuser_can_retrieve(self):
        user = _create_user('superusuario3', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_update(self):
        user = _create_user('superusuario4', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'name': 'Nombre Actualizado'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_delete(self):
        user = _create_user('superusuario5', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.delete(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_group_user_can_list(self):
        user = _create_user('adminusuario', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_create(self):
        user = _create_user('adminusuario2', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_group_user_can_retrieve(self):
        user = _create_user('adminusuario3', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_patch(self):
        user = _create_user('adminusuario4', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'phone': '+57 999 000 1111'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_delete(self):
        user = _create_user('adminusuario5', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.delete(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso denegado
# ---------------------------------------------------------------------------

class CustomerPermissionDeniedTest(APITestCase):
    """Usuarios que NO deben poder acceder al endpoint de customers."""

    def setUp(self):
        self.customer = _make_customer()
        self.valid_payload = {
            'name': 'Empresa Denegada',
            'customer_type': 'company',
            'email': 'denegada@empresa.com',
            'phone': '+57 300 000 9999',
            'address': 'Calle Denegada 1',
        }

    def test_unauthenticated_list_returns_401(self):
        self.client.credentials()
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        self.client.credentials()
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_groups_list_returns_403(self):
        """Usuario autenticado sin ningún grupo → 403."""
        user = _create_user('singrupo')
        _auth_client(self.client, user)
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_create_returns_403(self):
        user = _create_user('singrupo2')
        _auth_client(self.client, user)
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_retrieve_returns_403(self):
        user = _create_user('singrupo3')
        _auth_client(self.client, user)
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_patch_returns_403(self):
        user = _create_user('singrupo4')
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'name': 'No debería cambiar'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_delete_returns_403(self):
        user = _create_user('singrupo5')
        _auth_client(self.client, user)
        response = self.client.delete(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_list_returns_403(self):
        """El grupo 'warehouse_staff' no tiene permiso sobre customers."""
        user = _create_user('staffusuario', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_create_returns_403(self):
        user = _create_user('staffusuario2', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_list_returns_403(self):
        """El grupo 'driver' no tiene permiso sobre customers."""
        user = _create_user('conductor', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_create_returns_403(self):
        user = _create_user('conductor2', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_retrieve_returns_403(self):
        user = _create_user('conductor3', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# IsAdminGroup — lógica interna del permiso
# ---------------------------------------------------------------------------

class IsAdminGroupPermissionLogicTest(APITestCase):
    """Verifica la lógica interna de has_permission directamente con mocks."""

    def test_permission_allows_superuser(self):
        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = True
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_allows_admin_group_member(self):
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

    def test_permission_denies_when_user_is_none(self):
        permission = IsAdminGroup()
        request = MagicMock()
        request.user = None

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_filter_called_with_admin_group_name(self):
        """El permiso filtra específicamente por el grupo 'admin'."""
        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = True

        permission.has_permission(request, MagicMock())

        request.user.groups.filter.assert_called_once_with(name='admin')
