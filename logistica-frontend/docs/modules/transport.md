# Module: Transport (Vehicles)

Vehicle fleet management.

**Permission:** `IsAdminGroup` (admin only)

## Endpoints

```
GET    /api/v1/transport/         List (paginated)
POST   /api/v1/transport/         Create
GET    /api/v1/transport/{id}/    Retrieve
PUT    /api/v1/transport/{id}/    Update (full)
PATCH  /api/v1/transport/{id}/    Update (partial)
DELETE /api/v1/transport/{id}/    Delete
```

## Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `plate_number` | string | max 20, unique |
| `vehicle_type` | `"truck"` \| `"van"` \| `"motorcycle"` \| `"car"` | |
| `brand` | string | max 100 |
| `model` | string | max 100 |
| `year` | int | |
| `capacity_kg` | decimal(8,2) | max weight capacity |
| `capacity_units` | int | max units capacity |
| `driver` | FK \| null | read: nested object · write: id or null |
| `is_active` | boolean | default true |
| `created_at` | ISO datetime | read-only |
| `updated_at` | ISO datetime | read-only |

> **Dual serializer:** GET responses return nested `driver` object. POST/PUT/PATCH bodies send driver id or null.

---

## `GET /api/v1/transport/` — List

**Response 200**
```json
{
  "count": 6,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 2,
      "plate_number": "ABC-123",
      "vehicle_type": "truck",
      "brand": "Volvo",
      "model": "FH16",
      "year": 2023,
      "capacity_kg": "8000.00",
      "capacity_units": 200,
      "driver": {
        "id": 3,
        "license_number": "LIC-2024-123456",
        "name": "Juan García",
        "is_available": true
      },
      "is_active": true,
      "created_at": "2025-05-22T10:15:00Z",
      "updated_at": "2025-05-29T15:30:00Z"
    },
    {
      "id": 3,
      "plate_number": "XYZ-456",
      "vehicle_type": "van",
      "brand": "Mercedes",
      "model": "Sprinter",
      "year": 2022,
      "capacity_kg": "1500.00",
      "capacity_units": 50,
      "driver": null,
      "is_active": true,
      "created_at": "2025-05-23T09:00:00Z",
      "updated_at": "2025-05-23T09:00:00Z"
    }
  ]
}
```

---

## `POST /api/v1/transport/` — Create

**Request body**
```json
{
  "plate_number": "ABC-123",
  "vehicle_type": "truck",
  "brand": "Volvo",
  "model": "FH16",
  "year": 2023,
  "capacity_kg": "8000.00",
  "capacity_units": 200,
  "driver": 3,
  "is_active": true
}
```

> `driver` can be `null` for unassigned vehicles.

**Response 201**
```json
{
  "id": 2,
  "plate_number": "ABC-123",
  "vehicle_type": "truck",
  "brand": "Volvo",
  "model": "FH16",
  "year": 2023,
  "capacity_kg": "8000.00",
  "capacity_units": 200,
  "driver": {
    "id": 3,
    "license_number": "LIC-2024-123456",
    "name": "Juan García",
    "is_available": true
  },
  "is_active": true,
  "created_at": "2025-05-30T10:00:00Z",
  "updated_at": "2025-05-30T10:00:00Z"
}
```

---

## `GET /api/v1/transport/{id}/` — Retrieve

**Response 200**
```json
{
  "id": 2,
  "plate_number": "ABC-123",
  "vehicle_type": "truck",
  "brand": "Volvo",
  "model": "FH16",
  "year": 2023,
  "capacity_kg": "8000.00",
  "capacity_units": 200,
  "driver": {
    "id": 3,
    "license_number": "LIC-2024-123456",
    "name": "Juan García",
    "is_available": true
  },
  "is_active": true,
  "created_at": "2025-05-22T10:15:00Z",
  "updated_at": "2025-05-29T15:30:00Z"
}
```

---

## `PUT /api/v1/transport/{id}/` — Update (full)

**Request body** — all fields required
```json
{
  "plate_number": "ABC-123",
  "vehicle_type": "truck",
  "brand": "Volvo",
  "model": "FH16 500",
  "year": 2023,
  "capacity_kg": "9000.00",
  "capacity_units": 220,
  "driver": 3,
  "is_active": true
}
```

**Response 200**
```json
{
  "id": 2,
  "plate_number": "ABC-123",
  "vehicle_type": "truck",
  "brand": "Volvo",
  "model": "FH16 500",
  "year": 2023,
  "capacity_kg": "9000.00",
  "capacity_units": 220,
  "driver": {
    "id": 3,
    "license_number": "LIC-2024-123456",
    "name": "Juan García",
    "is_available": true
  },
  "is_active": true,
  "created_at": "2025-05-22T10:15:00Z",
  "updated_at": "2025-05-30T11:00:00Z"
}
```

---

## `PATCH /api/v1/transport/{id}/` — Update (partial)

**Request body** — only changed fields
```json
{
  "driver": null,
  "is_active": false
}
```

**Response 200**
```json
{
  "id": 2,
  "plate_number": "ABC-123",
  "vehicle_type": "truck",
  "brand": "Volvo",
  "model": "FH16",
  "year": 2023,
  "capacity_kg": "8000.00",
  "capacity_units": 200,
  "driver": null,
  "is_active": false,
  "created_at": "2025-05-22T10:15:00Z",
  "updated_at": "2025-05-30T11:05:00Z"
}
```

---

## `DELETE /api/v1/transport/{id}/` — Delete

**Response 204** — No content

> **PROTECTED:** Returns 400 if vehicle is linked to routes.

---

## Filters & Search

| Param | Example |
|---|---|
| `vehicle_type` | `?vehicle_type=truck` |
| `is_active` | `?is_active=true` |
| `driver` | `?driver=3` |
| `search` | `?search=Volvo` (plate_number, brand, model) |
| `ordering` | `?ordering=year` \| `?ordering=-capacity_kg` |

---

## Error Responses

**400 — Validation error**
```json
{
  "plate_number": ["transport with this plate number already exists."],
  "vehicle_type": ["\"bus\" is not a valid choice."]
}
```

**404 — Not found**
```json
{
  "detail": "No Transport matches the given query."
}
```
