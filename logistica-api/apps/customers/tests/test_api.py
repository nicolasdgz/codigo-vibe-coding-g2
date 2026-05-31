from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.customers.models import Customer


CUSTOMERS_URL = '/api/v1/customers/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_superuser(username='admin_test', **kwargs):
    return User.objects.create_superuser(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
        **kwargs,
    )


def _make_customer(**kwargs):
    defaults = {
        'name': 'Empresa ABC',
        'customer_type': 'company',
        'email': 'contacto@empresaabc.com',
        'phone': '+57 310 111 2222',
        'address': 'Calle 72 # 10-30, Bogotá',
    }
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


class BaseCustomerAPITest(APITestCase):
    """Base con autenticación JWT de superuser lista."""

    def setUp(self):
        self.user = _make_superuser()
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


# ---------------------------------------------------------------------------
# GET /api/v1/customers/ — listar
# ---------------------------------------------------------------------------

class CustomerListTest(BaseCustomerAPITest):

    def setUp(self):
        super().setUp()
        self.customer = _make_customer()

    def test_list_returns_200(self):
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_has_pagination_structure(self):
        response = self.client.get(CUSTOMERS_URL)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_list_includes_created_customer(self):
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.data['count'], 1)

    def test_list_result_contains_expected_fields(self):
        response = self.client.get(CUSTOMERS_URL)
        result = response.data['results'][0]
        for field in ['id', 'name', 'customer_type', 'email', 'phone',
                      'address', 'tax_id', 'is_active', 'created_at', 'updated_at']:
            self.assertIn(field, result)

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_when_no_customers(self):
        Customer.objects.all().delete()
        response = self.client.get(CUSTOMERS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])


# ---------------------------------------------------------------------------
# POST /api/v1/customers/ — crear
# ---------------------------------------------------------------------------

