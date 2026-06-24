# Module: Routes

Delivery routes composed of sequential stops.

**Permission:** `IsAdminGroup` (admin only)

## Endpoints

### Route CRUD
```
GET    /api/v1/routes/                          List (paginated)
POST   /api/v1/routes/                          Create
GET    /api/v1/routes/{id}/                     Retrieve (nested stops)
PUT    /api/v1/routes/{id}/                     Update (full)
PATCH  /api/v1/routes/{id}/                     Update (partial)
DELETE /api/v1/routes/{id}/                     Delete
```

### Stop Management (nested)
```
GET    /api/v1/routes/{id}/stops/               List stops
POST   /api/v1/routes/{id}/stops/               Add stop
PATCH  /api/v1/routes/{id}/stops/{stop_id}/     Update stop
DELETE /api/v1/routes/{id}/stops/{stop_id}/     Remove stop
```

## Route Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `name` | string | max 255 |
| `origin_warehouse` | FK | read: nested · write: id |
| `transport` | FK | read: nested · write: id |
| `status` | `"planned"` \| `"in_progress"` \| `"completed"` \| `"cancelled"` | |
| `scheduled_date` | date | `YYYY-MM-DD` |
| `stops` | array | read-only on route; managed via `/stops/` endpoints |
| `created_at` | ISO datetime | read-only |
| `updated_at` | ISO datetime | read-only |

## RouteStop Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `order` | int | sequence position (1, 2, 3…) |
| `address` | string | |
| `city` | string | max 100 |
| `estimated_arrival` | ISO datetime \| null | |
| `actual_arrival` | ISO datetime \| null | filled when stop is reached |

## Status Lifecycle

```
planned → in_progress → completed
        ↘             ↗
          cancelled
```

---

## `GET /api/v1/routes/` — List

