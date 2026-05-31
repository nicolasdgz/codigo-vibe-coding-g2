from decimal import Decimal
from django.test import TestCase
from django.db import IntegrityError, transaction
from django.contrib.auth.models import User
from django.db.models import ProtectedError
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

def _make_warehouse(name='WH-Main'):
    return Warehouse.objects.create(
        name=name, address='Calle 1', city='Bogotá', country='Colombia', capacity=500,
    )


def _make_customer(name='Cliente S.A.', email='cliente@test.com'):
    return Customer.objects.create(
        name=name, email=email, phone='+57 300 000 0000', address='Calle 10',
        customer_type='company',
    )


def _make_supplier():
    return Supplier.objects.create(
        name='Tech Supplier', email='supplier@test.com', phone='+57 300 111 2222',
        address='Av. Industrial 1', tax_id='TAX-001', contact_name='Pedro',
    )


def _make_product(warehouse, supplier, sku='SKU-001', weight_kg=Decimal('2.50'),
                  unit_price=Decimal('1500.00')):
    return Product.objects.create(
        name='Laptop Pro', sku=sku, weight_kg=weight_kg,
        unit_price=unit_price, supplier=supplier, warehouse=warehouse,
    )


def _make_route(warehouse, username='driver_route'):
    user = User.objects.create_user(username=username, password='pass')
    driver = Driver.objects.create(
        user=user, license_number=f'LIC-{username}', license_expiry='2026-12-31',
        phone='+57 300 000 0000',
    )
    transport = Transport.objects.create(
        plate_number=f'TRK-{username}', vehicle_type='truck', brand='Kenworth',
        model='T680', year=2022, capacity_kg='15000.00', capacity_units=100, driver=driver,
    )
    return Route.objects.create(
        name='Ruta Test', origin_warehouse=warehouse, transport=transport,
        status='planned', scheduled_date='2026-06-01',
    )


def _make_shipment(customer, warehouse, created_by, **kwargs):
    return Shipment.objects.create(
        customer=customer,
        origin_warehouse=warehouse,
        destination_address='Cra. 50 #80-20',
        destination_city='Medellín',
        destination_country='Colombia',
        calculated_cost=Decimal('250.00'),
        created_by=created_by,
        **kwargs,
    )


# ---------------------------------------------------------------------------
# Shipment — lógica del modelo
# ---------------------------------------------------------------------------

