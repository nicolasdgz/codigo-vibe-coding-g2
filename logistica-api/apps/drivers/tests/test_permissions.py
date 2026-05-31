from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.drivers.models import Driver


DRIVERS_URL = '/api/v1/drivers/'


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
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def _make_driver(user, license_number='LIC-PERM-001'):
    return Driver.objects.create(
        user=user,
        license_number=license_number,
        license_expiry='2027-06-30',
        phone='+57 310 000 0001',
    )


def _valid_driver_payload(user):
    return {
        'user': user.id,
        'license_number': 'LIC-PERM-NEW',
        'license_expiry': '2028-01-01',
        'phone': '+57 315 000 0000',
    }


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso permitido
# ---------------------------------------------------------------------------

class DriverPermissionAllowedTest(APITestCase):
    """Usuarios que SÍ deben poder acceder al endpoint."""

    def setUp(self):
        self.driver_owner = _create_user('perm_owner')
        self.driver = _make_driver(self.driver_owner)

    def test_superuser_can_list(self):
        user = _create_user('perm_super', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_retrieve(self):
        user = _create_user('perm_super2', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_create(self):
        user = _create_user('perm_super3', is_superuser=True)
        _auth_client(self.client, user)
        free_user = _create_user('perm_free_super')
        payload = _valid_driver_payload(free_user)
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_superuser_can_patch(self):
        user = _create_user('perm_super4', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{DRIVERS_URL}{self.driver.pk}/',
            {'is_available': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_delete(self):
        user = _create_user('perm_super5', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.delete(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_group_user_can_list(self):
        user = _create_user('perm_admin', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_retrieve(self):
        user = _create_user('perm_admin2', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_create(self):
        user = _create_user('perm_admin3', groups=['admin'])
        _auth_client(self.client, user)
        free_user = _create_user('perm_free_admin')
        payload = _valid_driver_payload(free_user)
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_group_user_can_patch(self):
        user = _create_user('perm_admin4', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{DRIVERS_URL}{self.driver.pk}/',
            {'phone': '+57 300 123 9999'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_delete(self):
        user = _create_user('perm_admin5', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.delete(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso denegado
# ---------------------------------------------------------------------------

class DriverPermissionDeniedTest(APITestCase):
    """Usuarios que NO deben poder acceder al endpoint."""

    def setUp(self):
        owner = _create_user('deny_owner')
        self.driver = _make_driver(owner)

    def test_unauthenticated_list_returns_401(self):
        self.client.credentials()
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        self.client.credentials()
        free_user = _create_user('deny_free_unauth')
        payload = _valid_driver_payload(free_user)
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_groups_list_returns_403(self):
        user = _create_user('deny_no_group')
        _auth_client(self.client, user)
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_retrieve_returns_403(self):
        user = _create_user('deny_no_group2')
        _auth_client(self.client, user)
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_create_returns_403(self):
        user = _create_user('deny_no_group3')
        _auth_client(self.client, user)
        free_user = _create_user('deny_free_nogroup')
        payload = _valid_driver_payload(free_user)
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_patch_returns_403(self):
        user = _create_user('deny_no_group4')
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{DRIVERS_URL}{self.driver.pk}/',
            {'is_available': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_delete_returns_403(self):
        user = _create_user('deny_no_group5')
        _auth_client(self.client, user)
        response = self.client.delete(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_list_returns_403(self):
        """El grupo 'driver' no tiene acceso de escritura/gestión."""
        user = _create_user('deny_driver_grp', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_retrieve_returns_403(self):
        user = _create_user('deny_driver_grp2', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(f'{DRIVERS_URL}{self.driver.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_user_list_returns_403(self):
        """El grupo 'warehouse_staff' no tiene acceso a drivers."""
        user = _create_user('deny_wh_staff', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(DRIVERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_user_create_returns_403(self):
        user = _create_user('deny_wh_staff2', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        free_user = _create_user('deny_free_wh')
        payload = _valid_driver_payload(free_user)
        response = self.client.post(DRIVERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# IsAdminGroup — lógica interna del permiso (unit tests del objeto)
# ---------------------------------------------------------------------------

class IsAdminGroupPermissionLogicTest(APITestCase):
    """Verifica la lógica interna de has_permission directamente vía mock."""

    def test_permission_allows_superuser(self):
        from apps.drivers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        perm = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = True
        request.user.groups.filter.return_value.exists.return_value = False

        self.assertTrue(perm.has_permission(request, MagicMock()))

    def test_permission_allows_admin_group_member(self):
        from apps.drivers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        perm = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = True

        self.assertTrue(perm.has_permission(request, MagicMock()))

    def test_permission_denies_unauthenticated(self):
        from apps.drivers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        perm = IsAdminGroup()
        request = MagicMock()
        request.user = None

        self.assertFalse(perm.has_permission(request, MagicMock()))

    def test_permission_denies_regular_user_without_groups(self):
        from apps.drivers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        perm = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = False

        self.assertFalse(perm.has_permission(request, MagicMock()))

    def test_permission_denies_when_not_authenticated(self):
        from apps.drivers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        perm = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = False
        request.user.is_superuser = False

        self.assertFalse(perm.has_permission(request, MagicMock()))