**Response 200**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Ruta Bogotá - Medellín",
      "origin_warehouse": {
        "id": 2,
        "name": "Bodega Central",
        "city": "Bogotá"
      },
      "transport": {
        "id": 2,
        "plate_number": "ABC-123",
        "vehicle_type": "truck",
        "brand": "Volvo"
      },
      "status": "planned",
      "scheduled_date": "2025-06-05",
      "stops": [
        {
          "id": 10,
          "order": 1,
          "address": "Calle 1 # 10-20",
          "city": "Soacha",
          "estimated_arrival": "2025-06-05T10:00:00Z",
          "actual_arrival": null
        },
        {
          "id": 11,
          "order": 2,
          "address": "Carrera 50 # 80-90",
          "city": "Medellín",
          "estimated_arrival": "2025-06-05T18:00:00Z",
          "actual_arrival": null
        }
      ],
      "created_at": "2025-05-25T11:00:00Z",
      "updated_at": "2025-05-29T14:45:00Z"
    }
  ]
}
```

---

## `POST /api/v1/routes/` — Create

**Request body**
```json
{
  "name": "Ruta Bogotá - Medellín",
  "origin_warehouse": 2,
  "transport": 2,
  "status": "planned",
  "scheduled_date": "2025-06-05"
}
```

**Response 201**
```json
{
  "id": 1,
  "name": "Ruta Bogotá - Medellín",
  "origin_warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "transport": {
    "id": 2,
    "plate_number": "ABC-123",
    "vehicle_type": "truck",
    "brand": "Volvo"
  },
  "status": "planned",
  "scheduled_date": "2025-06-05",
  "stops": [],
  "created_at": "2025-05-30T10:00:00Z",
  "updated_at": "2025-05-30T10:00:00Z"
}
```

---

## `GET /api/v1/routes/{id}/` — Retrieve

**Response 200**
```json
{
  "id": 1,
  "name": "Ruta Bogotá - Medellín",
  "origin_warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "transport": {
    "id": 2,
    "plate_number": "ABC-123",
    "vehicle_type": "truck",
    "brand": "Volvo"
  },
  "status": "planned",
  "scheduled_date": "2025-06-05",
  "stops": [
    {
      "id": 10,
      "order": 1,
      "address": "Calle 1 # 10-20",
      "city": "Soacha",
      "estimated_arrival": "2025-06-05T10:00:00Z",
      "actual_arrival": null
    },
    {
      "id": 11,
      "order": 2,
      "address": "Carrera 50 # 80-90",
      "city": "Medellín",
      "estimated_arrival": "2025-06-05T18:00:00Z",
      "actual_arrival": null
    }
  ],
  "created_at": "2025-05-25T11:00:00Z",
  "updated_at": "2025-05-29T14:45:00Z"
}
```

---

## `PUT /api/v1/routes/{id}/` — Update (full)

**Request body** — all fields required
```json
{
  "name": "Ruta Bogotá - Medellín Express",
  "origin_warehouse": 2,
  "transport": 2,
  "status": "planned",
  "scheduled_date": "2025-06-06"
}
```

**Response 200**
```json
{
  "id": 1,
  "name": "Ruta Bogotá - Medellín Express",
  "origin_warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "transport": {
    "id": 2,
    "plate_number": "ABC-123",
    "vehicle_type": "truck",
    "brand": "Volvo"
  },
  "status": "planned",
  "scheduled_date": "2025-06-06",
  "stops": [...],
  "created_at": "2025-05-25T11:00:00Z",
  "updated_at": "2025-05-30T11:00:00Z"
}
```

---

## `PATCH /api/v1/routes/{id}/` — Update (partial)

**Request body** — only changed fields
```json
{
  "status": "in_progress"
}
```

**Response 200**
```json
{
  "id": 1,
  "name": "Ruta Bogotá - Medellín",
  "origin_warehouse": {
    "id": 2,
    "name": "Bodega Central",
    "city": "Bogotá"
  },
  "transport": {
    "id": 2,
    "plate_number": "ABC-123",
    "vehicle_type": "truck",
    "brand": "Volvo"
  },
  "status": "in_progress",
  "scheduled_date": "2025-06-05",
  "stops": [...],
  "created_at": "2025-05-25T11:00:00Z",
  "updated_at": "2025-05-30T11:05:00Z"
}
```

---

## `DELETE /api/v1/routes/{id}/` — Delete

**Response 204** — No content

> Stops cascade-deleted automatically.  
> **PROTECTED:** Returns 400 if route is linked to shipments.

---

## `GET /api/v1/routes/{id}/stops/` — List Stops

**Response 200**
```json
[
  {
    "id": 10,
    "order": 1,
    "address": "Calle 1 # 10-20",
    "city": "Soacha",
    "estimated_arrival": "2025-06-05T10:00:00Z",
    "actual_arrival": null
  },
  {
    "id": 11,
    "order": 2,
    "address": "Carrera 50 # 80-90",
    "city": "Medellín",
    "estimated_arrival": "2025-06-05T18:00:00Z",
    "actual_arrival": null
  }
]
```

---

## `POST /api/v1/routes/{id}/stops/` — Add Stop

**Request body**
```json
{
  "order": 1,
  "address": "Calle 1 # 10-20",
  "city": "Soacha",
  "estimated_arrival": "2025-06-05T10:00:00Z"
}
```

> `estimated_arrival` is optional.

**Response 201**
```json
{
  "id": 10,
  "order": 1,
  "address": "Calle 1 # 10-20",
  "city": "Soacha",
  "estimated_arrival": "2025-06-05T10:00:00Z",
  "actual_arrival": null
}
```

---

## `PATCH /api/v1/routes/{id}/stops/{stop_id}/` — Update Stop

**Request body** — only changed fields
```json
{
  "actual_arrival": "2025-06-05T09:45:00Z"
}
```

**Response 200**
```json
{
  "id": 10,
  "order": 1,
  "address": "Calle 1 # 10-20",
  "city": "Soacha",
  "estimated_arrival": "2025-06-05T10:00:00Z",
  "actual_arrival": "2025-06-05T09:45:00Z"
}
```

---

## `DELETE /api/v1/routes/{id}/stops/{stop_id}/` — Remove Stop

**Response 204** — No content

---

## Filters & Search

| Param | Example |
|---|---|
| `status` | `?status=in_progress` |
| `transport` | `?transport=2` |
| `origin_warehouse` | `?origin_warehouse=2` |
| `search` | `?search=Medellín` (name) |
| `ordering` | `?ordering=scheduled_date` \| `?ordering=-created_at` |

---

## Error Responses

**400 — Validation error**
```json
{
  "scheduled_date": ["This field is required."],
  "status": ["\"unknown\" is not a valid choice."]
}
```

**404 — Not found**
```json
{
  "detail": "No Route matches the given query."
}
```
