from unittest.mock import MagicMock
from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse
from apps.products.models import Product
from apps.products.permissions import IsAdminOrWarehouseStaff


PRODUCTS_URL = '/api/v1/products/'


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
        'name': 'Proveedor Permisos',
        'email': 'perm@prov.com',
        'phone': '+57 300 000 0000',
        'address': 'Calle 1',
        'tax_id': 'PP-123456-1',
        'contact_name': 'Contacto Test',
    }
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


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


def _make_product(supplier, warehouse, **kwargs):
    defaults = {
        'name': 'Producto Permisos',
        'sku': 'PERM-PROD-001',
        'weight_kg': '1.00',
        'unit_price': '100000.00',
        'supplier': supplier,
        'warehouse': warehouse,
    }
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


# ---------------------------------------------------------------------------
# IsAdminOrWarehouseStaff — acceso permitido
# ---------------------------------------------------------------------------

class ProductPermissionAllowedTest(APITestCase):
    """Usuarios que SÍ deben poder acceder al endpoint de products."""

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()
        self.product = _make_product(self.supplier, self.warehouse)
        self.create_payload = {
            'name': 'Nuevo Producto',
            'sku': 'NEW-PROD-001',
            'weight_kg': '0.50',
            'unit_price': '50000.00',
            'supplier': self.supplier.id,
            'warehouse': self.warehouse.id,
        }

    def test_superuser_can_list(self):
        user = _create_user('superusuario', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_create(self):
        user = _create_user('superusuario2', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.post(PRODUCTS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_superuser_can_retrieve(self):
        user = _create_user('superusuario3', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_delete(self):
        user = _create_user('superusuario4', is_superuser=True)
        _auth_client(self.client, user)
        response = self.client.delete(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_group_user_can_list(self):
        user = _create_user('admin_user', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_create(self):
        user = _create_user('admin_user2', groups=['admin'])
        _auth_client(self.client, user)
        payload = {**self.create_payload, 'sku': 'ADM-PROD-002'}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_group_user_can_retrieve(self):
        user = _create_user('admin_user3', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_group_user_can_patch(self):
        user = _create_user('admin_user4', groups=['admin'])
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'stock': 100},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_warehouse_staff_can_list(self):
        user = _create_user('staff_user', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_warehouse_staff_can_create(self):
        user = _create_user('staff_user2', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        payload = {**self.create_payload, 'sku': 'STF-PROD-003'}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_warehouse_staff_can_retrieve(self):
        user = _create_user('staff_user3', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_warehouse_staff_can_patch(self):
        user = _create_user('staff_user4', groups=['warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'stock': 50},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_in_both_groups_can_access(self):
        user = _create_user('doble_grupo', groups=['admin', 'warehouse_staff'])
        _auth_client(self.client, user)
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# IsAdminOrWarehouseStaff — acceso denegado
# ---------------------------------------------------------------------------

class ProductPermissionDeniedTest(APITestCase):
    """Usuarios que NO deben poder acceder al endpoint de products."""

    def setUp(self):
        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()
        self.product = _make_product(self.supplier, self.warehouse)
        self.create_payload = {
            'name': 'Producto No Autorizado',
            'sku': 'UNAUTH-001',
            'weight_kg': '0.50',
            'unit_price': '50000.00',
            'supplier': self.supplier.id,
            'warehouse': self.warehouse.id,
        }

    def test_unauthenticated_list_returns_401(self):
        self.client.credentials()
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        self.client.credentials()
        response = self.client.post(PRODUCTS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_groups_list_returns_403(self):
        """Usuario autenticado sin ningún grupo → 403."""
        user = _create_user('sin_grupo')
        _auth_client(self.client, user)
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_create_returns_403(self):
        user = _create_user('sin_grupo2')
        _auth_client(self.client, user)
        response = self.client.post(PRODUCTS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_retrieve_returns_403(self):
        user = _create_user('sin_grupo3')
        _auth_client(self.client, user)
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_patch_returns_403(self):
        user = _create_user('sin_grupo4')
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'stock': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_groups_delete_returns_403(self):
        user = _create_user('sin_grupo5')
        _auth_client(self.client, user)
        response = self.client.delete(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_list_returns_403(self):
        """El grupo 'driver' no tiene permiso sobre products."""
        user = _create_user('conductor', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_create_returns_403(self):
        user = _create_user('conductor2', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.post(PRODUCTS_URL, self.create_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_retrieve_returns_403(self):
        user = _create_user('conductor3', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_driver_group_patch_returns_403(self):
        user = _create_user('conductor4', groups=['driver'])
        _auth_client(self.client, user)
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'stock': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# IsAdminOrWarehouseStaff — lógica interna del permiso (unit tests)
# ---------------------------------------------------------------------------

class ProductPermissionLogicTest(APITestCase):
    """Verifica la lógica interna de has_permission directamente."""

    def test_permission_allows_superuser(self):
        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = True
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_allows_admin_group(self):
        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = True

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_allows_warehouse_staff_group(self):
        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = True

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)

    def test_permission_denies_unauthenticated(self):
        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = False
        request.user.is_superuser = False

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_denies_regular_user_without_groups(self):
        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = False
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_denies_when_user_is_none(self):
        """Caso extremo: request.user es None o falsy."""
        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user = None

        result = permission.has_permission(request, MagicMock())
        self.assertFalse(result)

    def test_permission_superuser_bypasses_group_check(self):
        """Superuser → True sin importar los grupos."""
        permission = IsAdminOrWarehouseStaff()
        request = MagicMock()
        request.user.is_authenticated = True
        request.user.is_superuser = True
        # El filtro de grupos NO debería llamarse
        request.user.groups.filter.return_value.exists.return_value = False

        result = permission.has_permission(request, MagicMock())
        self.assertTrue(result)
        # Verificar que no se evaluaron los grupos (superuser salió antes)
        request.user.groups.filter.assert_not_called()
