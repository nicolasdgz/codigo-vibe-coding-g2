from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.warehouses.models import Warehouse


WAREHOUSES_URL = '/api/v1/warehouses/'


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


def _make_warehouse(**kwargs):
    defaults = {
        'name': 'Bodega Permisos',
        'address': 'Carrera 15 # 80-20',
        'city': 'Bogotá',
        'country': 'Colombia',
        'capacity': 400,
    }
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


# ---------------------------------------------------------------------------
# IsAdminOrWarehouseStaff — acceso permitido
# ---------------------------------------------------------------------------

class WarehousePermissionAllowedTest(APITestCase):
    """Usuarios que SÍ deben poder acceder al endpoint."""

    def setUp(self):
        self.warehouse = _make_warehouse()

    def test_superuser_can_list(self):
        user = _create_user('superusuario', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_create(self):
        user = _create_user('superusuario2', is_superuser=True)
        _auth_client(self.client, user)
        payload = {
            'name': 'Nueva Bodega', 'address': 'Calle 1', 'city': 'Cali',
            'country': 'Colombia', 'capacity': 200,
        }
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_superuser_can_delete(self):
        user = _create_user('superusuario3', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.delete(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_group_user_can_list(self):
        user = _create_user('adminusuario', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_create(self):
        user = _create_user('adminusuario2', groups=['admin'])
        _auth_client(self.client, user)
        payload = {
            'name': 'Bodega Admin', 'address': 'Av. 1', 'city': 'Bogotá',
            'country': 'Colombia', 'capacity': 100,
        }
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_warehouse_staff_group_user_can_list(self):
        user = _create_user('staffusuario', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_warehouse_staff_group_user_can_create(self):
        user = _create_user('staffusuario2', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        payload = {
            'name': 'Bodega Staff', 'address': 'Calle 5', 'city': 'Medellín',
            'country': 'Colombia', 'capacity': 300,
        }
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_warehouse_staff_can_retrieve(self):
        user = _create_user('staffusuario3', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_warehouse_staff_can_patch(self):
        user = _create_user('staffusuario4', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            {'capacity': 999},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_in_both_admin_and_warehouse_staff_groups_can_access(self):
        user = _create_user('doblegrupo', groups=['admin', 'warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# IsAdminOrWarehouseStaff — acceso denegado
# ---------------------------------------------------------------------------

class WarehousePermissionDeniedTest(APITestCase):
    """Usuarios que NO deben poder acceder al endpoint."""

    def setUp(self):
        self.warehouse = _make_warehouse()

    def test_unauthenticated_user_list_returns_401(self):
        self.client.credentials()
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_user_create_returns_401(self):
        self.client.credentials()
        payload = {
            'name': 'Bodega X', 'address': 'X', 'city': 'X', 'country': 'X', 'capacity': 1,
        }
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_groups_list_returns_403(self):
        """Usuario autenticado sin ningún grupo → 403."""
        user = _create_user('singrupo')
        _auth_client(self.client, user)
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_create_returns_403(self):
        user = _create_user('singrupo2')
        _auth_client(self.client, user)
        payload = {
            'name': 'Bodega Y', 'address': 'Y', 'city': 'Y', 'country': 'Y', 'capacity': 1,
        }
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_retrieve_returns_403(self):
        user = _create_user('singrupo3')
        _auth_client(self.client, user)
        response = self.client.get(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_patch_returns_403(self):
        user = _create_user('singrupo4')
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{WAREHOUSES_URL}{self.warehouse.pk}/',
            {'capacity': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_delete_returns_403(self):
        user = _create_user('singrupo5')
        _auth_client(self.client, user)
        response = self.client.delete(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_list_returns_403(self):
        """El grupo 'driver' no tiene permiso sobre warehouses."""
        user = _create_user('conductor', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(WAREHOUSES_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_create_returns_403(self):
        user = _create_user('conductor2', groups=['driver'])
        _auth_client(self.client, user)
        payload = {
            'name': 'Bodega Z', 'address': 'Z', 'city': 'Z', 'country': 'Z', 'capacity': 1,
        }
        response = self.client.post(WAREHOUSES_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_retrieve_returns_403(self):
        user = _create_user('conductor3', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(f'{WAREHOUSES_URL}{self.warehouse.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# IsAdminOrWarehouseStaff — lógica interna del permiso
# ---------------------------------------------------------------------------

class WarehousePermissionLogicTest(APITestCase):
    """Verifica la lógica interna de has_permission directamente."""

    def test_permission_allows_superuser(self):
        from apps.warehouses.permissions import IsAdminOrWarehouseStaff
        from unittest.mock import MagicMock

        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = True
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_allows_admin_group(self):
        from apps.warehouses.permissions import IsAdminOrWarehouseStaff
        from unittest.mock import MagicMock

        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = True

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_denies_unauthenticated(self):
        from apps.warehouses.permissions import IsAdminOrWarehouseStaff
        from unittest.mock import MagicMock

        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = False
        request.user.is_superuser = False

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_denies_regular_user_without_groups(self):
        from apps.warehouses.permissions import IsAdminOrWarehouseStaff
        from unittest.mock import MagicMock

        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)
