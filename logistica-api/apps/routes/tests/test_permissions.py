from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from unittest.mock import MagicMock
from apps.warehouses.models import Warehouse
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route
from apps.routes.permissions import IsAdminGroup


ROUTES_URL = '/api/v1/routes/'


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


def _make_warehouse():
    return Warehouse.objects.create(
        name='Bodega Permisos',
        address='Calle 50 # 30-10',
        city='Bogotá',
        country='Colombia',
        capacity=300,
    )


def _make_transport(plate='PRM-001'):
    user = User.objects.create_user(username=f'drv_{plate}', password='pass123')
    driver = Driver.objects.create(
        user=user,
        license_number=f'L-{plate}',
        license_expiry='2027-06-30',
        phone='+57 310 000 0000',
    )
    return Transport.objects.create(
        plate_number=plate,
        vehicle_type='van',
        brand='Ford',
        model='Transit',
        year=2021,
        capacity_kg='2500.00',
        capacity_units=50,
        driver=driver,
    )


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

    def test_permission_allows_admin_group(self):
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
        request.user = None

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_denies_unauthenticated_via_is_authenticated_false(self):
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


# ---------------------------------------------------------------------------
# IsAdminGroup via API — acceso permitido
# ---------------------------------------------------------------------------

class RoutePermissionAllowedTest(APITestCase):
    """Usuarios que SÍ deben poder acceder al endpoint de rutas."""

    def setUp(self):
        self.warehouse = _make_warehouse()
        self.transport = _make_transport()
        self.route = Route.objects.create(
            name='Ruta Permisos',
            origin_warehouse=self.warehouse,
            transport=self.transport,
            status='planned',
            scheduled_date='2026-06-01',
        )
        self.valid_payload = {
            'name': 'Ruta Nueva',
            'origin_warehouse': self.warehouse.id,
            'transport': self.transport.id,
            'status': 'planned',
            'scheduled_date': '2026-07-01',
        }

    def test_superuser_can_list(self):
        user = _create_user('superusr1', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_create(self):
        user = _create_user('superusr2', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.post(ROUTES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_superuser_can_retrieve(self):
        user = _create_user('superusr3', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_patch(self):
        user = _create_user('superusr4', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'status': 'in_progress'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_delete(self):
        user = _create_user('superusr5', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.delete(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_group_user_can_list(self):
        user = _create_user('adminusr1', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_create(self):
        user = _create_user('adminusr2', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.post(ROUTES_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_group_user_can_retrieve(self):
        user = _create_user('adminusr3', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_patch(self):
        user = _create_user('adminusr4', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'name': 'Ruta Admin'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_delete(self):
        user = _create_user('adminusr5', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.delete(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# IsAdminGroup via API — acceso denegado
# ---------------------------------------------------------------------------

class RoutePermissionDeniedTest(APITestCase):
    """Usuarios que NO deben poder acceder al endpoint de rutas."""

    def setUp(self):
        self.warehouse = _make_warehouse()
        transport = _make_transport(plate='PRM-002')
        self.route = Route.objects.create(
            name='Ruta Protegida',
            origin_warehouse=self.warehouse,
            transport=transport,
            status='planned',
            scheduled_date='2026-06-01',
        )

    def test_unauthenticated_list_returns_401(self):
        self.client.credentials()
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        self.client.credentials()
        response = self.client.post(ROUTES_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_groups_list_returns_403(self):
        user = _create_user('singrupo1')
        _auth_client(self.client, user)
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_create_returns_403(self):
        user = _create_user('singrupo2')
        _auth_client(self.client, user)
        response = self.client.post(ROUTES_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_retrieve_returns_403(self):
        user = _create_user('singrupo3')
        _auth_client(self.client, user)
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_patch_returns_403(self):
        user = _create_user('singrupo4')
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{ROUTES_URL}{self.route.pk}/', {'status': 'cancelled'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_delete_returns_403(self):
        user = _create_user('singrupo5')
        _auth_client(self.client, user)
        response = self.client.delete(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_list_returns_403(self):
        user = _create_user('conductor1', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_create_returns_403(self):
        user = _create_user('conductor2', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.post(ROUTES_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_retrieve_returns_403(self):
        user = _create_user('conductor3', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_list_returns_403(self):
        """warehouse_staff no tiene permiso sobre routes (solo IsAdminGroup)."""
        user = _create_user('staff1', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(ROUTES_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_create_returns_403(self):
        user = _create_user('staff2', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.post(ROUTES_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_retrieve_returns_403(self):
        user = _create_user('staff3', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(f'{ROUTES_URL}{self.route.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
