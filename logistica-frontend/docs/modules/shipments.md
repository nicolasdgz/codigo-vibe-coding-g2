# Module: Shipments

Central business entity — represents a product shipment from origin to destination.

**Permission:** `IsAdminGroup` (admin only)

## Endpoints

### Shipment CRUD
```
GET    /api/v1/shipments/                           List (paginated)
POST   /api/v1/shipments/                           Create
GET    /api/v1/shipments/{id}/                      Retrieve
PUT    /api/v1/shipments/{id}/                      Update (full)
PATCH  /api/v1/shipments/{id}/                      Update (partial)
DELETE /api/v1/shipments/{id}/                      Delete
```

### Item Management (nested)
```
GET    /api/v1/shipments/{id}/items/                List items
POST   /api/v1/shipments/{id}/items/                Add item
PATCH  /api/v1/shipments/{id}/items/{item_id}/      Update item
DELETE /api/v1/shipments/{id}/items/{item_id}/      Remove item
```

## Shipment Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `tracking_number` | string | auto-generated `TRK-XXXXXXXXXX`, read-only |
| `customer` | FK | read: nested · write: id |
| `origin_warehouse` | FK | read: nested · write: id |
| `destination_address` | string | |
| `destination_city` | string | max 100 |
| `destination_country` | string | max 100 |
| `status` | enum | `pending` \| `in_transit` \| `delivered` \| `cancelled` \| `returned` |
| `route` | FK \| null | read: nested · write: id or null |
| `estimated_delivery` | date \| null | `YYYY-MM-DD` |
| `actual_delivery` | ISO datetime \| null | |
| `total_weight_kg` | decimal(8,2) | auto-calculated, read-only |
| `calculated_cost` | decimal(10,2) | |
| `notes` | string \| null | |
| `created_by` | nested user | auto-filled from JWT, read-only |
| `items` | array | read-only on shipment; managed via `/items/` endpoints |
| `created_at` | ISO datetime | read-only |
| `updated_at` | ISO datetime | read-only |

## ShipmentItem Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `product` | FK | read: nested · write: id |
| `quantity` | int | positive |
| `unit_price` | decimal(10,2) | snapshot; defaults to `product.unit_price` if omitted |
| `subtotal` | decimal(10,2) | auto-calculated = quantity × unit_price, read-only |

## Status Lifecycle

```
pending → in_transit → delivered
        ↘             ↗
          cancelled / returned
```

---

## `GET /api/v1/shipments/` — List

**Response 200**
```json
{
  "count": 87,
  "next": "http://localhost:8000/api/v1/shipments/?page=2",
  "previous": null,
  "results": [
    {
      "id": 15,
      "tracking_number": "TRK-7F2A9C1E30",
      "customer": {
        "id": 1,
        "name": "Tech Corp",
        "email": "contact@techcorp.com",
        "customer_type": "company"
      },
      "origin_warehouse": {
        "id": 2,
        "name": "Bodega Central",
        "city": "Bogotá"
      },
      "destination_address": "Carrera 80 # 15-45",
      "destination_city": "Medellín",
      "destination_country": "Colombia",
      "status": "in_transit",
      "route": {
        "id": 1,
        "name": "Ruta Bogotá - Medellín",
        "status": "in_progress"
      },
      "estimated_delivery": "2025-06-05",
      "actual_delivery": null,
      "total_weight_kg": "2.56",
      "calculated_cost": "125000.00",
      "notes": "Frágil",
      "created_by": {
        "id": 5,
        "username": "admin",
        "email": "admin@logistics.com"
      },
      "items": [
        {
          "id": 42,
          "product": {
            "id": 5,
            "name": "Laptop Dell XPS 13",
            "sku": "DELL-XPS-13-2025",
            "weight_kg": "1.23"
          },
          "quantity": 2,
          "unit_price": "1299.99",
          "subtotal": "2599.98"
        }
      ],
      "created_at": "2025-05-29T08:30:00Z",
      "updated_at": "2025-05-29T15:20:00Z"
    }
  ]
}
```

---

## `POST /api/v1/shipments/` — Create

**Request body**
```json
{
  "customer": 1,
  "origin_warehouse": 2,
  "destination_address": "Carrera 80 # 15-45",
  "destination_city": "Medellín",
  "destination_country": "Colombia",
  "status": "pending",
  "route": null,
  "estimated_delivery": "2025-06-05",
  "calculated_cost": "125000.00",
  "notes": "Frágil"
}
```

> `tracking_number` auto-generated. `created_by` auto-filled from JWT user. Items added separately via `/items/`.

**Response 201**
```json
{
  "id": 15,
  "tracking_number": "TRK-7F2A9C1E30",
  "customer": {
    "id": 1,
    "name": "Tech Corp",
    "email": "contact@techcorp.com",
    "customer_type": "company"
  },
  "origin_warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "destination_address": "Carrera 80 # 15-45",
  "destination_city": "Medellín",
  "destination_country": "Colombia",
  "status": "pending",
  "route": null,
  "estimated_delivery": "2025-06-05",
  "actual_delivery": null,
  "total_weight_kg": "0.00",
  "calculated_cost": "125000.00",
  "notes": "Frágil",
  "created_by": {
    "id": 5,
    "username": "admin",
    "email": "admin@logistics.com"
  },
  "items": [],
  "created_at": "2025-05-30T10:00:00Z",
  "updated_at": "2025-05-30T10:00:00Z"
}
```

---

## `GET /api/v1/shipments/{id}/` — Retrieve

