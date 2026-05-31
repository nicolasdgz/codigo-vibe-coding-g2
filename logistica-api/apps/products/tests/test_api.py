from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse
from apps.products.models import Product


PRODUCTS_URL = '/api/v1/products/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_superuser(username='admin_test'):
    return User.objects.create_superuser(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
    )


def _make_supplier(**kwargs):
    defaults = {
        'name': 'Tech Supplies S.A.',
        'email': 'contacto@techsupplies.com',
        'phone': '+57 310 000 0000',
        'address': 'Carrera 15 # 80-20',
        'tax_id': 'TS-900123456-1',
        'contact_name': 'Ana Gómez',
    }
    defaults.update(kwargs)
    return Supplier.objects.create(**defaults)


def _make_warehouse(**kwargs):
    defaults = {
        'name': 'Bodega Central',
        'address': 'Calle 100 # 15-20',
        'city': 'Bogotá',
        'country': 'Colombia',
        'capacity': 500,
    }
    defaults.update(kwargs)
    return Warehouse.objects.create(**defaults)


def _make_product(supplier, warehouse, **kwargs):
    defaults = {
        'name': 'Laptop Pro X1',
        'sku': 'LAP-PRO-X1',
        'weight_kg': '1.50',
        'unit_price': '2500000.00',
        'supplier': supplier,
        'warehouse': warehouse,
    }
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


class BaseProductAPITest(APITestCase):
    """Base con autenticación JWT de superuser lista."""

    def setUp(self):
        self.user = _make_superuser()
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.supplier = _make_supplier()
        self.warehouse = _make_warehouse()


# ---------------------------------------------------------------------------
# GET /api/v1/products/ — listar
# ---------------------------------------------------------------------------

class ProductListTest(BaseProductAPITest):

    def setUp(self):
        super().setUp()
        self.product = _make_product(self.supplier, self.warehouse)

    def test_list_returns_200(self):
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_has_pagination_structure(self):
        response = self.client.get(PRODUCTS_URL)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_list_includes_created_product(self):
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.data['count'], 1)

    def test_list_result_contains_expected_fields(self):
        response = self.client.get(PRODUCTS_URL)
        result = response.data['results'][0]
        for field in [
            'id', 'name', 'description', 'sku', 'weight_kg', 'dimensions',
            'unit_price', 'stock', 'supplier', 'warehouse', 'is_active',
            'created_at', 'updated_at',
        ]:
            self.assertIn(field, result)

    def test_list_supplier_is_nested_object(self):
        response = self.client.get(PRODUCTS_URL)
        result = response.data['results'][0]
        self.assertIn('id', result['supplier'])
        self.assertIn('name', result['supplier'])

    def test_list_warehouse_is_nested_object_with_city(self):
        response = self.client.get(PRODUCTS_URL)
        result = response.data['results'][0]
        self.assertIn('id', result['warehouse'])
        self.assertIn('name', result['warehouse'])
        self.assertIn('city', result['warehouse'])

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_when_no_products_exist(self):
        Product.objects.all().delete()
        response = self.client.get(PRODUCTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])


# ---------------------------------------------------------------------------
# POST /api/v1/products/ — crear
# ---------------------------------------------------------------------------

