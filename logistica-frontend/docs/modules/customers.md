# Module: Customers

Companies or individuals that generate shipments.

**Permission:** `IsAdminGroup` (admin only)

## Endpoints

```
GET    /api/v1/customers/         List (paginated)
POST   /api/v1/customers/         Create
GET    /api/v1/customers/{id}/    Retrieve
PUT    /api/v1/customers/{id}/    Update (full)
PATCH  /api/v1/customers/{id}/    Update (partial)
DELETE /api/v1/customers/{id}/    Delete
```

## Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `name` | string | max 255 |
| `customer_type` | `"company"` \| `"person"` | |
| `email` | string | unique |
| `phone` | string | max 20 |
| `address` | string | |
| `tax_id` | string \| null | unique |
| `is_active` | boolean | default true |
| `created_at` | ISO datetime | read-only |
| `updated_at` | ISO datetime | read-only |

---

## `GET /api/v1/customers/` — List

**Response 200**
```json
{
  "count": 15,
  "next": "http://localhost:8000/api/v1/customers/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Tech Corp",
      "customer_type": "company",
      "email": "contact@techcorp.com",
      "phone": "+57 300 123 4567",
      "address": "Calle 10 # 20-30",
      "tax_id": "900123456-7",
      "is_active": true,
      "created_at": "2025-05-21T10:30:00Z",
      "updated_at": "2025-05-29T14:15:00Z"
    },
    {
      "id": 2,
      "name": "María López",
      "customer_type": "person",
      "email": "mlopez@gmail.com",
      "phone": "+57 315 987 6543",
      "address": "Carrera 5 # 12-34",
      "tax_id": null,
      "is_active": true,
      "created_at": "2025-05-22T08:00:00Z",
      "updated_at": "2025-05-22T08:00:00Z"
    }
  ]
}
```

---

## `POST /api/v1/customers/` — Create

**Request body**
```json
{
  "name": "Tech Corp",
  "customer_type": "company",
  "email": "contact@techcorp.com",
  "phone": "+57 300 123 4567",
  "address": "Calle 10 # 20-30",
  "tax_id": "900123456-7",
  "is_active": true
}
```

**Response 201**
```json
{
  "id": 1,
  "name": "Tech Corp",
  "customer_type": "company",
  "email": "contact@techcorp.com",
  "phone": "+57 300 123 4567",
  "address": "Calle 10 # 20-30",
  "tax_id": "900123456-7",
  "is_active": true,
  "created_at": "2025-05-30T10:00:00Z",
  "updated_at": "2025-05-30T10:00:00Z"
}
```

---

## `GET /api/v1/customers/{id}/` — Retrieve

**Response 200**
```json
{
  "id": 1,
  "name": "Tech Corp",
  "customer_type": "company",
  "email": "contact@techcorp.com",
  "phone": "+57 300 123 4567",
  "address": "Calle 10 # 20-30",
  "tax_id": "900123456-7",
  "is_active": true,
  "created_at": "2025-05-21T10:30:00Z",
  "updated_at": "2025-05-29T14:15:00Z"
}
```

---

## `PUT /api/v1/customers/{id}/` — Update (full)

**Request body** — all fields required
```json
{
  "name": "Tech Corp SA",
  "customer_type": "company",
  "email": "nuevo@techcorp.com",
  "phone": "+57 300 999 0000",
  "address": "Calle 10 # 20-30 Piso 2",
  "tax_id": "900123456-7",
  "is_active": true
}
```

**Response 200**
```json
{
  "id": 1,
  "name": "Tech Corp SA",
  "customer_type": "company",
  "email": "nuevo@techcorp.com",
  "phone": "+57 300 999 0000",
  "address": "Calle 10 # 20-30 Piso 2",
  "tax_id": "900123456-7",
  "is_active": true,
  "created_at": "2025-05-21T10:30:00Z",
  "updated_at": "2025-05-30T11:00:00Z"
}
```

---

## `PATCH /api/v1/customers/{id}/` — Update (partial)

**Request body** — only changed fields
```json
{
  "phone": "+57 300 999 0000",
  "is_active": false
}
```

**Response 200**
```json
{
  "id": 1,
  "name": "Tech Corp",
  "customer_type": "company",
  "email": "contact@techcorp.com",
  "phone": "+57 300 999 0000",
  "address": "Calle 10 # 20-30",
  "tax_id": "900123456-7",
  "is_active": false,
  "created_at": "2025-05-21T10:30:00Z",
  "updated_at": "2025-05-30T11:05:00Z"
}
```

---

## `DELETE /api/v1/customers/{id}/` — Delete

**Response 204** — No content

> **PROTECTED:** Returns 400 if customer has linked shipments.

---

## Filters & Search

| Param | Example |
|---|---|
| `customer_type` | `?customer_type=company` |
| `is_active` | `?is_active=true` |
| `search` | `?search=Tech` (name, email, tax_id) |
| `ordering` | `?ordering=name` \| `?ordering=-created_at` |

---

## Error Responses

**400 — Validation error**
```json
{
  "email": ["customer with this email already exists."],
  "tax_id": ["customer with this tax id already exists."]
}
```

**400 — Delete protected**
```json
{
  "detail": "Cannot delete customer with existing shipments."
}
```

**404 — Not found**
```json
{
  "detail": "No Customer matches the given query."
}
```