class ShipmentModelTest(TestCase):

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='pass',
        )
        self.warehouse = _make_warehouse()
        self.customer = _make_customer()
        self.supplier = _make_supplier()
        self.product = _make_product(self.warehouse, self.supplier)

    # --- __str__ ---

    def test_str_contains_tracking_number_prefix(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertIn('TRK-', str(shipment))

    def test_str_contains_status_display(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertIn('Pending', str(shipment))

    def test_str_format_is_tracking_dash_status(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        expected = f"{shipment.tracking_number} — {shipment.get_status_display()}"
        self.assertEqual(str(shipment), expected)

    def test_str_reflects_status_in_transit(self):
        shipment = _make_shipment(
            self.customer, self.warehouse, self.admin, status='in_transit',
        )
        self.assertIn('In Transit', str(shipment))

    # --- tracking_number auto-generado ---

    def test_tracking_number_auto_generated_on_create(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertTrue(shipment.tracking_number.startswith('TRK-'))

    def test_tracking_number_length_is_correct(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        # 'TRK-' + 10 hex chars = 14
        self.assertEqual(len(shipment.tracking_number), 14)

    def test_tracking_number_not_overwritten_on_save(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        original = shipment.tracking_number
        shipment.destination_city = 'Cali'
        shipment.save()
        shipment.refresh_from_db()
        self.assertEqual(shipment.tracking_number, original)

    def test_tracking_number_unique_constraint(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Shipment.objects.create(
                    tracking_number=shipment.tracking_number,
                    customer=self.customer,
                    origin_warehouse=self.warehouse,
                    destination_address='Otra dir',
                    destination_city='Cali',
                    destination_country='Colombia',
                    calculated_cost=Decimal('100.00'),
                    created_by=self.admin,
                )

    def test_two_shipments_get_different_tracking_numbers(self):
        s1 = _make_shipment(self.customer, self.warehouse, self.admin)
        s2 = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertNotEqual(s1.tracking_number, s2.tracking_number)

    # --- defaults ---

    def test_default_status_is_pending(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertEqual(shipment.status, 'pending')

    def test_default_total_weight_is_zero(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertEqual(shipment.total_weight_kg, Decimal('0.00'))

    def test_default_calculated_cost_is_zero_if_not_provided(self):
        shipment = Shipment.objects.create(
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Dir',
            destination_city='Cali',
            destination_country='Colombia',
            created_by=self.admin,
        )
        self.assertEqual(shipment.calculated_cost, Decimal('0.00'))

    # --- campos opcionales ---

    def test_route_can_be_null(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertIsNone(shipment.route)

    def test_estimated_delivery_can_be_null(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertIsNone(shipment.estimated_delivery)

    def test_actual_delivery_can_be_null(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertIsNone(shipment.actual_delivery)

    def test_notes_can_be_null(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        self.assertIsNone(shipment.notes)

    def test_route_assignment(self):
        route = _make_route(self.warehouse)
        shipment = _make_shipment(self.customer, self.warehouse, self.admin, route=route)
        self.assertEqual(shipment.route, route)

    def test_route_set_null_on_route_delete(self):
        route = _make_route(self.warehouse, username='driver_setnull')
        shipment = _make_shipment(
            self.customer, self.warehouse, self.admin, route=route,
        )
        route_id = route.id
        route.delete()
        shipment.refresh_from_db()
        self.assertIsNone(shipment.route)

    # --- protect ---

    def test_protect_on_customer_delete(self):
        _make_shipment(self.customer, self.warehouse, self.admin)
        with self.assertRaises(ProtectedError):
            with transaction.atomic():
                self.customer.delete()

    def test_protect_on_warehouse_delete(self):
        _make_shipment(self.customer, self.warehouse, self.admin)
        with self.assertRaises(ProtectedError):
            with transaction.atomic():
                self.warehouse.delete()

    def test_protect_on_created_by_delete(self):
        other_user = User.objects.create_user(username='otro', password='pass')
        _make_shipment(self.customer, self.warehouse, other_user)
        with self.assertRaises(ProtectedError):
            with transaction.atomic():
                other_user.delete()

    # --- recalculate_weight ---

    def test_recalculate_weight_single_item(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        ShipmentItem.objects.create(
            shipment=shipment, product=self.product,
            quantity=4, unit_price=Decimal('100.00'),
        )
        shipment.recalculate_weight()
        shipment.refresh_from_db()
        # 4 * 2.50 = 10.00
        self.assertEqual(shipment.total_weight_kg, Decimal('10.00'))

    def test_recalculate_weight_multiple_items(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        ShipmentItem.objects.create(
            shipment=shipment, product=self.product,
            quantity=2, unit_price=Decimal('100.00'),
        )
        ShipmentItem.objects.create(
            shipment=shipment, product=self.product,
            quantity=3, unit_price=Decimal('100.00'),
        )
        shipment.recalculate_weight()
        shipment.refresh_from_db()
        # (2 + 3) * 2.50 = 12.50
        self.assertEqual(shipment.total_weight_kg, Decimal('12.50'))

    def test_recalculate_weight_no_items_returns_zero(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        shipment.recalculate_weight()
        shipment.refresh_from_db()
        self.assertEqual(shipment.total_weight_kg, Decimal('0.00'))

    def test_recalculate_weight_persists_to_db(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        ShipmentItem.objects.create(
            shipment=shipment, product=self.product,
            quantity=1, unit_price=Decimal('100.00'),
        )
        shipment.recalculate_weight()
        reloaded = Shipment.objects.get(pk=shipment.pk)
        self.assertEqual(reloaded.total_weight_kg, Decimal('2.50'))

    def test_recalculate_weight_after_item_deletion(self):
        shipment = _make_shipment(self.customer, self.warehouse, self.admin)
        item = ShipmentItem.objects.create(
            shipment=shipment, product=self.product,
            quantity=3, unit_price=Decimal('100.00'),
        )
        shipment.recalculate_weight()
        item.delete()
        shipment.recalculate_weight()
        shipment.refresh_from_db()
        self.assertEqual(shipment.total_weight_kg, Decimal('0.00'))


# ---------------------------------------------------------------------------
# ShipmentItem — lógica del modelo
# ---------------------------------------------------------------------------

class ShipmentItemModelTest(TestCase):

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin2', email='admin2@test.com', password='pass',
        )
        self.warehouse = _make_warehouse(name='WH-Items')
        self.customer = _make_customer(name='Cliente Items', email='items@test.com')
        self.supplier = _make_supplier()
        self.product = _make_product(self.warehouse, self.supplier, sku='SKU-ITEM')
        self.shipment = _make_shipment(self.customer, self.warehouse, self.admin)

    # --- subtotal calculado en save() ---

    def test_subtotal_computed_on_create(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=3, unit_price=Decimal('100.00'),
        )
        self.assertEqual(item.subtotal, Decimal('300.00'))

    def test_subtotal_computed_correctly_large_values(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=10, unit_price=Decimal('1500.00'),
        )
        self.assertEqual(item.subtotal, Decimal('15000.00'))

    def test_subtotal_recalculated_on_update(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=2, unit_price=Decimal('100.00'),
        )
        item.quantity = 5
        item.save()
        self.assertEqual(item.subtotal, Decimal('500.00'))

    def test_subtotal_recalculated_when_unit_price_changes(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=2, unit_price=Decimal('100.00'),
        )
        item.unit_price = Decimal('200.00')
        item.save()
        self.assertEqual(item.subtotal, Decimal('400.00'))

    # --- __str__ ---

    def test_str_contains_product_name(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=2, unit_price=Decimal('100.00'),
        )
        self.assertIn('Laptop Pro', str(item))

    def test_str_contains_quantity(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=2, unit_price=Decimal('100.00'),
        )
        self.assertIn('x2', str(item))

    def test_str_contains_tracking_number(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=2, unit_price=Decimal('100.00'),
        )
        self.assertIn(self.shipment.tracking_number, str(item))

    # --- CASCADE ---

    def test_items_cascade_on_shipment_delete(self):
        ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=1, unit_price=Decimal('100.00'),
        )
        shipment_id = self.shipment.id
        self.shipment.delete()
        self.assertEqual(ShipmentItem.objects.filter(shipment_id=shipment_id).count(), 0)

    def test_delete_item_does_not_delete_shipment(self):
        item = ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=1, unit_price=Decimal('100.00'),
        )
        item.delete()
        self.assertTrue(Shipment.objects.filter(pk=self.shipment.pk).exists())

    def test_protect_on_product_delete(self):
        ShipmentItem.objects.create(
            shipment=self.shipment, product=self.product,
            quantity=1, unit_price=Decimal('100.00'),
        )
        with self.assertRaises(ProtectedError):
            with transaction.atomic():
                self.product.delete()
