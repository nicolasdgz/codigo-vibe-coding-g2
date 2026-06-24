# Module: Products

Tech product inventory management.

**Permission:** `IsAdminOrWarehouseStaff` (admin, warehouse_staff)

## Endpoints

```
GET    /api/v1/products/         List (paginated)
POST   /api/v1/products/         Create
GET    /api/v1/products/{id}/    Retrieve
PUT    /api/v1/products/{id}/    Update (full)
PATCH  /api/v1/products/{id}/    Update (partial)
DELETE /api/v1/products/{id}/    Delete
```

## Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `name` | string | max 255 |
| `description` | string \| null | |
| `sku` | string | max 100, unique |
| `weight_kg` | decimal(8,2) | |
| `dimensions` | string \| null | e.g. `"30x20x10 cm"` |
| `unit_price` | decimal(10,2) | |
| `stock` | int | default 0 |
| `supplier` | FK | read: nested object · write: id |
| `warehouse` | FK | read: nested object · write: id |
| `is_active` | boolean | default true |
| `created_at` | ISO datetime | read-only |
| `updated_at` | ISO datetime | read-only |

> **Dual serializer:** GET responses return nested `supplier` and `warehouse` objects. POST/PUT/PATCH bodies send integer IDs.

---

## `GET /api/v1/products/` — List

**Response 200**
```json
{
  "count": 32,
  "next": "http://localhost:8000/api/v1/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 5,
      "name": "Laptop Dell XPS 13",
      "description": "Ultra-portable laptop with SSD",
      "sku": "DELL-XPS-13-2025",
      "weight_kg": "1.23",
      "dimensions": "30x20x1.5 cm",
      "unit_price": "1299.99",
      "stock": 45,
      "supplier": {
        "id": 1,
        "name": "TechSupply Inc"
      },
      "warehouse": {
        "id": 2,
        "name": "Bodega Central",
        "city": "Bogotá"
      },
      "is_active": true,
      "created_at": "2025-05-18T13:20:00Z",
      "updated_at": "2025-05-29T10:00:00Z"
    },
    {
      "id": 6,
      "name": "Mouse Logitech MX Master",
      "description": null,
      "sku": "MOUSE-LGT-MX-2025",
      "weight_kg": "0.10",
      "dimensions": "12x8x4 cm",
      "unit_price": "59.99",
      "stock": 120,
      "supplier": {
        "id": 1,
        "name": "TechSupply Inc"
      },
      "warehouse": {
        "id": 2,
        "name": "Bodega Central",
        "city": "Bogotá"
      },
      "is_active": true,
      "created_at": "2025-05-18T13:25:00Z",
      "updated_at": "2025-05-18T13:25:00Z"
    }
  ]
}
```

---

## `POST /api/v1/products/` — Create

**Request body**
```json
{
  "name": "Laptop Dell XPS 13",
  "description": "Ultra-portable laptop with SSD",
  "sku": "DELL-XPS-13-2025",
  "weight_kg": "1.23",
  "dimensions": "30x20x1.5 cm",
  "unit_price": "1299.99",
  "stock": 45,
  "supplier": 1,
  "warehouse": 2,
  "is_active": true
}
```

**Response 201**
```json
{
  "id": 5,
  "name": "Laptop Dell XPS 13",
  "description": "Ultra-portable laptop with SSD",
  "sku": "DELL-XPS-13-2025",
  "weight_kg": "1.23",
  "dimensions": "30x20x1.5 cm",
  "unit_price": "1299.99",
  "stock": 45,
  "supplier": {
    "id": 1,
    "name": "TechSupply Inc"
  },
  "warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "is_active": true,
  "created_at": "2025-05-30T10:00:00Z",
  "updated_at": "2025-05-30T10:00:00Z"
}
```

---

## `GET /api/v1/products/{id}/` — Retrieve

**Response 200**
```json
{
  "id": 5,
  "name": "Laptop Dell XPS 13",
  "description": "Ultra-portable laptop with SSD",
  "sku": "DELL-XPS-13-2025",
  "weight_kg": "1.23",
  "dimensions": "30x20x1.5 cm",
  "unit_price": "1299.99",
  "stock": 45,
  "supplier": {
    "id": 1,
    "name": "TechSupply Inc"
  },
  "warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "is_active": true,
  "created_at": "2025-05-18T13:20:00Z",
  "updated_at": "2025-05-29T10:00:00Z"
}
```

---

## `PUT /api/v1/products/{id}/` — Update (full)

**Request body** — all fields required
```json
{
  "name": "Laptop Dell XPS 13 Plus",
  "description": "Ultra-portable laptop with SSD 1TB",
  "sku": "DELL-XPS-13-2025",
  "weight_kg": "1.25",
  "dimensions": "30x20x1.5 cm",
  "unit_price": "1399.99",
  "stock": 40,
  "supplier": 1,
  "warehouse": 2,
  "is_active": true
}
```

**Response 200**
```json
{
  "id": 5,
  "name": "Laptop Dell XPS 13 Plus",
  "description": "Ultra-portable laptop with SSD 1TB",
  "sku": "DELL-XPS-13-2025",
  "weight_kg": "1.25",
  "dimensions": "30x20x1.5 cm",
  "unit_price": "1399.99",
  "stock": 40,
  "supplier": {
    "id": 1,
    "name": "TechSupply Inc"
  },
  "warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "is_active": true,
  "created_at": "2025-05-18T13:20:00Z",
  "updated_at": "2025-05-30T11:00:00Z"
}
```

---

## `PATCH /api/v1/products/{id}/` — Update (partial)

**Request body** — only changed fields
```json
{
  "stock": 38,
  "unit_price": "1249.99"
}
```

**Response 200**
```json
{
  "id": 5,
  "name": "Laptop Dell XPS 13",
  "description": "Ultra-portable laptop with SSD",
  "sku": "DELL-XPS-13-2025",
  "weight_kg": "1.23",
  "dimensions": "30x20x1.5 cm",
  "unit_price": "1249.99",
  "stock": 38,
  "supplier": {
    "id": 1,
    "name": "TechSupply Inc"
  },
  "warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "is_active": true,
  "created_at": "2025-05-18T13:20:00Z",
  "updated_at": "2025-05-30T11:05:00Z"
}
```

---

## `DELETE /api/v1/products/{id}/` — Delete

**Response 204** — No content

> **PROTECTED:** Returns 400 if product is referenced in any shipment items.

---

## Filters & Search

| Param | Example |
|---|---|
| `supplier` | `?supplier=1` |
| `warehouse` | `?warehouse=2` |
| `is_active` | `?is_active=true` |
| `search` | `?search=laptop` (name, sku, description) |
| `ordering` | `?ordering=unit_price` \| `?ordering=-stock` |

---

## Error Responses

**400 — Validation error**
```json
{
  "sku": ["product with this sku already exists."],
  "weight_kg": ["Ensure that there are no more than 8 digits in total."]
}
```

**404 — Not found**
```json
{
  "detail": "No Product matches the given query."
}
```
