from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.suppliers.models import Supplier


SUPPLIERS_URL = '/api/v1/suppliers/'


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


def _make_supplier(**kwargs):
    defaults = {
        'name': 'Tech Supplies S.A.',
        'email': 'contacto@techsupplies.com',
        'phone': '+57 310 000 0000',
        'address': 'Carrera 15 # 80-20, Bogotá',
        'tax_id': '900123456-1',
        'contact_name': 'Ana Gómez',
    }
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso permitido
# ---------------------------------------------------------------------------

class SupplierPermissionAllowedTest(APITestCase):
    """Usuarios que SI deben poder acceder al endpoint."""

    def setUp(self):
        self.supplier = _make_supplier()
        self.create_payload = {
            'name': 'Nuevo Proveedor',
            'email': 'nuevo@proveedor.com',
            'phone': '+57 300 000 0000',
            'address': 'Calle 1 # 2-3',
            'tax_id': 'NEW-TAX-001',
            'contact_name': 'Nuevo Contacto',
        }

    def test_superuser_can_list(self):
        user = _create_user('superusuario', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_create(self):
        user = _create_user('superusuario2', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.post(SUPPLIERS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_superuser_can_retrieve(self):
        user = _create_user('superusuario3', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_patch(self):
        user = _create_user('superusuario4', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'contact_name': 'Actualizado'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_delete(self):
        user = _create_user('superusuario5', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.delete(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_group_user_can_list(self):
        user = _create_user('adminusuario', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_create(self):
        user = _create_user('adminusuario2', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.post(SUPPLIERS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_group_user_can_retrieve(self):
        user = _create_user('adminusuario3', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_patch(self):
        user = _create_user('adminusuario4', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'contact_name': 'Nuevo'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_delete(self):
        user = _create_user('adminusuario5', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.delete(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# IsAdminGroup — acceso denegado
# ---------------------------------------------------------------------------

class SupplierPermissionDeniedTest(APITestCase):
    """Usuarios que NO deben poder acceder al endpoint."""

    def setUp(self):
        self.supplier = _make_supplier()
        self.create_payload = {
            'name': 'Proveedor X',
            'email': 'x@x.com',
            'phone': '+57 300 000 0000',
            'address': 'Calle X',
            'tax_id': 'TAX-X-001',
            'contact_name': 'X',
        }

    def test_unauthenticated_list_returns_401(self):
        self.client.credentials()
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        self.client.credentials()
        response = self.client.post(SUPPLIERS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_groups_list_returns_403(self):
        """Usuario autenticado sin ningun grupo → 403."""
        user = _create_user('singrupo')
        _auth_client(self.client, user)
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_create_returns_403(self):
        user = _create_user('singrupo2')
        _auth_client(self.client, user)
        response = self.client.post(SUPPLIERS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_retrieve_returns_403(self):
        user = _create_user('singrupo3')
        _auth_client(self.client, user)
        response = self.client.get(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_patch_returns_403(self):
        user = _create_user('singrupo4')
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'contact_name': 'x'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_delete_returns_403(self):
        user = _create_user('singrupo5')
        _auth_client(self.client, user)
        response = self.client.delete(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_list_returns_403(self):
        """El grupo 'driver' no tiene permiso sobre suppliers."""
        user = _create_user('conductor', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_create_returns_403(self):
        user = _create_user('conductor2', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.post(SUPPLIERS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_user_retrieve_returns_403(self):
        user = _create_user('conductor3', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_list_returns_403(self):
        """El grupo 'warehouse_staff' no tiene permiso sobre suppliers (solo admin)."""
        user = _create_user('staffuser', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_create_returns_403(self):
        user = _create_user('staffuser2', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.post(SUPPLIERS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_warehouse_staff_group_retrieve_returns_403(self):
        user = _create_user('staffuser3', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# IsAdminGroup — lógica interna del permiso
# ---------------------------------------------------------------------------

class SupplierPermissionLogicTest(APITestCase):
    """Verifica la logica interna de has_permission directamente."""

    def test_permission_allows_superuser(self):
        from apps.suppliers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = True
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_allows_admin_group(self):
        from apps.suppliers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = True

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_denies_unauthenticated(self):
        from apps.suppliers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = False
        request.user.is_superuser = False

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_denies_regular_user_without_groups(self):
        from apps.suppliers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        permission = IsAdminGroup()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_denies_none_user(self):
        from apps.suppliers.permissions import IsAdminGroup
        from unittest.mock import MagicMock

        permission = IsAdminGroup()
        request = MagicMock()
        request.user = None

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)
