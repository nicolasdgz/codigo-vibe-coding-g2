from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.suppliers.models import Supplier
from apps.products.models import Product
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route
from apps.shipments.models import Shipment, ShipmentItem


SHIPMENTS_URL = '/api/v1/shipments/'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_admin(username='admin_ship'):
    return User.objects.create_superuser(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
    )


def _auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def _make_warehouse(name='Bodega Central', city='Bogotá'):
    return Warehouse.objects.create(
        name=name, address='Calle 1', city=city, country='Colombia', capacity=500,
    )


def _make_customer(name='TechCorp S.A.', email='tech@corp.com'):
    return Customer.objects.create(
        name=name, email=email, phone='+57 300 000 0000',
        address='Av. 1', customer_type='company',
    )


def _make_supplier(tax_id='TAX-001'):
    return Supplier.objects.create(
        name='Proveedor Tech', email='prov@test.com', phone='+57 300 111 2222',
        address='Zona Industrial', tax_id=tax_id, contact_name='Ana',
    )


def _make_product(warehouse, supplier, sku='LAP-001', unit_price=Decimal('1500.00'),
                  weight_kg=Decimal('2.50'), is_active=True):
    return Product.objects.create(
        name='Laptop Pro', sku=sku, weight_kg=weight_kg,
        unit_price=unit_price, supplier=supplier, warehouse=warehouse,
        is_active=is_active,
    )


def _make_transport(plate='TRK-001'):
    user = User.objects.create_user(username=f'drv_{plate}', password='pass123')
    driver = Driver.objects.create(
        user=user, license_number=f'LIC-{plate}',
        license_expiry='2026-12-31', phone='+57 300 000 0000',
    )
    return Transport.objects.create(
        plate_number=plate, vehicle_type='truck', brand='Kenworth',
        model='T680', year=2022, capacity_kg='15000.00', capacity_units=100, driver=driver,
    )


def _make_route(warehouse, transport, name='Ruta Norte'):
    return Route.objects.create(
        name=name, origin_warehouse=warehouse, transport=transport,
        status='planned', scheduled_date='2026-06-01',
    )


def _make_shipment(customer, warehouse, created_by, status='pending', **kwargs):
    defaults = dict(
        destination_address='Cra. 50 #80-20',
        destination_city='Medellín',
        destination_country='Colombia',
        calculated_cost=Decimal('250.00'),
    )
    defaults.update(kwargs)
    return Shipment.objects.create(
        customer=customer,
        origin_warehouse=warehouse,
        created_by=created_by,
        status=status,
        **defaults,
    )


# ---------------------------------------------------------------------------
# Base con autenticación JWT de admin lista
# ---------------------------------------------------------------------------

class BaseShipmentAPITest(APITestCase):

    def setUp(self):
        self.admin = _make_admin()
        _auth_client(self.client, self.admin)
        self.warehouse = _make_warehouse()
        self.customer = _make_customer()
        self.supplier = _make_supplier()
        self.product = _make_product(self.warehouse, self.supplier)
        transport = _make_transport()
        self.route = _make_route(self.warehouse, transport)
        self.shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.valid_payload = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'Calle 80 #20-10',
            'destination_city': 'Cali',
            'destination_country': 'Colombia',
            'calculated_cost': '180.00',
        }


# ---------------------------------------------------------------------------
# GET /api/v1/shipments/ — listar
# ---------------------------------------------------------------------------

