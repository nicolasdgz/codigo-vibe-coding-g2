# Backend Architecture

## Stack

| Layer | Tech |
|---|---|
| Framework | Django 6.0.5 + DRF 3.17.1 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT via djangorestframework-simplejwt |
| API Docs | drf-spectacular (Swagger UI at `/api/docs/`) |
| Config | python-decouple |

## Auth Flow

### `POST /auth/token/` — Obtain Token

**Request body**
```json
{
  "username": "admin",
  "password": "secret123"
}
```

**Response 200**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1fQ.abc123",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1fQ.xyz456"
}
```

**Response 401** — invalid credentials
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

### `POST /auth/token/refresh/` — Refresh Access Token

**Request body**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1fQ.xyz456"
}
```

**Response 200**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1fQ.newtoken"
}
```

**Response 401** — expired or invalid refresh token
```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

---

### Use Token in All Requests

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 401** — missing or expired access token
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Response 403** — authenticated but insufficient permissions
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**Lifetimes:** access = 1h · refresh = 1d

## Permission Groups

| Group | Access |
|---|---|
| `admin` | Full CRUD all modules |
| `warehouse_staff` | CRUD on warehouses, products, shipments |
| `driver` | Read-only on routes + assigned shipments |

**Per-module permission:**
- `IsAdminGroup` (admin only): customers, suppliers, drivers, transport, routes, shipments
- `IsAdminOrWarehouseStaff`: warehouses, products

## Pagination

All list endpoints return:
```json
{
  "count": 87,
  "next": "http://api/v1/module/?page=2",
  "previous": null,
  "results": [...]
}
```

Default page size: **20 items**.

## Filtering

All list endpoints support:
- `?field=value` — filter
- `?search=term` — full-text search (module-specific fields)
- `?ordering=field` or `?ordering=-field` — sort asc/desc

## Error Shapes

```json
// 4xx validation
{ "field_name": ["Error message"] }

// 401/403/404
{ "detail": "Not found." }
```

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Validation error |
| 401 | Missing / invalid JWT |
| 403 | Insufficient permissions |
| 404 | Not found |

## Serializer Pattern

Backend uses **dual serializers**:
- Read: nested related objects (e.g., `supplier: { id, name }`)
- Write: accepts FK ids (e.g., `"supplier": 1`)

This means **GET responses include nested objects** but **POST/PUT/PATCH bodies send plain IDs**.

## Data Relation Map

```
Supplier ──< Product >── Warehouse
                │
Customer ──< Shipment >── ShipmentItem >── Product
                │
             Route ──< RouteStop
                │
           Transport
                │
             Driver ──── User (auth.User)
```

## Cascading Rules

| Delete | Behaviour |
|---|---|
| Route deleted | Stops cascade-deleted |
| Shipment deleted | Items cascade-deleted |
| Customer / Warehouse / Supplier / Product / Driver deleted | PROTECTED — will error if linked records exist |
| Driver deleted from Transport | transport.driver → NULL (SET_NULL) |
| Route deleted from Shipment | shipment.route → NULL (SET_NULL) |
