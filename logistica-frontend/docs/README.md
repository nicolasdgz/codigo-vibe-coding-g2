# Logística Frontend — Docs

Reference documentation for building the frontend against `logistica-api`.

## Backend

- **Framework:** Django 6 + Django REST Framework 3.17
- **Auth:** JWT (djangorestframework-simplejwt)
- **Base URL:** `http://localhost:8000/api/v1/`
- **Swagger UI:** `http://localhost:8000/api/docs/`
- **OpenAPI schema:** `http://localhost:8000/api/schema/`

## Modules

| File | Module | Purpose |
|------|--------|---------|
| [architecture.md](./architecture.md) | — | Stack, auth flow, permissions, pagination |
| [modules/customers.md](./modules/customers.md) | customers | Companies/persons that generate shipments |
| [modules/warehouses.md](./modules/warehouses.md) | warehouses | Storage and dispatch points |
| [modules/suppliers.md](./modules/suppliers.md) | suppliers | Product vendors |
| [modules/products.md](./modules/products.md) | products | Tech inventory |
| [modules/drivers.md](./modules/drivers.md) | drivers | Drivers linked to auth.User |
| [modules/transport.md](./modules/transport.md) | transport | Vehicle fleet |
| [modules/routes.md](./modules/routes.md) | routes | Delivery routes with stops |
| [modules/shipments.md](./modules/shipments.md) | shipments | Core shipment orders (central entity) |

## Relation Map

```
Supplier ──< Product >── Warehouse
                │
Customer ──< Shipment >── ShipmentItem >── Product
                │
             Route ──< RouteStop
                │
           Transport
                │
             Driver ──── User
```
