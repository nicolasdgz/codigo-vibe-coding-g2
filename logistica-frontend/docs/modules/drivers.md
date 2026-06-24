# Module: Drivers

Drivers linked 1:1 to Django auth.User accounts.

**Permission:** `IsAdminGroup` (admin only)

## Endpoints

```
GET    /api/v1/drivers/         List (paginated)
POST   /api/v1/drivers/         Create (link to existing user)
GET    /api/v1/drivers/{id}/    Retrieve
PUT    /api/v1/drivers/{id}/    Update (full)
PATCH  /api/v1/drivers/{id}/    Update (partial)
DELETE /api/v1/drivers/{id}/    Delete
```

## Fields

| Field | Type | Notes |
|---|---|---|
| `id` | int | auto, read-only |
| `user` | OneToOne FK | read: nested object · write: user id |
| `license_number` | string | max 50, unique |
| `license_expiry` | date | `YYYY-MM-DD` |
| `phone` | string | max 20 |
| `is_available` | boolean | default true |
| `created_at` | ISO datetime | read-only |
| `updated_at` | ISO datetime | read-only |

> **Dual serializer:** GET responses return nested `user` object. POST/PUT/PATCH bodies send user id.

---

## `GET /api/v1/drivers/` — List

**Response 200**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 3,
      "user": {
        "id": 7,
        "username": "jgarcia",
        "email": "garcia@example.com",
        "first_name": "Juan",
        "last_name": "García"
      },
      "license_number": "LIC-2024-123456",
      "license_expiry": "2026-05-15",
      "phone": "+57 300 555 7777",
      "is_available": true,
      "created_at": "2025-05-20T14:30:00Z",
      "updated_at": "2025-05-29T09:00:00Z"
    },
    {
      "id": 4,
      "user": {
        "id": 8,
        "username": "pmendoza",
        "email": "pmendoza@example.com",
        "first_name": "Pedro",
        "last_name": "Mendoza"
      },
      "license_number": "LIC-2023-987654",
      "license_expiry": "2025-12-31",
      "phone": "+57 311 444 5555",
      "is_available": false,
      "created_at": "2025-05-21T09:00:00Z",
      "updated_at": "2025-05-28T16:00:00Z"
    }
  ]
}
```

---

## `POST /api/v1/drivers/` — Create

**Request body**
```json
{
  "user": 7,
  "license_number": "LIC-2024-123456",
  "license_expiry": "2026-05-15",
  "phone": "+57 300 555 7777",
  "is_available": true
}
```

> The referenced `user` must exist and not already be linked to another driver.

**Response 201**
```json
{
  "id": 3,
  "user": {
    "id": 7,
    "username": "jgarcia",
    "email": "garcia@example.com",
    "first_name": "Juan",
    "last_name": "García"
  },
  "license_number": "LIC-2024-123456",
  "license_expiry": "2026-05-15",
  "phone": "+57 300 555 7777",
  "is_available": true,
  "created_at": "2025-05-30T10:00:00Z",
  "updated_at": "2025-05-30T10:00:00Z"
}
```

---

## `GET /api/v1/drivers/{id}/` — Retrieve

**Response 200**
```json
{
  "id": 3,
  "user": {
    "id": 7,
    "username": "jgarcia",
    "email": "garcia@example.com",
    "first_name": "Juan",
    "last_name": "García"
  },
  "license_number": "LIC-2024-123456",
  "license_expiry": "2026-05-15",
  "phone": "+57 300 555 7777",
  "is_available": true,
  "created_at": "2025-05-20T14:30:00Z",
  "updated_at": "2025-05-29T09:00:00Z"
}
```

---

## `PUT /api/v1/drivers/{id}/` — Update (full)

**Request body** — all fields required
```json
{
  "user": 7,
  "license_number": "LIC-2024-123456",
  "license_expiry": "2027-05-15",
  "phone": "+57 300 111 2222",
  "is_available": true
}
```

**Response 200**
```json
{
  "id": 3,
  "user": {
    "id": 7,
    "username": "jgarcia",
    "email": "garcia@example.com",
    "first_name": "Juan",
    "last_name": "García"
  },
  "license_number": "LIC-2024-123456",
  "license_expiry": "2027-05-15",
  "phone": "+57 300 111 2222",
  "is_available": true,
  "created_at": "2025-05-20T14:30:00Z",
  "updated_at": "2025-05-30T11:00:00Z"
}
```

---

## `PATCH /api/v1/drivers/{id}/` — Update (partial)

**Request body** — only changed fields
```json
{
  "is_available": false
}
```

**Response 200**
```json
{
  "id": 3,
  "user": {
    "id": 7,
    "username": "jgarcia",
    "email": "garcia@example.com",
    "first_name": "Juan",
    "last_name": "García"
  },
  "license_number": "LIC-2024-123456",
  "license_expiry": "2026-05-15",
  "phone": "+57 300 555 7777",
  "is_available": false,
  "created_at": "2025-05-20T14:30:00Z",
  "updated_at": "2025-05-30T11:05:00Z"
}
```

---

## `DELETE /api/v1/drivers/{id}/` — Delete

**Response 204** — No content

> **PROTECTED:** Returns 400 if driver is assigned to vehicles.

---

## Filters & Search

| Param | Example |
|---|---|
| `is_available` | `?is_available=true` |
| `search` | `?search=garcia` (license_number, user__username, user__first_name, user__last_name) |
| `ordering` | `?ordering=license_expiry` \| `?ordering=-created_at` |

---

## Error Responses

**400 — Validation error**
```json
{
  "user": ["This field must be unique."],
  "license_number": ["driver with this license number already exists."]
}
```

**404 — Not found**
```json
{
  "detail": "No Driver matches the given query."
}
```