**Response 200**
```json
{
  "id": 15,
  "tracking_number": "TRK-7F2A9C1E30",
  "customer": {
    "id": 1,
    "name": "Tech Corp",
    "email": "contact@techcorp.com",
    "customer_type": "company"
  },
  "origin_warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "destination_address": "Carrera 80 # 15-45",
  "destination_city": "Medellín",
  "destination_country": "Colombia",
  "status": "in_transit",
  "route": {
    "id": 1,
    "name": "Ruta Bogotá - Medellín",
    "status": "in_progress"
  },
  "estimated_delivery": "2025-06-05",
  "actual_delivery": null,
  "total_weight_kg": "8.50",
  "calculated_cost": "125000.00",
  "notes": "Frágil - Requiere cuidado especial",
  "created_by": {
    "id": 5,
    "username": "admin",
    "email": "admin@logistics.com"
  },
  "items": [
    {
      "id": 42,
      "product": {
        "id": 5,
        "name": "Laptop Dell XPS 13",
        "sku": "DELL-XPS-13-2025",
        "weight_kg": "1.23"
      },
      "quantity": 2,
      "unit_price": "1299.99",
      "subtotal": "2599.98"
    },
    {
      "id": 43,
      "product": {
        "id": 6,
        "name": "Mouse Logitech MX Master",
        "sku": "MOUSE-LGT-MX-2025",
        "weight_kg": "0.10"
      },
      "quantity": 5,
      "unit_price": "59.99",
      "subtotal": "299.95"
    }
  ],
  "created_at": "2025-05-29T08:30:00Z",
  "updated_at": "2025-05-29T15:20:00Z"
}
```

---

## `PUT /api/v1/shipments/{id}/` — Update (full)

**Request body** — all writable fields required
```json
{
  "customer": 1,
  "origin_warehouse": 2,
  "destination_address": "Carrera 80 # 15-45 Apto 301",
  "destination_city": "Medellín",
  "destination_country": "Colombia",
  "status": "in_transit",
  "route": 1,
  "estimated_delivery": "2025-06-06",
  "calculated_cost": "130000.00",
  "notes": "Frágil - Requiere cuidado especial"
}
```

**Response 200** — same shape as Retrieve

---

## `PATCH /api/v1/shipments/{id}/` — Update (partial)

**Request body** — only changed fields

*Assign route and dispatch:*
```json
{
  "status": "in_transit",
  "route": 1
}
```

*Mark delivered:*
```json
{
  "status": "delivered",
  "actual_delivery": "2025-06-05T14:30:00Z"
}
```

*Cancel:*
```json
{
  "status": "cancelled"
}
```

**Response 200** — same shape as Retrieve

---

## `DELETE /api/v1/shipments/{id}/` — Delete

**Response 204** — No content

> Items cascade-deleted automatically.

---

## `GET /api/v1/shipments/{id}/items/` — List Items

**Response 200**
```json
[
  {
    "id": 42,
    "product": {
      "id": 5,
      "name": "Laptop Dell XPS 13",
      "sku": "DELL-XPS-13-2025",
      "weight_kg": "1.23"
    },
    "quantity": 2,
    "unit_price": "1299.99",
    "subtotal": "2599.98"
  },
  {
    "id": 43,
    "product": {
      "id": 6,
      "name": "Mouse Logitech MX Master",
      "sku": "MOUSE-LGT-MX-2025",
      "weight_kg": "0.10"
    },
    "quantity": 5,
    "unit_price": "59.99",
    "subtotal": "299.95"
  }
]
```

---

## `POST /api/v1/shipments/{id}/items/` — Add Item

**Request body**
```json
{
  "product": 5,
  "quantity": 2,
  "unit_price": 1299.99
}
```

> Omit `unit_price` to use current `product.unit_price` as default.  
> Adding an item recalculates `shipment.total_weight_kg`.

**Response 201**
```json
{
  "id": 42,
  "product": {
    "id": 5,
    "name": "Laptop Dell XPS 13",
    "sku": "DELL-XPS-13-2025",
    "weight_kg": "1.23"
  },
  "quantity": 2,
  "unit_price": "1299.99",
  "subtotal": "2599.98"
}
```

---

## `PATCH /api/v1/shipments/{id}/items/{item_id}/` — Update Item

**Request body** — only changed fields
```json
{
  "quantity": 3
}
```

**Response 200**
```json
{
  "id": 42,
  "product": {
    "id": 5,
    "name": "Laptop Dell XPS 13",
    "sku": "DELL-XPS-13-2025",
    "weight_kg": "1.23"
  },
  "quantity": 3,
  "unit_price": "1299.99",
  "subtotal": "3899.97"
}
```

---

## `DELETE /api/v1/shipments/{id}/items/{item_id}/` — Remove Item

**Response 204** — No content

> Recalculates `shipment.total_weight_kg` after removal.

---

## Auto-Calculation Rules

| Field | Rule |
|---|---|
| `tracking_number` | `TRK-{uuid.hex[:10].upper()}` on first save |
| `total_weight_kg` | `sum(product.weight_kg × item.quantity)` — recalculated on item add/update/delete |
| `item.subtotal` | `quantity × unit_price` — recalculated on item save |

---

## Filters & Search

| Param | Example |
|---|---|
| `status` | `?status=pending` |
| `customer` | `?customer=1` |
| `origin_warehouse` | `?origin_warehouse=2` |
| `route` | `?route=1` |
| `search` | `?search=TRK-7F2A` (tracking_number, destination_city, destination_country) |
| `ordering` | `?ordering=-created_at` \| `?ordering=total_weight_kg` |

---

## Error Responses

**400 — Validation error**
```json
{
  "customer": ["This field is required."],
  "status": ["\"unknown\" is not a valid choice."]
}
```

**400 — Protected item**
```json
{
  "detail": "Cannot delete product referenced in shipment items."
}
```

**404 — Not found**
```json
{
  "detail": "No Shipment matches the given query."
}
```
