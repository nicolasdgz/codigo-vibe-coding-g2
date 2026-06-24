# Module: Warehouses

Storage and dispatch points for products.

**Permission:** `IsAdminOrWarehouseStaff` (admin, warehouse_staff)

## Endpoints

```
GET    /api/v1/warehouses/         List (paginated)
POST   /api/v1/warehouses/         Create
GET    /api/v1/warehouses/{id}/    Retrieve
PUT    /api/v1/warehouses/{id}/    Update (full)
PATCH  /api/v1/warehouses/{id}/    Update (partial)
DELETE /api/v1/warehouses/{id}/    Delete
```

## Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `name` | string | max 255 |
| `address` | string | |
| `city` | string | max 100 |
| `country` | string | max 100 |
| `latitude` | decimal(9,6) \| null | |
| `longitude` | decimal(9,6) \| null | |
| `capacity` | int | max storage units |
| `is_active` | boolean | default true |
| `created_at` | ISO datetime | read-only |
| `updated_at` | ISO datetime | read-only |

---

## `GET /api/v1/warehouses/` — List

**Response 200**
```json
{
  "count": 4,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Bodega Norte",
      "address": "Calle 100 # 15-20",
      "city": "Bogotá",
      "country": "Colombia",
      "latitude": "4.729886",
      "longitude": "-74.046543",
      "capacity": 3000,
      "is_active": true,
      "created_at": "2025-05-10T08:00:00Z",
      "updated_at": "2025-05-10T08:00:00Z"
    },
    {
      "id": 2,
      "name": "Bodega Central",
      "address": "Av. Américas 100",
      "city": "Bogotá",
      "country": "Colombia",
      "latitude": "4.729886",
      "longitude": "-74.102554",
      "capacity": 5000,
      "is_active": true,
      "created_at": "2025-05-15T08:00:00Z",
      "updated_at": "2025-05-28T16:20:00Z"
    }
  ]
}
```

---

## `POST /api/v1/warehouses/` — Create

**Request body**
```json
{
  "name": "Bodega Central",
  "address": "Av. Américas 100",
  "city": "Bogotá",
  "country": "Colombia",
  "latitude": "4.729886",
  "longitude": "-74.102554",
  "capacity": 5000,
  "is_active": true
}
```

> `latitude` and `longitude` are optional — can be omitted or sent as `null`.

**Response 201**
```json
{
  "id": 2,
  "name": "Bodega Central",
  "address": "Av. Américas 100",
  "city": "Bogotá",
  "country": "Colombia",
  "latitude": "4.729886",
  "longitude": "-74.102554",
  "capacity": 5000,
  "is_active": true,
  "created_at": "2025-05-30T10:00:00Z",
  "updated_at": "2025-05-30T10:00:00Z"
}
```

---

## `GET /api/v1/warehouses/{id}/` — Retrieve

**Response 200**
```json
{
  "id": 2,
  "name": "Bodega Central",
  "address": "Av. Américas 100",
  "city": "Bogotá",
  "country": "Colombia",
  "latitude": "4.729886",
  "longitude": "-74.102554",
  "capacity": 5000,
  "is_active": true,
  "created_at": "2025-05-15T08:00:00Z",
  "updated_at": "2025-05-28T16:20:00Z"
}
```

---

## `PUT /api/v1/warehouses/{id}/` — Update (full)

**Request body** — all fields required
```json
{
  "name": "Bodega Central Ampliada",
  "address": "Av. Américas 100",
  "city": "Bogotá",
  "country": "Colombia",
  "latitude": "4.729886",
  "longitude": "-74.102554",
  "capacity": 8000,
  "is_active": true
}
```

**Response 200**
```json
{
  "id": 2,
  "name": "Bodega Central Ampliada",
  "address": "Av. Américas 100",
  "city": "Bogotá",
  "country": "Colombia",
  "latitude": "4.729886",
  "longitude": "-74.102554",
  "capacity": 8000,
  "is_active": true,
  "created_at": "2025-05-15T08:00:00Z",
  "updated_at": "2025-05-30T11:00:00Z"
}
```

---

## `PATCH /api/v1/warehouses/{id}/` — Update (partial)

**Request body** — only changed fields
```json
{
  "capacity": 8000
}
```

**Response 200**
```json
{
  "id": 2,
  "name": "Bodega Central",
  "address": "Av. Américas 100",
  "city": "Bogotá",
  "country": "Colombia",
  "latitude": "4.729886",
  "longitude": "-74.102554",
  "capacity": 8000,
  "is_active": true,
  "created_at": "2025-05-15T08:00:00Z",
  "updated_at": "2025-05-30T11:05:00Z"
}
```

---

## `DELETE /api/v1/warehouses/{id}/` — Delete

**Response 204** — No content

> **PROTECTED:** Returns 400 if warehouse has linked products, routes, or shipments.

---

## Filters & Search

| Param | Example |
|---|---|
| `city` | `?city=Bogotá` |
| `country` | `?country=Colombia` |
| `is_active` | `?is_active=true` |
| `search` | `?search=Central` (name, address, city) |
| `ordering` | `?ordering=capacity` \| `?ordering=-name` |

---

## Error Responses

**400 — Validation error**
```json
{
  "name": ["This field is required."],
  "capacity": ["Ensure this value is greater than or equal to 0."]
}
```

**404 — Not found**
```json
{
  "detail": "No Warehouse matches the given query."
}
```
