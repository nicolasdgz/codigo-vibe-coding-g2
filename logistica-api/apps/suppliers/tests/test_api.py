from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.suppliers.models import Supplier


SUPPLIERS_URL = '/api/v1/suppliers/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(username='admin_user', is_superuser=True, **kwargs):
    if is_superuser:
        return User.objects.create_superuser(
            username=username,
            email=f'{username}@logistica.com',
            password='TestPass9!',
            **kwargs,
        )
    return User.objects.create_user(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
        **kwargs,
    )


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


class BaseSupplierAPITest(APITestCase):
    """Base con autenticación JWT de superuser lista."""

    def setUp(self):
        self.user = _make_user()
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


# ---------------------------------------------------------------------------
# GET /api/v1/suppliers/ — listar
# ---------------------------------------------------------------------------

class SupplierListTest(BaseSupplierAPITest):

    def setUp(self):
        super().setUp()
        self.supplier = _make_supplier()

    def test_list_returns_200(self):
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_has_pagination_structure(self):
        response = self.client.get(SUPPLIERS_URL)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_list_includes_created_supplier(self):
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.data['count'], 1)

    def test_list_result_contains_expected_fields(self):
        response = self.client.get(SUPPLIERS_URL)
        result = response.data['results'][0]
        for field in ['id', 'name', 'email', 'phone', 'address',
                      'tax_id', 'contact_name', 'is_active',
                      'created_at', 'updated_at']:
            self.assertIn(field, result)

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_when_no_suppliers(self):
        Supplier.objects.all().delete()
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])


# ---------------------------------------------------------------------------
# POST /api/v1/suppliers/ — crear
# ---------------------------------------------------------------------------