class CustomerCreateTest(BaseCustomerAPITest):

    def setUp(self):
        super().setUp()
        self.valid_payload = {
            'name': 'Global Corp',
            'customer_type': 'company',
            'email': 'info@globalcorp.com',
            'phone': '+57 300 555 6666',
            'address': 'Av. El Dorado # 68-50, Bogotá',
        }

    def test_create_valid_payload_returns_201(self):
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_response_contains_id(self):
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)

    def test_create_response_reflects_payload(self):
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.data['name'], self.valid_payload['name'])
        self.assertEqual(response.data['email'], self.valid_payload['email'])
        self.assertEqual(response.data['customer_type'], self.valid_payload['customer_type'])

    def test_create_persists_to_database(self):
        self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertTrue(Customer.objects.filter(email='info@globalcorp.com').exists())

    def test_create_person_type_returns_201(self):
        payload = {
            'name': 'María López',
            'customer_type': 'person',
            'email': 'maria@personal.com',
            'phone': '+57 321 444 5555',
            'address': 'Carrera 10 # 50-20, Bogotá',
        }
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer_type'], 'person')

    def test_create_with_tax_id_returns_201(self):
        payload = {**self.valid_payload, 'tax_id': '900-123-456-7'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tax_id'], '900-123-456-7')

    def test_create_is_active_defaults_to_true(self):
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertTrue(response.data['is_active'])

    def test_create_with_is_active_false(self):
        payload = {**self.valid_payload, 'is_active': False}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['is_active'])

    def test_create_tax_id_null_when_not_provided(self):
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertIsNone(response.data['tax_id'])

    def test_create_read_only_fields_ignored(self):
        """id, created_at, updated_at son read-only — el cliente no puede sobreescribirlos."""
        payload = {**self.valid_payload, 'id': 9999, 'created_at': '2020-01-01T00:00:00Z'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data['id'], 9999)

    # --- Unhappy path ---

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_empty_payload_returns_400(self):
        response = self.client.post(CUSTOMERS_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_missing_name_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'name'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_missing_customer_type_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'customer_type'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer_type', response.data)

    def test_create_missing_email_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'email'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_missing_phone_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'phone'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', response.data)

    def test_create_missing_address_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'address'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('address', response.data)

    def test_create_duplicate_email_returns_400(self):
        _make_customer(email='info@globalcorp.com')
        response = self.client.post(CUSTOMERS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_duplicate_tax_id_returns_400(self):
        _make_customer(tax_id='NIT-999-888-7')
        payload = {**self.valid_payload, 'tax_id': 'NIT-999-888-7'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tax_id', response.data)

    def test_create_invalid_email_format_returns_400(self):
        payload = {**self.valid_payload, 'email': 'email-invalido'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_invalid_customer_type_returns_400(self):
        payload = {**self.valid_payload, 'customer_type': 'corporation'}
        response = self.client.post(CUSTOMERS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer_type', response.data)


# ---------------------------------------------------------------------------
# GET /api/v1/customers/{id}/ — detalle
# ---------------------------------------------------------------------------

class CustomerRetrieveTest(BaseCustomerAPITest):

    def setUp(self):
        super().setUp()
        self.customer = _make_customer(
            name='Soluciones Tech',
            customer_type='company',
            email='tech@soluciones.com',
            phone='+57 601 234 5678',
            address='Carrera 7 # 32-16, Bogotá',
            tax_id='830-500-123-4',
        )

    def test_retrieve_existing_returns_200(self):
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_name(self):
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.data['name'], 'Soluciones Tech')

    def test_retrieve_returns_correct_email(self):
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.data['email'], 'tech@soluciones.com')

    def test_retrieve_returns_correct_tax_id(self):
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.data['tax_id'], '830-500-123-4')

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{CUSTOMERS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PUT /api/v1/customers/{id}/ — reemplazo completo
# ---------------------------------------------------------------------------

class CustomerFullUpdateTest(BaseCustomerAPITest):

    def setUp(self):
        super().setUp()
        self.customer = _make_customer(
            name='Empresa Original',
            email='original@empresa.com',
        )
        self.full_payload = {
            'name': 'Empresa Modificada',
            'customer_type': 'person',
            'email': 'modificada@empresa.com',
            'phone': '+57 311 777 8888',
            'address': 'Calle 100 # 50-10, Bogotá',
        }

    def test_full_update_returns_200(self):
        response = self.client.put(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_changes_all_fields(self):
        response = self.client.put(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.data['name'], 'Empresa Modificada')
        self.assertEqual(response.data['customer_type'], 'person')
        self.assertEqual(response.data['email'], 'modificada@empresa.com')

    def test_full_update_persists_to_database(self):
        self.client.put(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            self.full_payload,
            format='json',
        )
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Empresa Modificada')

    def test_full_update_nonexistent_returns_404(self):
        response = self.client.put(
            f'{CUSTOMERS_URL}99999/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_full_update_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.put(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            self.full_payload,
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PATCH /api/v1/customers/{id}/ — actualización parcial
# ---------------------------------------------------------------------------

class CustomerPartialUpdateTest(BaseCustomerAPITest):

    def setUp(self):
        super().setUp()
        self.customer = _make_customer(
            name='Empresa Existente',
            phone='+57 310 000 0000',
        )

    def test_patch_single_field_returns_200(self):
        response = self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'phone': '+57 999 999 9999'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_only_specified_field(self):
        original_name = self.customer.name
        response = self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'phone': '+57 999 999 9999'},
            format='json',
        )
        self.assertEqual(response.data['phone'], '+57 999 999 9999')
        self.assertEqual(response.data['name'], original_name)

    def test_patch_is_active_to_false(self):
        response = self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'is_active': False},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

    def test_patch_name_returns_200(self):
        response = self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'name': 'Nombre Actualizado'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Nombre Actualizado')

    def test_patch_duplicate_email_returns_400(self):
        other = _make_customer(
            name='Otra Empresa',
            email='otro@empresa.com',
            customer_type='person',
        )
        response = self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'email': other.email},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_patch_nonexistent_returns_404(self):
        response = self.client.patch(
            f'{CUSTOMERS_URL}99999/',
            {'phone': '+57 111 222 3333'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'phone': '+57 111 222 3333'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_persists_to_database(self):
        self.client.patch(
            f'{CUSTOMERS_URL}{self.customer.pk}/',
            {'name': 'Persistido'},
            format='json',
        )
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Persistido')


# ---------------------------------------------------------------------------
# DELETE /api/v1/customers/{id}/ — eliminar
# ---------------------------------------------------------------------------

class CustomerDeleteTest(BaseCustomerAPITest):

    def setUp(self):
        super().setUp()
        self.customer = _make_customer(
            name='Cliente a Eliminar',
            email='eliminar@test.com',
        )

    def test_delete_existing_returns_204(self):
        response = self.client.delete(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        pk = self.customer.pk
        self.client.delete(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertFalse(Customer.objects.filter(pk=pk).exists())

    def test_delete_response_has_no_body(self):
        response = self.client.delete(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertFalse(response.content)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(f'{CUSTOMERS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{CUSTOMERS_URL}{self.customer.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# Filtros — ?customer_type= / ?is_active=
# ---------------------------------------------------------------------------

class CustomerFilterTest(BaseCustomerAPITest):

    def setUp(self):
        super().setUp()
        self.company1 = _make_customer(
            name='Tech Corp', customer_type='company',
            email='tech@corp.com',
        )
        self.company2 = _make_customer(
            name='Logistics S.A.', customer_type='company',
            email='logistics@sa.com',
        )
        self.person1 = _make_customer(
            name='Carlos Ruiz', customer_type='person',
            email='carlos@personal.com',
        )
        self.inactive = _make_customer(
            name='Empresa Inactiva', customer_type='company',
            email='inactiva@empresa.com', is_active=False,
        )

    def test_filter_by_customer_type_company(self):
        response = self.client.get(f'{CUSTOMERS_URL}?customer_type=company')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['customer_type'], 'company')

    def test_filter_by_customer_type_person(self):
        response = self.client.get(f'{CUSTOMERS_URL}?customer_type=person')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['customer_type'], 'person')

    def test_filter_by_is_active_true(self):
        response = self.client.get(f'{CUSTOMERS_URL}?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertTrue(result['is_active'])

    def test_filter_by_is_active_false(self):
        response = self.client.get(f'{CUSTOMERS_URL}?is_active=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertFalse(response.data['results'][0]['is_active'])

    def test_filter_company_and_active_combined(self):
        response = self.client.get(f'{CUSTOMERS_URL}?customer_type=company&is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['customer_type'], 'company')
            self.assertTrue(result['is_active'])

    def test_filter_invalid_customer_type_returns_400(self):
        """django-filter valida los choices — un valor inválido devuelve 400."""
        response = self.client.get(f'{CUSTOMERS_URL}?customer_type=corporation')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Búsqueda — ?search=
# ---------------------------------------------------------------------------

class CustomerSearchTest(BaseCustomerAPITest):

    def setUp(self):
        super().setUp()
        _make_customer(
            name='Distribuidora Nacional', customer_type='company',
            email='nacional@distribuidora.com',
        )
        _make_customer(
            name='Pedro Montoya', customer_type='person',
            email='pedro@montoya.com',
        )
        _make_customer(
            name='TechStart S.A.S', customer_type='company',
            email='info@techstart.com', tax_id='NIT-987654321-0',
        )

    def test_search_by_name_returns_matching(self):
        response = self.client.get(f'{CUSTOMERS_URL}?search=Nacional')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_email_returns_matching(self):
        response = self.client.get(f'{CUSTOMERS_URL}?search=pedro@montoya.com')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_tax_id_returns_matching(self):
        response = self.client.get(f'{CUSTOMERS_URL}?search=NIT-987654321-0')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_partial_name_returns_matching(self):
        response = self.client.get(f'{CUSTOMERS_URL}?search=Tech')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_no_match_returns_empty(self):
        response = self.client.get(f'{CUSTOMERS_URL}?search=TerminoInexistente99999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)


# ---------------------------------------------------------------------------
# Ordering — ?ordering=
# ---------------------------------------------------------------------------

class CustomerOrderingTest(BaseCustomerAPITest):

    def setUp(self):
        super().setUp()
        _make_customer(
            name='Alfa Corp', customer_type='company',
            email='alfa@corp.com',
        )
        _make_customer(
            name='Beta S.A.', customer_type='company',
            email='beta@sa.com',
        )
        _make_customer(
            name='Gamma Ltda', customer_type='person',
            email='gamma@ltda.com',
        )

    def test_ordering_by_name_ascending(self):
        response = self.client.get(f'{CUSTOMERS_URL}?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names))

    def test_ordering_by_name_descending(self):
        response = self.client.get(f'{CUSTOMERS_URL}?ordering=-name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [r['name'] for r in response.data['results']]
        self.assertEqual(names, sorted(names, reverse=True))

    def test_ordering_by_customer_type(self):
        response = self.client.get(f'{CUSTOMERS_URL}?ordering=customer_type')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        types = [r['customer_type'] for r in response.data['results']]
        self.assertEqual(types, sorted(types))

    def test_ordering_by_created_at_descending(self):
        response = self.client.get(f'{CUSTOMERS_URL}?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))

    def test_ordering_by_created_at_ascending(self):
        response = self.client.get(f'{CUSTOMERS_URL}?ordering=created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates))
