from django.test import TestCase
from django.db import transaction
from django.contrib.auth.models import User
from django.db.models import ProtectedError
from apps.warehouses.models import Warehouse
from apps.drivers.models import Driver
from apps.transport.models import Transport
from apps.routes.models import Route, RouteStop


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_warehouse(name='WH-Main', city='Bogotá'):
    return Warehouse.objects.create(
        name=name, address='Calle 1 # 2-3', city=city, country='Colombia', capacity=500,
    )


def _make_transport(plate='TRK-001'):
    user = User.objects.create_user(username=f'driver_{plate}', password='pass123')
    driver = Driver.objects.create(
        user=user,
        license_number=f'LIC-{plate}',
        license_expiry='2027-12-31',
        phone='+57 300 000 0001',
    )
    return Transport.objects.create(
        plate_number=plate,
        vehicle_type='truck',
        brand='Kenworth',
        model='T680',
        year=2022,
        capacity_kg='15000.00',
        capacity_units=100,
        driver=driver,
    )


def _make_route(warehouse, transport, name='Ruta Norte', status='planned'):
    return Route.objects.create(
        name=name,
        origin_warehouse=warehouse,
        transport=transport,
        status=status,
        scheduled_date='2026-06-01',
    )


# ---------------------------------------------------------------------------
# Route model tests
# ---------------------------------------------------------------------------

class RouteModelTest(TestCase):

    def setUp(self):
        self.warehouse = _make_warehouse()
        self.transport = _make_transport()

    def test_str_representation(self):
        route = _make_route(self.warehouse, self.transport, name='Ruta Norte')
        self.assertEqual(str(route), 'Ruta Norte — Planned')

    def test_str_representation_in_progress(self):
        route = _make_route(self.warehouse, self.transport, name='Ruta Sur', status='in_progress')
        self.assertEqual(str(route), 'Ruta Sur — In Progress')

    def test_str_representation_completed(self):
        route = _make_route(self.warehouse, self.transport, name='Ruta Este', status='completed')
        self.assertEqual(str(route), 'Ruta Este — Completed')

    def test_str_representation_cancelled(self):
        route = _make_route(self.warehouse, self.transport, name='Ruta Oeste', status='cancelled')
        self.assertEqual(str(route), 'Ruta Oeste — Cancelled')

    def test_default_status_is_planned(self):
        route = Route.objects.create(
            name='Ruta Default',
            origin_warehouse=self.warehouse,
            transport=self.transport,
            scheduled_date='2026-07-01',
        )
        self.assertEqual(route.status, Route.RouteStatus.PLANNED)
        self.assertEqual(route.status, 'planned')

    def test_create_with_all_valid_statuses(self):
        valid_statuses = ['planned', 'in_progress', 'completed', 'cancelled']
        for i, st in enumerate(valid_statuses):
            route = Route.objects.create(
                name=f'Ruta {st}',
                origin_warehouse=self.warehouse,
                transport=self.transport,
                status=st,
                scheduled_date='2026-08-01',
            )
            self.assertEqual(route.status, st)

    def test_timestamps_auto_generated_on_create(self):
        route = _make_route(self.warehouse, self.transport)
        self.assertIsNotNone(route.created_at)
        self.assertIsNotNone(route.updated_at)

    def test_origin_warehouse_fk_relation(self):
        route = _make_route(self.warehouse, self.transport)
        self.assertEqual(route.origin_warehouse, self.warehouse)
        self.assertEqual(route.origin_warehouse.name, 'WH-Main')

    def test_transport_fk_relation(self):
        route = _make_route(self.warehouse, self.transport)
        self.assertEqual(route.transport, self.transport)
        self.assertEqual(route.transport.plate_number, 'TRK-001')

    def test_route_protect_on_warehouse_delete(self):
        """PROTECT: no se puede eliminar warehouse si tiene rutas asociadas."""
        _make_route(self.warehouse, self.transport)
        with self.assertRaises(ProtectedError):
            with transaction.atomic():
                self.warehouse.delete()

    def test_route_protect_on_transport_delete(self):
        """PROTECT: no se puede eliminar transport si tiene rutas asociadas."""
        _make_route(self.warehouse, self.transport)
        with self.assertRaises(ProtectedError):
            with transaction.atomic():
                self.transport.delete()

    def test_route_status_choices_values(self):
        self.assertEqual(Route.RouteStatus.PLANNED, 'planned')
        self.assertEqual(Route.RouteStatus.IN_PROGRESS, 'in_progress')
        self.assertEqual(Route.RouteStatus.COMPLETED, 'completed')
        self.assertEqual(Route.RouteStatus.CANCELLED, 'cancelled')

    def test_multiple_routes_per_warehouse(self):
        route1 = _make_route(self.warehouse, self.transport, name='Ruta A')
        transport2 = _make_transport(plate='TRK-002')
        route2 = _make_route(self.warehouse, transport2, name='Ruta B')
        routes = Route.objects.filter(origin_warehouse=self.warehouse)
        self.assertEqual(routes.count(), 2)

    def test_scheduled_date_stored_correctly(self):
        route = Route.objects.create(
            name='Ruta Fecha',
            origin_warehouse=self.warehouse,
            transport=self.transport,
            scheduled_date='2026-09-15',
        )
        self.assertEqual(str(route.scheduled_date), '2026-09-15')