class ShipmentListTest(BaseShipmentAPITest):

    def test_list_returns_200(self):
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_has_pagination_structure(self):
        response = self.client.get(SHIPMENTS_URL)
        for key in ['count', 'results', 'next', 'previous']:
            self.assertIn(key, response.data)

    def test_list_includes_created_shipment(self):
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.data['count'], 1)

    def test_list_result_contains_expected_fields(self):
        response = self.client.get(SHIPMENTS_URL)
        result = response.data['results'][0]
        for field in [
            'id', 'tracking_number', 'customer', 'origin_warehouse',
            'destination_address', 'destination_city', 'destination_country',
            'status', 'route', 'total_weight_kg', 'calculated_cost',
            'items', 'created_at', 'updated_at',
        ]:
            self.assertIn(field, result)

    def test_list_customer_is_nested_object(self):
        response = self.client.get(SHIPMENTS_URL)
        customer_data = response.data['results'][0]['customer']
        self.assertIsInstance(customer_data, dict)
        self.assertIn('name', customer_data)

    def test_list_origin_warehouse_is_nested_object(self):
        response = self.client.get(SHIPMENTS_URL)
        warehouse_data = response.data['results'][0]['origin_warehouse']
        self.assertIsInstance(warehouse_data, dict)
        self.assertIn('name', warehouse_data)

    def test_list_items_is_list(self):
        response = self.client.get(SHIPMENTS_URL)
        self.assertIsInstance(response.data['results'][0]['items'], list)

    def test_list_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_empty_when_no_shipments(self):
        Shipment.objects.all().delete()
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    def test_list_multiple_shipments(self):
        _make_shipment(self.customer, self.warehouse, self.admin)
        _make_shipment(self.customer, self.warehouse, self.admin)
        response = self.client.get(SHIPMENTS_URL)
        self.assertEqual(response.data['count'], 3)

    def test_list_default_ordering_is_newest_first(self):
        s2 = _make_shipment(self.customer, self.warehouse, self.admin)
        response = self.client.get(SHIPMENTS_URL)
        first_id = response.data['results'][0]['id']
        self.assertEqual(first_id, s2.id)


# ---------------------------------------------------------------------------
# GET /api/v1/shipments/ — filtros
# ---------------------------------------------------------------------------