class SupplierCreateTest(BaseSupplierAPITest):

    def setUp(self):
        super().setUp()
        self.valid_payload = {
            'name': 'Global Tech Ltda',
            'email': 'info@globaltech.com',
            'phone': '+57 320 111 2222',
            'address': 'Calle 72 # 10-30, Bogotá',
            'tax_id': '800987654-2',
            'contact_name': 'Carlos Ruiz',
        }

    def test_create_valid_payload_returns_201(self):
        response = self.client.post(SUPPLIERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_response_contains_id(self):
        response = self.client.post(SUPPLIERS_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)

    def test_create_response_reflects_payload(self):
        response = self.client.post(SUPPLIERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.data['name'], self.valid_payload['name'])
        self.assertEqual(response.data['email'], self.valid_payload['email'])
        self.assertEqual(response.data['tax_id'], self.valid_payload['tax_id'])
        self.assertEqual(response.data['contact_name'], self.valid_payload['contact_name'])

    def test_create_persists_to_database(self):
        self.client.post(SUPPLIERS_URL, self.valid_payload, format='json')
        self.assertEqual(Supplier.objects.filter(name='Global Tech Ltda').count(), 1)

    def test_create_is_active_defaults_to_true(self):
        response = self.client.post(SUPPLIERS_URL, self.valid_payload, format='json')
        self.assertTrue(response.data['is_active'])

    def test_create_with_is_active_false(self):
        payload = {**self.valid_payload, 'is_active': False}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_active'])

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(SUPPLIERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_missing_name_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_missing_email_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'email'}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_missing_phone_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'phone'}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', response.data)

    def test_create_missing_address_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'address'}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('address', response.data)

    def test_create_missing_tax_id_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'tax_id'}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tax_id', response.data)

    def test_create_missing_contact_name_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'contact_name'}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('contact_name', response.data)

    def test_create_empty_payload_returns_400(self):
        response = self.client.post(SUPPLIERS_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_email_returns_400(self):
        payload = {**self.valid_payload, 'email': 'correo-invalido'}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_duplicate_tax_id_returns_400(self):
        _make_supplier(tax_id='900123456-1')
        payload = {**self.valid_payload, 'tax_id': '900123456-1'}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tax_id', response.data)

    def test_create_read_only_fields_ignored(self):
        """id, created_at, updated_at son read-only — el cliente no puede sobreescribirlos."""
        payload = {**self.valid_payload, 'id': 9999, 'created_at': '2020-01-01T00:00:00Z'}
        response = self.client.post(SUPPLIERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)


# ---------------------------------------------------------------------------
# GET /api/v1/suppliers/{id}/ — detalle
# ---------------------------------------------------------------------------

class SupplierRetrieveTest(BaseSupplierAPITest):

    def setUp(self):
        super().setUp()
        self.supplier = _make_supplier(
            name='Proveedor Sur',
            email='sur@proveedorsur.com',
            tax_id='700111222-3',
            contact_name='María López',
        )

    def test_retrieve_existing_returns_200(self):
        response = self.client.get(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_data(self):
        response = self.client.get(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.data['name'], 'Proveedor Sur')
        self.assertEqual(response.data['email'], 'sur@proveedorsur.com')
        self.assertEqual(response.data['tax_id'], '700111222-3')
        self.assertEqual(response.data['contact_name'], 'María López')

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{SUPPLIERS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PUT /api/v1/suppliers/{id}/ — reemplazo completo
# ---------------------------------------------------------------------------

class SupplierUpdateTest(BaseSupplierAPITest):

    def setUp(self):
        super().setUp()
        self.supplier = _make_supplier(
            name='Proveedor Original',
            email='original@proveedor.com',
            tax_id='900123456-1',
        )
        self.full_payload = {
            'name': 'Proveedor Modificado',
            'email': 'nuevo@proveedor.com',
            'phone': '+57 315 999 8888',
            'address': 'Avenida 68 # 50-12, Bogotá',
            'tax_id': '900123456-1',
            'contact_name': 'Pedro Martínez',
        }

    def test_full_update_returns_200(self):
        response = self.client.put(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_changes_all_fields(self):
        response = self.client.put(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.data['name'], 'Proveedor Modificado')
        self.assertEqual(response.data['email'], 'nuevo@proveedor.com')
        self.assertEqual(response.data['contact_name'], 'Pedro Martínez')

    def test_full_update_persists_to_database(self):
        self.client.put(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            self.full_payload,
            format='json',
        )
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.name, 'Proveedor Modificado')
        self.assertEqual(self.supplier.email, 'nuevo@proveedor.com')

    def test_full_update_nonexistent_returns_404(self):
        response = self.client.put(
            f'{SUPPLIERS_URL}99999/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_full_update_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.put(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_full_update_invalid_email_returns_400(self):
        payload = {**self.full_payload, 'email': 'no-es-email'}
        response = self.client.put(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)


# ---------------------------------------------------------------------------
# PATCH /api/v1/suppliers/{id}/ — actualización parcial
# ---------------------------------------------------------------------------

class SupplierPartialUpdateTest(BaseSupplierAPITest):

    def setUp(self):
        super().setUp()
        self.supplier = _make_supplier(
            name='Proveedor Existente',
            email='existente@proveedor.com',
            tax_id='900123456-1',
            contact_name='Contacto Original',
        )

    def test_patch_single_field_returns_200(self):
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'contact_name': 'Nuevo Contacto'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_only_specified_field(self):
        original_name = self.supplier.name
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'contact_name': 'Nuevo Contacto'},
            format='json',
        )
        self.assertEqual(response.data['contact_name'], 'Nuevo Contacto')
        self.assertEqual(response.data['name'], original_name)

    def test_patch_is_active_to_false(self):
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'is_active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    def test_patch_email_field(self):
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'email': 'nuevo@proveedor.com'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'nuevo@proveedor.com')

    def test_patch_persists_to_database(self):
        self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'contact_name': 'Guardado En DB'},
            format='json',
        )
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.contact_name, 'Guardado En DB')

    def test_patch_nonexistent_returns_404(self):
        response = self.client.patch(
            f'{SUPPLIERS_URL}99999/',
            {'contact_name': 'x'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'contact_name': 'x'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_duplicate_tax_id_returns_400(self):
        """PATCH con tax_id ya usado por otro proveedor → 400."""
        _make_supplier(name='Otro', email='otro@otro.com', tax_id='OTRO-TAX-999')
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'tax_id': 'OTRO-TAX-999'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tax_id', response.data)

    def test_patch_invalid_email_returns_400(self):
        response = self.client.patch(
            f'{SUPPLIERS_URL}{self.supplier.pk}/',
            {'email': 'correo-invalido'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)


# ---------------------------------------------------------------------------
# DELETE /api/v1/suppliers/{id}/ — eliminar
# ---------------------------------------------------------------------------

class SupplierDeleteTest(BaseSupplierAPITest):

    def setUp(self):
        super().setUp()
        self.supplier = _make_supplier(name='Proveedor a Eliminar', tax_id='DEL-001')

    def test_delete_existing_returns_204(self):
        response = self.client.delete(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        pk = self.supplier.pk
        self.client.delete(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertFalse(Supplier.objects.filter(pk=pk).exists())

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(f'{SUPPLIERS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_response_has_no_body(self):
        response = self.client.delete(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(response.content)

    def test_delete_decrements_count(self):
        _make_supplier(name='Extra', email='extra@extra.com', tax_id='EXTRA-001')
        self.assertEqual(Supplier.objects.count(), 2)
        self.client.delete(f'{SUPPLIERS_URL}{self.supplier.pk}/')
        self.assertEqual(Supplier.objects.count(), 1)


# ---------------------------------------------------------------------------
# Filtros — ?is_active=
# ---------------------------------------------------------------------------

class SupplierFilterTest(BaseSupplierAPITest):

    def setUp(self):
        super().setUp()
        self.active1 = _make_supplier(name='Activo Uno', tax_id='ACT-001')
        self.active2 = _make_supplier(
            name='Activo Dos', email='dos@dos.com', tax_id='ACT-002',
        )
        self.inactive = _make_supplier(
            name='Inactivo', email='inact@inact.com', tax_id='INACT-001',
            is_active=False,
        )

    def test_filter_by_is_active_true(self):
        response = self.client.get(f'{SUPPLIERS_URL}?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertTrue(result['is_active'])

    def test_filter_by_is_active_false(self):
        response = self.client.get(f'{SUPPLIERS_URL}?is_active=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertFalse(response.data['results'][0]['is_active'])

    def test_filter_by_is_active_true_excludes_inactive(self):
        response = self.client.get(f'{SUPPLIERS_URL}?is_active=true')
        names = [r['name'] for r in response.data['results']]
        self.assertNotIn('Inactivo', names)

    def test_no_filter_returns_all(self):
        response = self.client.get(SUPPLIERS_URL)
        self.assertEqual(response.data['count'], 3)


# ---------------------------------------------------------------------------
# Búsqueda — ?search=
# ---------------------------------------------------------------------------

class SupplierSearchTest(BaseSupplierAPITest):

    def setUp(self):
        super().setUp()
        _make_supplier(
            name='TechnoGlobal S.A.',
            email='info@technoglobal.com',
            tax_id='TECH-001',
            contact_name='Roberto Silva',
        )
        _make_supplier(
            name='Importaciones del Norte',
            email='ventas@importnorte.com',
            tax_id='IMP-001',
            contact_name='Luisa Fernández',
        )
        _make_supplier(
            name='Digital Parts Ltda',
            email='contact@digitalparts.com',
            tax_id='DIG-SKU-001',
            contact_name='Andrés Mora',
        )

    def test_search_by_name_returns_matching(self):
        response = self.client.get(f'{SUPPLIERS_URL}?search=TechnoGlobal')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)
        self.assertEqual(response.data['results'][0]['name'], 'TechnoGlobal S.A.')

    def test_search_by_email_returns_matching(self):
        response = self.client.get(f'{SUPPLIERS_URL}?search=importnorte')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_tax_id_returns_matching(self):
        response = self.client.get(f'{SUPPLIERS_URL}?search=DIG-SKU-001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_contact_name_returns_matching(self):
        response = self.client.get(f'{SUPPLIERS_URL}?search=Luisa')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_no_match_returns_empty(self):
        response = self.client.get(f'{SUPPLIERS_URL}?search=TerminoInexistente99999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_search_partial_name_returns_results(self):
        response = self.client.get(f'{SUPPLIERS_URL}?search=Digital')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)


# ---------------------------------------------------------------------------
# Ordering — ?ordering=
# ---------------------------------------------------------------------------

class SupplierOrderingTest(BaseSupplierAPITest):

    def setUp(self):
        super().setUp()
        _make_supplier(name='Alfa Proveedores', tax_id='ORD-A')
        _make_supplier(name='Beta Suministros', email='beta@beta.com', tax_id='ORD-B')
        _make_supplier(name='Gamma Distribuciones', email='gamma@gamma.com', tax_id='ORD-C')

    def test_ordering_by_name_ascending(self):
        response = self.client.get(f'{SUPPLIERS_URL}?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        response = self.client.get(f'{SUPPLIERS_URL}?ordering=-name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_created_at_descending(self):
        response = self.client.get(f'{SUPPLIERS_URL}?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))

    def test_ordering_by_created_at_ascending(self):
        response = self.client.get(f'{SUPPLIERS_URL}?ordering=created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates))