# ---------------------------------------------------------------------------
# RouteStop model tests
# ---------------------------------------------------------------------------

class RouteStopModelTest(TestCase):

    def setUp(self):
        self.warehouse = _make_warehouse()
        self.transport = _make_transport()
        self.route = _make_route(self.warehouse, self.transport)

    def test_str_representation(self):
        stop = RouteStop.objects.create(
            route=self.route, order=1, address='Av. Principal 100', city='Medellín',
        )
        self.assertEqual(str(stop), 'Stop 1 — Medellín (Ruta Norte)')

    def test_str_representation_second_stop(self):
        stop = RouteStop.objects.create(
            route=self.route, order=2, address='Carrera 10 # 20-30', city='Cali',
        )
        self.assertEqual(str(stop), 'Stop 2 — Cali (Ruta Norte)')

    def test_ordering_by_order_field(self):
        RouteStop.objects.create(route=self.route, order=3, address='C', city='Cali')
        RouteStop.objects.create(route=self.route, order=1, address='A', city='Bogotá')
        RouteStop.objects.create(route=self.route, order=2, address='B', city='Medellín')
        orders = list(self.route.stops.values_list('order', flat=True))
        self.assertEqual(orders, [1, 2, 3])

    def test_estimated_arrival_is_nullable(self):
        stop = RouteStop.objects.create(
            route=self.route, order=1, address='Dirección A', city='Bogotá',
            estimated_arrival=None,
        )
        self.assertIsNone(stop.estimated_arrival)

    def test_actual_arrival_is_nullable(self):
        stop = RouteStop.objects.create(
            route=self.route, order=1, address='Dirección B', city='Bogotá',
            actual_arrival=None,
        )
        self.assertIsNone(stop.actual_arrival)

    def test_create_stop_with_both_datetimes(self):
        stop = RouteStop.objects.create(
            route=self.route,
            order=1,
            address='Terminal de Carga Norte',
            city='Barranquilla',
            estimated_arrival='2026-06-01 08:00:00',
            actual_arrival='2026-06-01 09:15:00',
        )
        self.assertIsNotNone(stop.estimated_arrival)
        self.assertIsNotNone(stop.actual_arrival)

    def test_stops_cascade_on_route_delete(self):
        """CASCADE: eliminar ruta elimina todos sus stops."""
        RouteStop.objects.create(route=self.route, order=1, address='Av. 1', city='Bogotá')
        RouteStop.objects.create(route=self.route, order=2, address='Av. 2', city='Cali')
        route_id = self.route.id
        self.route.delete()
        self.assertEqual(RouteStop.objects.filter(route_id=route_id).count(), 0)

    def test_multiple_stops_per_route(self):
        for i in range(1, 6):
            RouteStop.objects.create(
                route=self.route, order=i, address=f'Dirección {i}', city=f'Ciudad {i}',
            )
        self.assertEqual(self.route.stops.count(), 5)

    def test_stop_route_fk_relation(self):
        stop = RouteStop.objects.create(
            route=self.route, order=1, address='Av. El Poblado', city='Medellín',
        )
        self.assertEqual(stop.route, self.route)
        self.assertEqual(stop.route.name, 'Ruta Norte')

    def test_stops_accessible_via_related_name(self):
        stop1 = RouteStop.objects.create(route=self.route, order=1, address='Dir A', city='Bogotá')
        stop2 = RouteStop.objects.create(route=self.route, order=2, address='Dir B', city='Medellín')
        self.assertIn(stop1, self.route.stops.all())
        self.assertIn(stop2, self.route.stops.all())
