"""
Tests para las @actions de items anidados en ShipmentViewSet:
  GET    /api/v1/shipments/{id}/items/
  POST   /api/v1/shipments/{id}/items/
  PATCH  /api/v1/shipments/{id}/items/{item_id}/
  DELETE /api/v1/shipments/{id}/items/{item_id}/
"""
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_admin(username='admin_items'):
    return User.objects.create_superuser(
        username=username,
        email=f'{username}@logistica.com',
        password='TestPass9!',
    )


def _auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def _make_warehouse(name='Bodega Items'):
    return Warehouse.objects.create(
        name=name, address='Calle 1', city='Bogotá', country='Colombia', capacity=500,
    )


def _make_customer(name='Cliente Items', email='items@test.com'):
    return Customer.objects.create(
        name=name, email=email, phone='+57 300 000 0000',
        address='Av. 1', customer_type='company',
    )


def _make_supplier(tax_id='TAX-ITEMS'):
    return Supplier.objects.create(
        name='Proveedor Items', email='items@prov.com', phone='+57 300 111 2222',
        address='Zona Industrial', tax_id=tax_id, contact_name='Carlos',
    )


def _make_product(warehouse, supplier, sku='PRD-001', unit_price=Decimal('1500.00'),
                  weight_kg=Decimal('2.50'), is_active=True):
    return Product.objects.create(
        name='Laptop Pro', sku=sku, weight_kg=weight_kg,
        unit_price=unit_price, supplier=supplier, warehouse=warehouse,
        is_active=is_active,
    )


def _make_shipment(customer, warehouse, created_by):
    return Shipment.objects.create(
        customer=customer,
        origin_warehouse=warehouse,
        destination_address='Cra. 50 #80-20',
        destination_city='Medellín',
        destination_country='Colombia',
        calculated_cost=Decimal('250.00'),
        created_by=created_by,
    )


def _items_url(shipment_id):
    return f'/api/v1/shipments/{shipment_id}/items/'


def _item_detail_url(shipment_id, item_id):
    return f'/api/v1/shipments/{shipment_id}/items/{item_id}/'


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class BaseItemsTest(APITestCase):

    def setUp(self):
        self.admin = _make_admin()
        _auth_client(self.client, self.admin)
        self.warehouse = _make_warehouse()
        self.customer = _make_customer()
        self.supplier = _make_supplier()
        self.product = _make_product(self.warehouse, self.supplier)
        self.shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price=Decimal('1500.00'),
        )


# ---------------------------------------------------------------------------
# GET /api/v1/shipments/{id}/items/ — listar items
# ---------------------------------------------------------------------------

