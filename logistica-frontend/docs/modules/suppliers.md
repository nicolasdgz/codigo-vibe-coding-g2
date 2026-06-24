# Module: Suppliers

Product vendors/suppliers.

**Permission:** `IsAdminGroup` (admin only)

## Endpoints

```
GET    /api/v1/suppliers/         List (paginated)
POST   /api/v1/suppliers/         Create
GET    /api/v1/suppliers/{id}/    Retrieve
PUT    /api/v1/suppliers/{id}/    Update (full)
PATCH  /api/v1/suppliers/{id}/    Update (partial)
DELETE /api/v1/suppliers/{id}/    Delete
```

## Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `name` | string | max 255 |
| `email` | string | |
| `phone` | string | max 20 |
| `address` | string | |
| `tax_id` | string | max 50, unique |
| `contact_name` | string | max 255 |
| `is_active` | boolean | default true |
| `created_at` | ISO datetime | read-only |
| `updated_at` | ISO datetime | read-only |

---

## `GET /api/v1/suppliers/` — List

**Response 200**
```json
{
  "count": 8,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "TechSupply Inc",
      "email": "sales@techsupply.com",
      "phone": "+57 310 987 6543",
      "address": "Calle 80 # 15-45",
      "tax_id": "800654321-2",
      "contact_name": "Juan Pérez",
      "is_active": true,
      "created_at": "2025-05-10T09:15:00Z",
      "updated_at": "2025-05-27T11:40:00Z"
    },
    {
      "id": 2,
      "name": "Global Devices SAS",
      "email": "info@globaldevices.co",
      "phone": "+57 320 111 2222",
      "address": "Av. El Dorado 50-20",
      "tax_id": "901234567-1",
      "contact_name": "Ana Martínez",
      "is_active": true,
      "created_at": "2025-05-12T10:00:00Z",
      "updated_at": "2025-05-12T10:00:00Z"
    }
  ]
}
```

---

## `POST /api/v1/suppliers/` — Create

**Request body**
```json
{
  "name": "TechSupply Inc",
  "email": "sales@techsupply.com",
  "phone": "+57 310 987 6543",
  "address": "Calle 80 # 15-45",
  "tax_id": "800654321-2",
  "contact_name": "Juan Pérez",
  "is_active": true
}
```

**Response 201**
```json
{
  "id": 1,
  "name": "TechSupply Inc",
  "email": "sales@techsupply.com",
  "phone": "+57 310 987 6543",
  "address": "Calle 80 # 15-45",
  "tax_id": "800654321-2",
  "contact_name": "Juan Pérez",
  "is_active": true,
  "created_at": "2025-05-30T10:00:00Z",
  "updated_at": "2025-05-30T10:00:00Z"
}
```

---

## `GET /api/v1/suppliers/{id}/` — Retrieve

**Response 200**
```json
{
  "id": 1,
  "name": "TechSupply Inc",
  "email": "sales@techsupply.com",
  "phone": "+57 310 987 6543",
  "address": "Calle 80 # 15-45",
  "tax_id": "800654321-2",
  "contact_name": "Juan Pérez",
  "is_active": true,
  "created_at": "2025-05-10T09:15:00Z",
  "updated_at": "2025-05-27T11:40:00Z"
}
```

---

## `PUT /api/v1/suppliers/{id}/` — Update (full)

**Request body** — all fields required
```json
{
  "name": "TechSupply International",
  "email": "ventas@techsupply.com",
  "phone": "+57 310 987 6543",
  "address": "Calle 80 # 15-45 Piso 3",
  "tax_id": "800654321-2",
  "contact_name": "Juan Pérez",
  "is_active": true
}
```

**Response 200**
```json
{
  "id": 1,
  "name": "TechSupply International",
  "email": "ventas@techsupply.com",
  "phone": "+57 310 987 6543",
  "address": "Calle 80 # 15-45 Piso 3",
  "tax_id": "800654321-2",
  "contact_name": "Juan Pérez",
  "is_active": true,
  "created_at": "2025-05-10T09:15:00Z",
  "updated_at": "2025-05-30T11:00:00Z"
}
```

---

## `PATCH /api/v1/suppliers/{id}/` — Update (partial)

**Request body** — only changed fields
```json
{
  "contact_name": "Carlos Rodríguez",
  "phone": "+57 310 000 1111"
}
```

**Response 200**
```json
{
  "id": 1,
  "name": "TechSupply Inc",
  "email": "sales@techsupply.com",
  "phone": "+57 310 000 1111",
  "address": "Calle 80 # 15-45",
  "tax_id": "800654321-2",
  "contact_name": "Carlos Rodríguez",
  "is_active": true,
  "created_at": "2025-05-10T09:15:00Z",
  "updated_at": "2025-05-30T11:05:00Z"
}
```

---

## `DELETE /api/v1/suppliers/{id}/` — Delete

**Response 204** — No content

> **PROTECTED:** Returns 400 if supplier has linked products.

---

## Filters & Search

| Param | Example |
|---|---|
| `is_active` | `?is_active=true` |
| `search` | `?search=Tech` (name, email, tax_id, contact_name) |
| `ordering` | `?ordering=name` \| `?ordering=-created_at` |

---

## Error Responses

**400 — Validation error**
```json
{
  "tax_id": ["supplier with this tax id already exists."],
  "email": ["Enter a valid email address."]
}
```

**404 — Not found**
```json
{
  "detail": "No Supplier matches the given query."
}
```