class ShipmentFilterTest(BaseShipmentAPITest):

    def setUp(self):
        super().setUp()
        self.customer2 = _make_customer(name='Otro Cliente', email='otro@test.com')
        self.warehouse2 = _make_warehouse(name='Bodega Sur', city='Cali')
        self.shipment_delivered = _make_shipment(
            self.customer, self.warehouse, self.admin, status='delivered',
        )
        self.shipment_cancelled = _make_shipment(
            self.customer2, self.warehouse2, self.admin, status='cancelled',
        )

    def test_filter_by_status_pending(self):
        response = self.client.get(f'{SHIPMENTS_URL}?status=pending')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['status'], 'pending')

    def test_filter_by_status_delivered(self):
        response = self.client.get(f'{SHIPMENTS_URL}?status=delivered')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['status'], 'delivered')

    def test_filter_by_status_cancelled(self):
        response = self.client.get(f'{SHIPMENTS_URL}?status=cancelled')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_by_customer(self):
        response = self.client.get(f'{SHIPMENTS_URL}?customer={self.customer2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['customer']['id'], self.customer2.id)

    def test_filter_by_origin_warehouse(self):
        response = self.client.get(
            f'{SHIPMENTS_URL}?origin_warehouse={self.warehouse2.id}',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertEqual(result['origin_warehouse']['id'], self.warehouse2.id)

    def test_filter_by_route_null(self):
        transport2 = _make_transport('TRK-FILTER')
        route2 = _make_route(self.warehouse, transport2, name='Ruta Filter')
        _make_shipment(
            self.customer, self.warehouse, self.admin, route=route2,
        )
        response = self.client.get(f'{SHIPMENTS_URL}?route={route2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for result in response.data['results']:
            self.assertIsNotNone(result['route'])

    def test_filter_invalid_status_returns_400(self):
        response = self.client.get(f'{SHIPMENTS_URL}?status=nonexistent_status')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# GET /api/v1/shipments/ — búsqueda
# ---------------------------------------------------------------------------

class ShipmentSearchTest(BaseShipmentAPITest):

    def setUp(self):
        super().setUp()
        self.wh_medellin = _make_warehouse(name='Bodega Medellín', city='Medellín')
        customer2 = _make_customer(name='Empresa XYZ', email='xyz@test.com')
        self.shipment_cali = _make_shipment(
            customer2, self.wh_medellin, self.admin,
            destination_city='Cali', destination_country='Colombia',
        )

    def test_search_by_tracking_number(self):
        tracking = self.shipment.tracking_number
        response = self.client.get(f'{SHIPMENTS_URL}?search={tracking}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_search_by_tracking_prefix(self):
        response = self.client.get(f'{SHIPMENTS_URL}?search=TRK-')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_destination_city(self):
        response = self.client.get(f'{SHIPMENTS_URL}?search=Medell%C3%ADn')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_by_destination_country(self):
        response = self.client.get(f'{SHIPMENTS_URL}?search=Colombia')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_search_no_match_returns_empty(self):
        response = self.client.get(f'{SHIPMENTS_URL}?search=TERMINO_INEXISTENTE_XYZ')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)


# ---------------------------------------------------------------------------
# GET /api/v1/shipments/ — ordenamiento
# ---------------------------------------------------------------------------

class ShipmentOrderingTest(BaseShipmentAPITest):

    def setUp(self):
        super().setUp()
        _make_shipment(
            self.customer, self.warehouse, self.admin,
            calculated_cost=Decimal('100.00'),
        )
        _make_shipment(
            self.customer, self.warehouse, self.admin,
            calculated_cost=Decimal('500.00'),
        )

    def test_ordering_by_calculated_cost_ascending(self):
        response = self.client.get(f'{SHIPMENTS_URL}?ordering=calculated_cost')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        costs = [Decimal(r['calculated_cost']) for r in response.data['results']]
        self.assertEqual(costs, sorted(costs))

    def test_ordering_by_calculated_cost_descending(self):
        response = self.client.get(f'{SHIPMENTS_URL}?ordering=-calculated_cost')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        costs = [Decimal(r['calculated_cost']) for r in response.data['results']]
        self.assertEqual(costs, sorted(costs, reverse=True))

    def test_ordering_by_created_at_ascending(self):
        response = self.client.get(f'{SHIPMENTS_URL}?ordering=created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates))

    def test_ordering_by_created_at_descending(self):
        response = self.client.get(f'{SHIPMENTS_URL}?ordering=-created_at')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [r['created_at'] for r in response.data['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))


# ---------------------------------------------------------------------------
# POST /api/v1/shipments/ — crear
# ---------------------------------------------------------------------------

class ShipmentCreateTest(BaseShipmentAPITest):

    def test_create_valid_payload_returns_201(self):
        response = self.client.post(SHIPMENTS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_response_contains_id(self):
        response = self.client.post(SHIPMENTS_URL, self.valid_payload, format='json')
        self.assertIn('id', response.data)

    def test_create_persists_to_database(self):
        initial_count = Shipment.objects.count()
        self.client.post(SHIPMENTS_URL, self.valid_payload, format='json')
        self.assertEqual(Shipment.objects.count(), initial_count + 1)

    def test_create_sets_created_by_to_requesting_user(self):
        response = self.client.post(SHIPMENTS_URL, self.valid_payload, format='json')
        shipment = Shipment.objects.get(id=response.data['id'])
        self.assertEqual(shipment.created_by, self.admin)

    def test_create_generates_tracking_number(self):
        response = self.client.post(SHIPMENTS_URL, self.valid_payload, format='json')
        shipment = Shipment.objects.get(id=response.data['id'])
        self.assertTrue(shipment.tracking_number.startswith('TRK-'))

    def test_create_default_status_is_pending(self):
        response = self.client.post(SHIPMENTS_URL, self.valid_payload, format='json')
        shipment = Shipment.objects.get(id=response.data['id'])
        self.assertEqual(shipment.status, 'pending')

    def test_create_with_explicit_status(self):
        payload = {**self.valid_payload, 'status': 'in_transit'}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        shipment = Shipment.objects.get(id=response.data['id'])
        self.assertEqual(shipment.status, 'in_transit')

    def test_create_with_route(self):
        payload = {**self.valid_payload, 'route': self.route.id}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        shipment = Shipment.objects.get(id=response.data['id'])
        self.assertEqual(shipment.route, self.route)

    def test_create_with_estimated_delivery(self):
        payload = {**self.valid_payload, 'estimated_delivery': '2026-07-15'}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_with_notes(self):
        payload = {**self.valid_payload, 'notes': 'Entregar en portería'}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        shipment = Shipment.objects.get(id=response.data['id'])
        self.assertEqual(shipment.notes, 'Entregar en portería')

    def test_create_missing_customer_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'customer'}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('customer', response.data)

    def test_create_missing_origin_warehouse_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'origin_warehouse'}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('origin_warehouse', response.data)

    def test_create_missing_destination_address_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'destination_address'}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('destination_address', response.data)

    def test_create_missing_destination_city_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'destination_city'}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('destination_city', response.data)

    def test_create_missing_destination_country_returns_400(self):
        payload = {k: v for k, v in self.valid_payload.items() if k != 'destination_country'}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('destination_country', response.data)

    def test_create_empty_payload_returns_400(self):
        response = self.client.post(SHIPMENTS_URL, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_customer_fk_returns_400(self):
        payload = {**self.valid_payload, 'customer': 99999}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_warehouse_fk_returns_400(self):
        payload = {**self.valid_payload, 'origin_warehouse': 99999}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_inactive_customer_returns_400(self):
        inactive_customer = Customer.objects.create(
            name='Inactivo', email='inactivo@test.com', phone='+57 300 000 1111',
            address='Dir', customer_type='company', is_active=False,
        )
        payload = {**self.valid_payload, 'customer': inactive_customer.id}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_inactive_warehouse_returns_400(self):
        inactive_wh = Warehouse.objects.create(
            name='Inactiva', address='Dir', city='Bogotá', country='Colombia',
            capacity=100, is_active=False,
        )
        payload = {**self.valid_payload, 'origin_warehouse': inactive_wh.id}
        response = self.client.post(SHIPMENTS_URL, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(SHIPMENTS_URL, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# GET /api/v1/shipments/{id}/ — detalle
# ---------------------------------------------------------------------------

class ShipmentRetrieveTest(BaseShipmentAPITest):

    def setUp(self):
        super().setUp()
        self.item = ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=2, unit_price=Decimal('1500.00'),
        )

    def test_retrieve_existing_returns_200(self):
        response = self.client.get(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_returns_correct_tracking_number(self):
        response = self.client.get(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertEqual(response.data['tracking_number'], self.shipment.tracking_number)

    def test_retrieve_includes_items(self):
        response = self.client.get(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertIn('items', response.data)
        self.assertEqual(len(response.data['items']), 1)

    def test_retrieve_item_has_nested_product(self):
        response = self.client.get(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        item_data = response.data['items'][0]
        self.assertIsInstance(item_data['product'], dict)
        self.assertIn('name', item_data['product'])

    def test_retrieve_includes_created_by(self):
        response = self.client.get(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertIn('created_by', response.data)
        self.assertIsInstance(response.data['created_by'], dict)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get(f'{SHIPMENTS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PUT /api/v1/shipments/{id}/ — reemplazo completo
# ---------------------------------------------------------------------------

class ShipmentFullUpdateTest(BaseShipmentAPITest):

    def setUp(self):
        super().setUp()
        self.full_payload = {
            'customer': self.customer.id,
            'origin_warehouse': self.warehouse.id,
            'destination_address': 'Nueva Dirección 123',
            'destination_city': 'Barranquilla',
            'destination_country': 'Colombia',
            'calculated_cost': '350.00',
            'status': 'in_transit',
        }

    def test_full_update_returns_200(self):
        response = self.client.put(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', self.full_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_full_update_changes_destination_city(self):
        response = self.client.put(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', self.full_payload, format='json',
        )
        self.assertEqual(response.data['destination_city'], 'Barranquilla')

    def test_full_update_changes_status(self):
        response = self.client.put(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', self.full_payload, format='json',
        )
        self.assertEqual(response.data['status'], 'in_transit')

    def test_full_update_persists_to_database(self):
        self.client.put(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', self.full_payload, format='json',
        )
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.destination_city, 'Barranquilla')

    def test_full_update_nonexistent_returns_404(self):
        response = self.client.put(
            f'{SHIPMENTS_URL}99999/', self.full_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_full_update_missing_required_field_returns_400(self):
        payload = {k: v for k, v in self.full_payload.items() if k != 'customer'}
        response = self.client.put(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_full_update_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.put(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', self.full_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# PATCH /api/v1/shipments/{id}/ — actualización parcial
# ---------------------------------------------------------------------------

class ShipmentPartialUpdateTest(BaseShipmentAPITest):

    def test_patch_status_returns_200(self):
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'status': 'in_transit'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_transit')

    def test_patch_status_to_delivered(self):
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'status': 'delivered'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'delivered')

    def test_patch_status_to_cancelled(self):
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'status': 'cancelled'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelled')

    def test_patch_status_to_returned(self):
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'status': 'returned'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'returned')

    def test_patch_destination_city(self):
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'destination_city': 'Bogotá'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['destination_city'], 'Bogotá')

    def test_patch_assign_route(self):
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'route': self.route.id}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.route, self.route)

    def test_patch_unset_route_to_null(self):
        self.shipment.route = self.route
        self.shipment.save()
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'route': None}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_updates_only_specified_field(self):
        original_city = self.shipment.destination_city
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'status': 'in_transit'}, format='json',
        )
        self.assertEqual(response.data['status'], 'in_transit')
        self.assertEqual(response.data['destination_city'], original_city)

    def test_patch_persists_to_database(self):
        self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'status': 'delivered'}, format='json',
        )
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'delivered')

    def test_patch_nonexistent_returns_404(self):
        response = self.client.patch(
            f'{SHIPMENTS_URL}99999/', {'status': 'cancelled'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_invalid_route_fk_returns_400(self):
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'route': 99999}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'status': 'cancelled'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_calculated_cost(self):
        response = self.client.patch(
            f'{SHIPMENTS_URL}{self.shipment.pk}/', {'calculated_cost': '999.99'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.calculated_cost, Decimal('999.99'))


# ---------------------------------------------------------------------------
# DELETE /api/v1/shipments/{id}/ — eliminar
# ---------------------------------------------------------------------------

class ShipmentDeleteTest(BaseShipmentAPITest):

    def test_delete_existing_returns_204(self):
        response = self.client.delete(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_removes_from_database(self):
        pk = self.shipment.pk
        self.client.delete(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertFalse(Shipment.objects.filter(pk=pk).exists())

    def test_delete_response_has_no_body(self):
        response = self.client.delete(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertFalse(response.content)

    def test_delete_cascades_items(self):
        ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=1, unit_price=Decimal('1500.00'),
        )
        shipment_id = self.shipment.pk
        self.client.delete(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertEqual(ShipmentItem.objects.filter(shipment_id=shipment_id).count(), 0)

    def test_delete_nonexistent_returns_404(self):
        response = self.client.delete(f'{SHIPMENTS_URL}99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_one_does_not_affect_others(self):
        s2 = _make_shipment(self.customer, self.warehouse, self.admin)
        self.client.delete(f'{SHIPMENTS_URL}{self.shipment.pk}/')
        self.assertTrue(Shipment.objects.filter(pk=s2.pk).exists())