class ProductCreateTest(BaseProductAPITest):

    def setUp(self):
        super().setUp()
        self.valid_payload = {
            'name': 'Monitor 4K 27"',
            'sku': 'MON-4K-27',
            'weight_kg': '4.20',
            'unit_price': '1800000.00',
            'supplier': self.supplier.id,
            'warehouse': self.warehouse.id,
        }

    def test_create_valid_payload_returns_201(self):
        response = self.client.post(PRODUCTS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_response_contains_id(self):
        response = self.client.post(PRODUCTS_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)

    def test_create_response_reflects_payload(self):
        response = self.client.post(PRODUCTS_URL, self.valid_payload, format='json')
        self.assertEqual(response.data['name'], self.valid_payload['name'])
        self.assertEqual(response.data['sku'], self.valid_payload['sku'])

    def test_create_persists_to_database(self):
        self.client.post(PRODUCTS_URL, self.valid_payload, format='json')
        self.assertEqual(Product.objects.filter(sku='MON-4K-27').count(), 1)

    def test_create_with_optional_fields(self):
        payload = {
            **self.valid_payload,
            'description': 'Monitor para diseñadores gráficos con panel IPS',
            'dimensions': '61x36x22 cm',
            'stock': 15,
            'is_active': True,
        }
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['stock'], 15)

    def test_create_stock_defaults_to_zero(self):
        response = self.client.post(PRODUCTS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['stock'], 0)

    def test_create_is_active_defaults_to_true(self):
        response = self.client.post(PRODUCTS_URL, self.valid_payload, format='json')
        self.assertTrue(response.data['is_active'])

    def test_create_with_is_active_false(self):
        payload = {**self.valid_payload, 'is_active': False}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_active'])

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(PRODUCTS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_name_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_missing_sku_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'sku'}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)

    def test_create_missing_weight_kg_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'weight_kg'}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('weight_kg', response.data)

    def test_create_missing_unit_price_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'unit_price'}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('unit_price', response.data)

    def test_create_missing_supplier_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'supplier'}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('supplier', response.data)

    def test_create_missing_warehouse_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'warehouse'}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('warehouse', response.data)

    def test_create_empty_payload_returns_400(self):
        response = self.client.post(PRODUCTS_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_nonexistent_supplier_returns_400(self):
        payload = {**self.valid_payload, 'supplier': 99999}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_nonexistent_warehouse_returns_400(self):
        payload = {**self.valid_payload, 'warehouse': 99999}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_duplicate_sku_returns_400(self):
        _make_product(self.supplier, self.warehouse, sku='MON-4K-27')
        response = self.client.post(PRODUCTS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_read_only_fields_ignored(self):
        """id es read-only — el cliente no puede sobreescribirlo."""
        payload = {**self.valid_payload, 'id': 9999}
        response = self.client.post(PRODUCTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)


# ---------------------------------------------------------------------------
# GET /api/v1/products/{id}/ — detalle
# ---------------------------------------------------------------------------

class ProductRetrieveTest(BaseProductAPITest):

    def setUp(self):
        super().setUp()
        self.product = _make_product(
            self.supplier, self.warehouse,
            name='Webcam Full HD',
            sku='CAM-FHD-01',
            weight_kg='0.25',
            unit_price='280000.00',
        )

    def test_retrieve_existing_returns_200(self):
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_data(self):
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.data['name'], 'Webcam Full HD')
        self.assertEqual(response.data['sku'], 'CAM-FHD-01')

    def test_retrieve_supplier_is_nested(self):
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertIn('name', response.data['supplier'])

    def test_retrieve_warehouse_is_nested_with_city(self):
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertIn('name', response.data['warehouse'])
        self.assertIn('city', response.data['warehouse'])

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{PRODUCTS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PUT /api/v1/products/{id}/ — reemplazo completo
# ---------------------------------------------------------------------------

class ProductFullUpdateTest(BaseProductAPITest):

    def setUp(self):
        super().setUp()
        self.product = _make_product(
            self.supplier, self.warehouse,
            name='Mouse Inalámbrico',
            sku='MOU-WL-01',
        )
        self.full_payload = {
            'name': 'Mouse Ergonómico Pro',
            'sku': 'MOU-ERG-PRO',
            'weight_kg': '0.18',
            'unit_price': '120000.00',
            'supplier': self.supplier.id,
            'warehouse': self.warehouse.id,
        }

    def test_full_update_returns_200(self):
        response = self.client.put(
            f'{PRODUCTS_URL}{self.product.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_changes_fields(self):
        response = self.client.put(
            f'{PRODUCTS_URL}{self.product.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.data['name'], 'Mouse Ergonómico Pro')
        self.assertEqual(response.data['sku'], 'MOU-ERG-PRO')

    def test_full_update_persists_to_database(self):
        self.client.put(
            f'{PRODUCTS_URL}{self.product.pk}/',
            self.full_payload,
            format='json',
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Mouse Ergonómico Pro')

    def test_full_update_nonexistent_returns_404(self):
        response = self.client.put(
            f'{PRODUCTS_URL}99999/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_full_update_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.put(
            f'{PRODUCTS_URL}{self.product.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PATCH /api/v1/products/{id}/ — actualización parcial
# ---------------------------------------------------------------------------

class ProductPartialUpdateTest(BaseProductAPITest):

    def setUp(self):
        super().setUp()
        self.product = _make_product(
            self.supplier, self.warehouse,
            name='Teclado Mecánico',
            sku='TEC-MEC-01',
            stock=0,
        )

    def test_patch_single_field_returns_200(self):
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'stock': 50},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_only_specified_field(self):
        original_name = self.product.name
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'stock': 50},
            format='json',
        )
        self.assertEqual(response.data['stock'], 50)
        self.assertEqual(response.data['name'], original_name)

    def test_patch_is_active_to_false(self):
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'is_active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    def test_patch_unit_price(self):
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'unit_price': '950000.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_duplicate_sku_returns_400(self):
        _make_product(
            self.supplier, self.warehouse,
            sku='EXISTING-SKU', name='Otro Producto',
        )
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'sku': 'EXISTING-SKU'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_nonexistent_returns_404(self):
        response = self.client.patch(
            f'{PRODUCTS_URL}99999/',
            {'stock': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'stock': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_persists_change_to_database(self):
        self.client.patch(
            f'{PRODUCTS_URL}{self.product.pk}/',
            {'stock': 75},
            format='json',
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 75)


# ---------------------------------------------------------------------------
# DELETE /api/v1/products/{id}/ — eliminar
# ---------------------------------------------------------------------------

class ProductDeleteTest(BaseProductAPITest):

    def setUp(self):
        super().setUp()
        self.product = _make_product(
            self.supplier, self.warehouse,
            sku='DEL-PRD-01', name='Producto a Eliminar',
        )

    def test_delete_existing_returns_204(self):
        response = self.client.delete(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        pk = self.product.pk
        self.client.delete(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertFalse(Product.objects.filter(pk=pk).exists())

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(f'{PRODUCTS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_response_has_no_body(self):
        response = self.client.delete(f'{PRODUCTS_URL}{self.product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(response.content)


# ---------------------------------------------------------------------------
# Filtros — ?supplier= / ?warehouse= / ?is_active=
# ---------------------------------------------------------------------------

class ProductFilterTest(BaseProductAPITest):

    def setUp(self):
        super().setUp()
        self.supplier2 = _make_supplier(
            name='Electroimports Ltda.',
            email='ventas@electroimports.com',
            tax_id='EI-111222333-2',
        )
        self.warehouse2 = _make_warehouse(
            name='Bodega Norte',
            city='Medellín',
            address='Carrera 50 # 20-10',
        )
        self.product_a = _make_product(
            self.supplier, self.warehouse,
            sku='PROD-A', name='Laptop Gamer',
            is_active=True,
        )
        self.product_b = _make_product(
            self.supplier2, self.warehouse2,
            sku='PROD-B', name='Tablet Android',
            is_active=True,
        )
        self.product_c = _make_product(
            self.supplier, self.warehouse,
            sku='PROD-C', name='Adaptador USB-C',
            is_active=False,
        )

    def test_filter_by_supplier_returns_matching(self):
        response = self.client.get(f'{PRODUCTS_URL}?supplier={self.supplier.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_filter_by_supplier2_returns_one(self):
        response = self.client.get(f'{PRODUCTS_URL}?supplier={self.supplier2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_warehouse_returns_matching(self):
        response = self.client.get(f'{PRODUCTS_URL}?warehouse={self.warehouse.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_filter_by_warehouse2_returns_one(self):
        response = self.client.get(f'{PRODUCTS_URL}?warehouse={self.warehouse2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_is_active_true_returns_only_active(self):
        response = self.client.get(f'{PRODUCTS_URL}?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertTrue(result['is_active'])

    def test_filter_by_is_active_false_returns_only_inactive(self):
        response = self.client.get(f'{PRODUCTS_URL}?is_active=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertFalse(response.data['results'][0]['is_active'])

    def test_filter_by_nonexistent_supplier_id_returns_400(self):
        """django-filter valida que el PK exista en la FK — devuelve 400."""
        response = self.client.get(f'{PRODUCTS_URL}?supplier=99999')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_combined_filter_supplier_and_is_active(self):
        response = self.client.get(
            f'{PRODUCTS_URL}?supplier={self.supplier.id}&is_active=true'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)


# ---------------------------------------------------------------------------
# Búsqueda — ?search=
# ---------------------------------------------------------------------------

class ProductSearchTest(BaseProductAPITest):

    def setUp(self):
        super().setUp()
        _make_product(
            self.supplier, self.warehouse,
            sku='LAP-GAM-01', name='Laptop Gamer RGB',
            description='Procesador Intel i9 de última generación',
        )
        _make_product(
            self.supplier, self.warehouse,
            sku='MON-UHD-32', name='Monitor UHD 32"',
            description='Panel IPS sin bordes',
        )
        _make_product(
            self.supplier, self.warehouse,
            sku='SSD-M2-1T', name='SSD NVMe 1TB',
            description='Almacenamiento de alta velocidad',
        )

    def test_search_by_name_returns_matching(self):
        response = self.client.get(f'{PRODUCTS_URL}?search=Laptop')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_sku_returns_matching(self):
        response = self.client.get(f'{PRODUCTS_URL}?search=LAP-GAM-01')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_description_returns_matching(self):
        response = self.client.get(f'{PRODUCTS_URL}?search=Intel')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_no_match_returns_empty(self):
        response = self.client.get(f'{PRODUCTS_URL}?search=TerminoInexistente99999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_search_partial_sku_returns_matching(self):
        response = self.client.get(f'{PRODUCTS_URL}?search=SSD')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)


# ---------------------------------------------------------------------------
# Ordering — ?ordering=
# ---------------------------------------------------------------------------

class ProductOrderingTest(BaseProductAPITest):

    def setUp(self):
        super().setUp()
        _make_product(
            self.supplier, self.warehouse,
            sku='SKU-ALFA', name='Alfa Producto',
            unit_price='100000.00', stock=10,
        )
        _make_product(
            self.supplier, self.warehouse,
            sku='SKU-BETA', name='Beta Producto',
            unit_price='500000.00', stock=50,
        )
        _make_product(
            self.supplier, self.warehouse,
            sku='SKU-GAMMA', name='Gamma Producto',
            unit_price='250000.00', stock=25,
        )

    def test_ordering_by_name_ascending(self):
        response = self.client.get(f'{PRODUCTS_URL}?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        response = self.client.get(f'{PRODUCTS_URL}?ordering=-name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_sku_ascending(self):
        response = self.client.get(f'{PRODUCTS_URL}?ordering=sku')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [r['sku'] for r in response.data['results']]
        self.assertEqual(skus, sorted(skus))

    def test_ordering_by_unit_price_ascending(self):
        response = self.client.get(f'{PRODUCTS_URL}?ordering=unit_price')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prices = [float(r['unit_price']) for r in response.data['results']]
        self.assertEqual(prices, sorted(prices))

    def test_ordering_by_unit_price_descending(self):
        response = self.client.get(f'{PRODUCTS_URL}?ordering=-unit_price')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prices = [float(r['unit_price']) for r in response.data['results']]
        self.assertEqual(prices, sorted(prices, reverse=True))

    def test_ordering_by_stock_ascending(self):
        response = self.client.get(f'{PRODUCTS_URL}?ordering=stock')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stocks = [r['stock'] for r in response.data['results']]
        self.assertEqual(stocks, sorted(stocks))

    def test_ordering_by_created_at_descending(self):
        response = self.client.get(f'{PRODUCTS_URL}?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))