class ItemsListTest(BaseItemsTest):

    def test_list_items_returns_200(self):
        response = self.client.get(_items_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_items_returns_list(self):
        response = self.client.get(_items_url(self.shipment.pk))
        self.assertIsInstance(response.data, list)

    def test_list_items_count(self):
        response = self.client.get(_items_url(self.shipment.pk))
        self.assertEqual(len(response.data), 1)

    def test_list_items_multiple_items(self):
        product2 = _make_product(
            self.warehouse, self.supplier, sku='PRD-002', unit_price=Decimal('800.00'),
        )
        ShipmentItem.objects.create(
            shipment=self.shipment, product=product2,
            quantity=1, unit_price=Decimal('800.00'),
        )
        response = self.client.get(_items_url(self.shipment.pk))
        self.assertEqual(len(response.data), 2)

    def test_list_items_contains_expected_fields(self):
        response = self.client.get(_items_url(self.shipment.pk))
        item_data = response.data[0]
        for field in ['id', 'product', 'quantity', 'unit_price', 'subtotal']:
            self.assertIn(field, item_data)

    def test_list_items_product_is_nested_object(self):
        response = self.client.get(_items_url(self.shipment.pk))
        product_data = response.data[0]['product']
        self.assertIsInstance(product_data, dict)
        self.assertIn('name', product_data)
        self.assertIn('sku', product_data)

    def test_list_items_empty_shipment_returns_empty_list(self):
        customer2 = _make_customer(name='Otro Cliente', email='otro@test.com')
        empty_shipment = _make_shipment(customer2, self.warehouse, self.admin)
        response = self.client.get(_items_url(empty_shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_items_shipment_not_found_returns_404(self):
        response = self.client.get(_items_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_items_only_shows_items_of_requested_shipment(self):
        customer2 = _make_customer(name='Otro2', email='otro2@test.com')
        other_shipment = _make_shipment(customer2, self.warehouse, self.admin)
        product2 = _make_product(
            self.warehouse, self.supplier, sku='PRD-OTHER',
        )
        ShipmentItem.objects.create(
            shipment=other_shipment, product=product2,
            quantity=1, unit_price=Decimal('100.00'),
        )
        response = self.client.get(_items_url(self.shipment.pk))
        self.assertEqual(len(response.data), 1)

    def test_list_items_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.get(_items_url(self.shipment.pk))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# POST /api/v1/shipments/{id}/items/ — agregar item
# ---------------------------------------------------------------------------

class ItemsCreateTest(BaseItemsTest):

    def setUp(self):
        super().setUp()
        self.product2 = _make_product(
            self.warehouse, self.supplier, sku='PRD-NEW',
            unit_price=Decimal('800.00'), weight_kg=Decimal('1.20'),
        )
        self.valid_payload = {
            'product': self.product2.id,
            'quantity': 3,
            'unit_price': '800.00',
        }

    def test_create_item_returns_201(self):
        response = self.client.post(
            _items_url(self.shipment.pk), self.valid_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_item_response_contains_expected_fields(self):
        response = self.client.post(
            _items_url(self.shipment.pk), self.valid_payload, format='json',
        )
        for field in ['id', 'product', 'quantity', 'unit_price', 'subtotal']:
            self.assertIn(field, response.data)

    def test_create_item_subtotal_is_computed(self):
        response = self.client.post(
            _items_url(self.shipment.pk), self.valid_payload, format='json',
        )
        # 3 * 800.00 = 2400.00
        self.assertEqual(Decimal(response.data['subtotal']), Decimal('2400.00'))

    def test_create_item_persists_to_database(self):
        initial_count = ShipmentItem.objects.filter(shipment=self.shipment).count()
        self.client.post(_items_url(self.shipment.pk), self.valid_payload, format='json')
        self.assertEqual(
            ShipmentItem.objects.filter(shipment=self.shipment).count(),
            initial_count + 1,
        )

    def test_create_item_without_unit_price_uses_product_price(self):
        payload = {'product': self.product2.id, 'quantity': 1}
        response = self.client.post(
            _items_url(self.shipment.pk), payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['unit_price']), self.product2.unit_price)

    def test_create_item_without_unit_price_subtotal_correct(self):
        payload = {'product': self.product2.id, 'quantity': 2}
        response = self.client.post(
            _items_url(self.shipment.pk), payload, format='json',
        )
        expected_subtotal = self.product2.unit_price * 2
        self.assertEqual(Decimal(response.data['subtotal']), expected_subtotal)

    def test_create_item_with_explicit_unit_price_overrides_product_price(self):
        payload = {'product': self.product2.id, 'quantity': 1, 'unit_price': '999.00'}
        response = self.client.post(
            _items_url(self.shipment.pk), payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['unit_price']), Decimal('999.00'))

    def test_create_item_recalculates_shipment_weight(self):
        initial_weight = self.shipment.total_weight_kg
        self.client.post(_items_url(self.shipment.pk), self.valid_payload, format='json')
        self.shipment.refresh_from_db()
        # peso del producto2 = 1.20, quantity=3, plus existing item (product weight=2.50, qty=2)
        expected = Decimal('2.50') * 2 + Decimal('1.20') * 3
        self.assertEqual(self.shipment.total_weight_kg, expected)

    def test_create_item_associated_to_correct_shipment(self):
        response = self.client.post(
            _items_url(self.shipment.pk), self.valid_payload, format='json',
        )
        item_id = response.data['id']
        item = ShipmentItem.objects.get(pk=item_id)
        self.assertEqual(item.shipment, self.shipment)

    def test_create_item_missing_product_returns_400(self):
        payload = {'quantity': 3, 'unit_price': '800.00'}
        response = self.client.post(
            _items_url(self.shipment.pk), payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('product', response.data)

    def test_create_item_missing_quantity_returns_400(self):
        payload = {'product': self.product2.id, 'unit_price': '800.00'}
        response = self.client.post(
            _items_url(self.shipment.pk), payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('quantity', response.data)

    def test_create_item_invalid_product_fk_returns_400(self):
        payload = {'product': 99999, 'quantity': 1, 'unit_price': '100.00'}
        response = self.client.post(
            _items_url(self.shipment.pk), payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_inactive_product_returns_400(self):
        inactive_product = _make_product(
            self.warehouse, self.supplier, sku='PRD-INACTIVE',
            is_active=False,
        )
        payload = {'product': inactive_product.id, 'quantity': 1, 'unit_price': '100.00'}
        response = self.client.post(
            _items_url(self.shipment.pk), payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_empty_payload_returns_400(self):
        response = self.client.post(_items_url(self.shipment.pk), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_item_shipment_not_found_returns_404(self):
        response = self.client.post(
            _items_url(99999), self.valid_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_item_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.post(
            _items_url(self.shipment.pk), self.valid_payload, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_item_product_summary_in_response(self):
        response = self.client.post(
            _items_url(self.shipment.pk), self.valid_payload, format='json',
        )
        product_data = response.data['product']
        self.assertIsInstance(product_data, dict)
        self.assertIn('sku', product_data)
        self.assertIn('weight_kg', product_data)


# ---------------------------------------------------------------------------
# PATCH /api/v1/shipments/{id}/items/{item_id}/ — actualizar item
# ---------------------------------------------------------------------------

class ItemDetailPatchTest(BaseItemsTest):

    def test_patch_quantity_returns_200(self):
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'quantity': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 5)

    def test_patch_quantity_updates_subtotal(self):
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'quantity': 5},
            format='json',
        )
        # unit_price=1500.00, quantity=5 -> subtotal=7500.00
        self.assertEqual(Decimal(response.data['subtotal']), Decimal('7500.00'))

    def test_patch_unit_price_returns_200(self):
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'unit_price': '1200.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['unit_price']), Decimal('1200.00'))

    def test_patch_unit_price_updates_subtotal(self):
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'unit_price': '1200.00'},
            format='json',
        )
        # quantity=2, unit_price=1200 -> subtotal=2400
        self.assertEqual(Decimal(response.data['subtotal']), Decimal('2400.00'))

    def test_patch_recalculates_shipment_weight(self):
        self.shipment.recalculate_weight()
        product2 = _make_product(
            self.warehouse, self.supplier, sku='PRD-PATCH',
            weight_kg=Decimal('3.00'), unit_price=Decimal('500.00'),
        )
        self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'product': product2.id, 'quantity': 1},
            format='json',
        )
        self.shipment.refresh_from_db()
        # product2 weight=3.00, quantity=1
        self.assertEqual(self.shipment.total_weight_kg, Decimal('3.00'))

    def test_patch_updates_only_specified_field(self):
        original_unit_price = self.item.unit_price
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'quantity': 10},
            format='json',
        )
        self.assertEqual(response.data['quantity'], 10)
        self.assertEqual(Decimal(response.data['unit_price']), original_unit_price)

    def test_patch_persists_to_database(self):
        self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'quantity': 7},
            format='json',
        )
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 7)

    def test_patch_response_contains_all_fields(self):
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'quantity': 3},
            format='json',
        )
        for field in ['id', 'product', 'quantity', 'unit_price', 'subtotal']:
            self.assertIn(field, response.data)

    def test_patch_item_not_found_returns_404(self):
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, 99999),
            {'quantity': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_shipment_not_found_returns_404(self):
        response = self.client.patch(
            _item_detail_url(99999, self.item.pk),
            {'quantity': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_item_belongs_to_different_shipment_returns_404(self):
        customer2 = _make_customer(name='Otro Patch', email='patch@test.com')
        other_shipment = _make_shipment(customer2, self.warehouse, self.admin)
        product2 = _make_product(
            self.warehouse, self.supplier, sku='PRD-OTH-PATCH',
        )
        other_item = ShipmentItem.objects.create(
            shipment=other_shipment, product=product2,
            quantity=1, unit_price=Decimal('100.00'),
        )
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, other_item.pk),
            {'quantity': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'quantity': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_invalid_product_fk_returns_400(self):
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'product': 99999},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_without_unit_price_auto_assigns_from_product(self):
        product2 = _make_product(
            self.warehouse, self.supplier, sku='PRD-AUTO',
            unit_price=Decimal('2000.00'),
        )
        response = self.client.patch(
            _item_detail_url(self.shipment.pk, self.item.pk),
            {'product': product2.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['unit_price']), Decimal('2000.00'))


# ---------------------------------------------------------------------------
# DELETE /api/v1/shipments/{id}/items/{item_id}/ — eliminar item
# ---------------------------------------------------------------------------

class ItemDetailDeleteTest(BaseItemsTest):

    def test_delete_item_returns_204(self):
        response = self.client.delete(
            _item_detail_url(self.shipment.pk, self.item.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_item_removes_from_database(self):
        item_pk = self.item.pk
        self.client.delete(_item_detail_url(self.shipment.pk, self.item.pk))
        self.assertFalse(ShipmentItem.objects.filter(pk=item_pk).exists())

    def test_delete_item_response_has_no_body(self):
        response = self.client.delete(
            _item_detail_url(self.shipment.pk, self.item.pk),
        )
        self.assertFalse(response.content)

    def test_delete_item_recalculates_shipment_weight(self):
        self.shipment.recalculate_weight()
        initial_weight = self.shipment.total_weight_kg
        self.assertGreater(initial_weight, Decimal('0.00'))
        self.client.delete(_item_detail_url(self.shipment.pk, self.item.pk))
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.total_weight_kg, Decimal('0.00'))

    def test_delete_item_does_not_delete_shipment(self):
        shipment_pk = self.shipment.pk
        self.client.delete(_item_detail_url(self.shipment.pk, self.item.pk))
        self.assertTrue(Shipment.objects.filter(pk=shipment_pk).exists())

    def test_delete_item_not_found_returns_404(self):
        response = self.client.delete(
            _item_detail_url(self.shipment.pk, 99999),
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_shipment_not_found_returns_404(self):
        response = self.client.delete(
            _item_detail_url(99999, self.item.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_item_belongs_to_different_shipment_returns_404(self):
        customer2 = _make_customer(name='OtroDelete', email='delete@test.com')
        other_shipment = _make_shipment(customer2, self.warehouse, self.admin)
        product2 = _make_product(
            self.warehouse, self.supplier, sku='PRD-OTH-DEL',
        )
        other_item = ShipmentItem.objects.create(
            shipment=other_shipment, product=product2,
            quantity=1, unit_price=Decimal('100.00'),
        )
        response = self.client.delete(
            _item_detail_url(self.shipment.pk, other_item.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(ShipmentItem.objects.filter(pk=other_item.pk).exists())

    def test_delete_one_item_does_not_affect_others(self):
        product2 = _make_product(
            self.warehouse, self.supplier, sku='PRD-KEEP',
            unit_price=Decimal('300.00'),
        )
        item2 = ShipmentItem.objects.create(
            shipment=self.shipment, product=product2,
            quantity=1, unit_price=Decimal('300.00'),
        )
        self.client.delete(_item_detail_url(self.shipment.pk, self.item.pk))
        self.assertTrue(ShipmentItem.objects.filter(pk=item2.pk).exists())
        self.assertEqual(self.shipment.items.count(), 1)

    def test_delete_unauthenticated_returns_401(self):
        self.client.credentials()
        response = self.client.delete(
            _item_detail_url(self.shipment.pk, self.item.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
