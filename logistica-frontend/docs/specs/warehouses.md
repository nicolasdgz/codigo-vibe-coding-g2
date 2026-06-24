# Spec: Warehouses

## Purpose

The Warehouses module manages the storage and dispatch points used throughout the logistics system. It is accessible to both administrators and warehouse staff (`IsAdminOrWarehouseStaff` permission). Users can create, view, edit, and delete warehouse records. Warehouses are a foundational entity — they are referenced by Products, Routes, and Shipments — so deletion is protected when linked records exist.

---

## Screens / Routes

| Route | Type | Description |
|---|---|---|
| `/dashboard/warehouses` | Client | Paginated list of all warehouses with filter controls and a "New Warehouse" button to open the create form |
| `/dashboard/warehouses/[id]` | Client | Detail view for a single warehouse — loads current values into an edit form; also exposes the delete action |

---

## Component List

| Component | Type | File Path | Props |
|---|---|---|---|
| `WarehousesTable` | Client | `components/warehouses/WarehousesTable.tsx` | `data: Warehouse[]`, `total: number`, `page: number`, `onPageChange: (page: number) => void`, `isLoading: boolean` |
| `WarehouseFilters` | Client | `components/warehouses/WarehouseFilters.tsx` | `filters: WarehouseListParams`, `onChange: (filters: WarehouseListParams) => void` |
| `WarehouseForm` | Client | `components/warehouses/WarehouseForm.tsx` | `defaultValues?: Partial<WarehouseWritePayload>`, `onSubmit: (data: WarehouseWritePayload) => void`, `isSubmitting: boolean` — used inside a Sheet for create and on the detail page for edit |
| `WarehouseDeleteDialog` | Client | `components/warehouses/WarehouseDeleteDialog.tsx` | `warehouseId: number`, `warehouseName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onDeleted: () => void` |

---

## TypeScript Types

```typescript
// types/warehouses.ts

/** Shape returned by GET /api/v1/warehouses/ and GET /api/v1/warehouses/{id}/ */
export interface Warehouse {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: string | null;   // decimal string as returned by DRF, e.g. "4.729886"
  longitude: string | null;  // decimal string as returned by DRF, e.g. "-74.046543"
  capacity: number;
  is_active: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/warehouses/ and PATCH /api/v1/warehouses/{id}/ bodies */
export interface WarehouseWritePayload {
  name: string;
  address: string;
  city: string;
  country: string;
  latitude?: string | null;
  longitude?: string | null;
  capacity: number;
  is_active: boolean;
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedWarehouses {
  count: number;
  next: string | null;
  previous: string | null;
  results: Warehouse[];
}

/** Query parameters accepted by GET /api/v1/warehouses/ */
export interface WarehouseListParams {
  page?: number;
  city?: string;
  country?: string;
  is_active?: boolean;
  search?: string;
  ordering?: string;
}
```

---

## API Calls Needed

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useWarehouses(params: WarehouseListParams)` | GET | `/api/v1/warehouses/` | Fetch paginated, filtered list; query key `['warehouses', 'list', params]` |
| `useWarehouse(id: number)` | GET | `/api/v1/warehouses/{id}/` | Fetch a single warehouse for the detail/edit page; query key `['warehouses', id]` |
| `useCreateWarehouse()` | POST | `/api/v1/warehouses/` | Create a new warehouse; on success invalidate `['warehouses', 'list']` |
| `useUpdateWarehouse(id: number)` | PATCH | `/api/v1/warehouses/{id}/` | Partially update an existing warehouse; on success invalidate `['warehouses', 'list']` and `['warehouses', id]` |
| `useDeleteWarehouse()` | DELETE | `/api/v1/warehouses/{id}/` | Delete a warehouse; on 204 invalidate `['warehouses', 'list']`; on 400 surface the protected-record error message |

All hooks live in `hooks/warehouses/`. The underlying Axios calls live in `services/warehouses.ts`.

---

## Acceptance Criteria

### List Page (`/dashboard/warehouses`)

- [x] Page renders a `WarehousesTable` with columns: **Name**, **City**, **Country**, **Capacity**, **Active**
- [x] Table is paginated — page size 20, controlled by `page` query param; total count shown
- [x] `WarehouseFilters` renders a city text input, a country text input, an `is_active` select (all / active / inactive), a text search input, and an ordering select
- [x] Changing any filter resets to page 1 and re-fetches the list
- [x] A skeleton or spinner is shown while `useWarehouses` is loading (`isLoading === true`)
- [x] An error message is shown when the list fetch fails (network or 4xx/5xx)
- [x] A "New Warehouse" button opens a Sheet containing `WarehouseForm` in create mode

### Create Flow

- [x] `WarehouseForm` renders fields for all writable attributes: name, address, city, country, latitude (optional), longitude (optional), capacity, is_active
- [x] Latitude and longitude fields are optional — they may be left blank, and the payload omits them or sends `null`
- [x] Submitting the form calls `useCreateWarehouse` with a `WarehouseWritePayload` (no extra fields, no `id`, no timestamps)
- [x] On success (201), the Sheet closes, `['warehouses', 'list']` query is invalidated, and the updated list re-fetches automatically
- [x] While the mutation is pending, the submit button is disabled and shows a loading indicator
- [x] Backend validation errors (400 — e.g., missing required fields or out-of-range capacity) are displayed inline next to the relevant field

### Edit Flow (`/dashboard/warehouses/[id]`)

- [x] Page fetches the warehouse via `useWarehouse(id)` and pre-fills `WarehouseForm` with current values
- [x] A skeleton or spinner is shown while the single-warehouse fetch is loading
- [x] Submitting the form calls `useUpdateWarehouse(id)` with only the changed fields (PATCH semantics — diff against original values)
- [x] On success (200), both `['warehouses', 'list']` and `['warehouses', id]` queries are invalidated
- [x] Backend validation errors (400) are displayed inline next to the relevant field
- [x] A "Delete" button is present and opens `WarehouseDeleteDialog`

### Delete Flow

- [x] `WarehouseDeleteDialog` displays the warehouse name and a confirmation message before proceeding
- [x] Confirming calls `useDeleteWarehouse` with the warehouse's `id`
- [x] On success (204), `['warehouses', 'list']` is invalidated and the user is redirected to `/dashboard/warehouses`
- [x] If the backend returns 400 (warehouse has linked products, routes, or shipments), the dialog stays open and displays a user-friendly error such as `"Cannot delete warehouse with existing linked records."` without crashing
- [x] Cancelling the dialog performs no API call

### Loading & Error States

- [x] All data-fetching hooks show a loading skeleton or spinner while `isLoading` is true
- [x] All mutations disable interactive controls while `isPending` is true
- [x] Unrecoverable errors (401, 403, 500) display a user-visible error message rather than a blank screen

### TypeScript

- [x] No `any` type used anywhere in the warehouses module (types, services, hooks, components, pages)
- [x] GET responses are typed as `Warehouse` (full read shape including `id`, `created_at`, `updated_at`)
- [x] POST/PATCH bodies are typed as `WarehouseWritePayload` (write shape without read-only fields)
- [x] Paginated list response is typed as `PaginatedWarehouses`
- [x] Filter and query params are typed as `WarehouseListParams`
- [x] `latitude` and `longitude` are typed as `string | null` in read shape and `string | null | undefined` in write shape, matching DRF decimal serialization
