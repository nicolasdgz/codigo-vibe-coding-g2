# Spec: Transport

## Purpose

The Transport module manages the vehicle fleet for the logistics system. It is accessible to `admin` users only (`IsAdminGroup` permission). Users can create, view, edit, and delete vehicle records. Each vehicle optionally has a single assigned driver (nullable FK). The module uses the **dual serializer pattern**: GET responses return a nested `driver` object (`DriverSummary`), while POST/PATCH request bodies send a plain integer driver ID or `null`. Vehicles cannot be deleted while assigned to a route — the backend returns a 400 error that must be surfaced as a user-friendly message.

---

## Screens / Routes

| Route | Type | Description |
|---|---|---|
| `/dashboard/transport` | Client | Paginated list of all vehicles with filter controls and a "New Vehicle" button to open the create form |
| `/dashboard/transport/[id]` | Client | Detail view for a single vehicle — loads current values into an edit form; also exposes the delete action |

---

## Component List

| Component | Type | File Path | Props |
|---|---|---|---|
| `TransportTable` | Client | `components/transport/TransportTable.tsx` | `data: Transport[]`, `total: number`, `page: number`, `onPageChange: (page: number) => void`, `isLoading: boolean` |
| `TransportFilters` | Client | `components/transport/TransportFilters.tsx` | `filters: TransportListParams`, `onChange: (filters: TransportListParams) => void`, `driverOptions: DriverSummary[]`, `isErrorDrivers: boolean` |
| `TransportForm` | Client | `components/transport/TransportForm.tsx` | `defaultValues?: Partial<TransportWritePayload>`, `currentDriver?: DriverSummary \| null`, `onSubmit: (data: TransportWritePayload) => void`, `isSubmitting: boolean`, `mode: 'create' \| 'edit'`, `driverOptions: DriverSummary[]`, `isErrorDrivers: boolean`, `apiErrors?: Record<string, string[]>` |
| `TransportDeleteDialog` | Client | `components/transport/TransportDeleteDialog.tsx` | `transportId: number`, `plateNumber: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onDeleted: () => void` |

---

## TypeScript Types

```typescript
// types/transport.ts

/** Nested driver shape returned inside GET /api/v1/transport/ responses */
export interface DriverSummary {
  id: number;
  license_number: string;
  name: string;           // pre-formatted full name from backend
  is_available: boolean;
}

/** Shape returned by GET /api/v1/transport/ and GET /api/v1/transport/{id}/ */
export interface Transport {
  id: number;
  plate_number: string;
  vehicle_type: 'truck' | 'van' | 'motorcycle' | 'car';
  brand: string;
  model: string;
  year: number;
  capacity_kg: string;    // decimal as string, e.g. "8000.00"
  capacity_units: number;
  driver: DriverSummary | null;
  is_active: boolean;
  created_at: string;     // ISO 8601 datetime
  updated_at: string;     // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/transport/ and PATCH /api/v1/transport/{id}/ bodies */
export interface TransportWritePayload {
  plate_number: string;
  vehicle_type: 'truck' | 'van' | 'motorcycle' | 'car';
  brand: string;
  model: string;
  year: number;
  capacity_kg: string;    // decimal as string
  capacity_units: number;
  driver: number | null;  // FK — send integer id or null
  is_active: boolean;
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedTransport {
  count: number;
  next: string | null;
  previous: string | null;
  results: Transport[];
}

/** Query parameters accepted by GET /api/v1/transport/ */
export interface TransportListParams {
  page?: number;
  vehicle_type?: 'truck' | 'van' | 'motorcycle' | 'car';
  is_active?: boolean;
  driver?: number;        // filter by driver id
  search?: string;        // searches plate_number, brand, model
  ordering?: string;      // e.g. "year" or "-capacity_kg"
}
```

---

## API Calls Needed

All hooks live in `hooks/transport/`. Underlying Axios calls live in `services/transport.ts`.

### Transport CRUD hooks (`hooks/transport/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useTransportList(params: TransportListParams)` | GET | `/transport/` | Fetch paginated, filtered list; query key `['transport', 'list', params]` |
| `useTransport(id: number)` | GET | `/transport/{id}/` | Fetch a single vehicle for the detail/edit page; query key `['transport', id]` |
| `useCreateTransport()` | POST | `/transport/` | Create a new vehicle; body is `TransportWritePayload`; on success (201) invalidate `['transport', 'list']` |
| `useUpdateTransport()` | PATCH | `/transport/{id}/` | Partially update; call as `mutate({ id, payload })`; on success (200) invalidate `['transport', 'list']` and `['transport', id]` |
| `useDeleteTransport()` | DELETE | `/transport/{id}/` | Delete a vehicle; on 204 invalidate `['transport', 'list']`; on 400 surface the protected-record error message |

### Driver options hook (`hooks/transport/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useDriverOptions()` | GET | `/drivers/?is_active=true&page_size=100` | Fetch active drivers for form dropdown; returns `DriverSummary[]`; query key `['drivers', 'options']` |

> Note: `useDriverOptions` lives in `hooks/transport/` and uses `DriverSummary` defined in `types/transport.ts`. The services call path is `/drivers/` (baseURL already includes `/api/v1`).

---

## Acceptance Criteria

### List Page (`/dashboard/transport`)

- [x] Page renders a `TransportTable` with columns: **Plate Number**, **Type**, **Brand**, **Model**, **Year**, **Capacity (kg)**, **Driver**, **Active**
- [x] Driver column shows the driver's `name` from the nested read shape, or a dash/empty when `driver` is `null`
- [x] Active column renders a boolean badge or checkmark reflecting `is_active`
- [x] Table is paginated — page size 20, controlled by `page` query param; total count shown
- [x] `TransportFilters` renders: a `vehicle_type` select (all / truck / van / motorcycle / car), an `is_active` select (all / active / inactive), a `driver` select populated from `useDriverOptions()`, and a text search input
- [x] Changing any filter resets to page 1 and re-fetches the list
- [x] If `useDriverOptions` fails, `isErrorDrivers` prop is passed to `TransportFilters` and the driver filter shows a user-friendly error state instead of crashing
- [x] A skeleton or spinner is shown while `useTransportList` is loading (`isLoading === true`)
- [x] An error message is shown when the list fetch fails (network or 4xx/5xx)
- [x] A "New Vehicle" button opens a Sheet containing `TransportForm` in create mode

### Create Flow

- [x] `TransportForm` in `mode="create"` renders inputs for: `plate_number` (text), `vehicle_type` (select: truck / van / motorcycle / car), `brand` (text), `model` (text), `year` (number), `capacity_kg` (text, decimal), `capacity_units` (number), `driver` (select from `driverOptions`, nullable — includes an "Unassigned" option), `is_active` (checkbox or toggle)
- [x] The `driver` select is populated from the `driverOptions` prop passed in from `useDriverOptions()`; if `isErrorDrivers` is true, the select shows an error state
- [x] Submitting the form calls `useCreateTransport` with a `TransportWritePayload` where `driver` is a number or `null`
- [x] On success (201), the Sheet closes, `['transport', 'list']` query is invalidated, and the updated list re-fetches automatically
- [x] While the mutation is pending, the submit button is disabled and shows a loading indicator
- [x] Backend validation errors (400) are received via `apiErrors` prop and set on the form via `useEffect → form.setError` for inline display next to the relevant field

### Edit Flow (`/dashboard/transport/[id]`)

- [x] Page fetches the vehicle via `useTransport(id)` and pre-fills `TransportForm` with current values
- [x] The `driver` field is pre-selected in the dropdown based on the current `driver.id` from the nested read shape
- [x] All fields (`plate_number`, `vehicle_type`, `brand`, `model`, `year`, `capacity_kg`, `capacity_units`, `driver`, `is_active`) are pre-filled and editable
- [x] A skeleton or spinner is shown while the single-vehicle fetch is loading
- [x] Submitting the form calls `useUpdateTransport()` with only the changed fields via `mutate({ id, payload })` (PATCH semantics — diff against original values)
- [x] The PATCH diff correctly handles `driver` changing to `null` (unassigning a driver must be sent explicitly)
- [x] On success (200), both `['transport', 'list']` and `['transport', id]` queries are invalidated
- [x] Backend validation errors (400) are set inline via `apiErrors` prop pattern
- [x] A "Delete" button is present and opens `TransportDeleteDialog`

### Delete Flow

- [x] `TransportDeleteDialog` displays the vehicle's `plate_number` and a confirmation message before proceeding
- [x] Confirming calls `useDeleteTransport` with the vehicle's `id`
- [x] On success (204), `['transport', 'list']` is invalidated and the user is redirected to `/dashboard/transport`
- [x] If the backend returns 400 (vehicle is assigned to a route), the dialog stays open and displays a user-friendly error such as `"Cannot delete vehicle because it is assigned to a route."` without crashing
- [x] Cancelling the dialog performs no API call

### Loading & Error States

- [x] All data-fetching hooks show a loading skeleton or spinner while `isLoading` is true
- [x] All mutations disable interactive controls while `isPending` is true
- [x] Unrecoverable errors (401, 403, 500) display a user-visible error message rather than a blank screen

### TypeScript

- [x] No `any` type used anywhere in the transport module (types, services, hooks, components, pages)
- [x] GET responses are typed as `Transport` — `driver` field typed as `DriverSummary | null`
- [x] POST/PATCH bodies are typed as `TransportWritePayload` — `driver` field is `number | null`, not an object
- [x] Paginated list response is typed as `PaginatedTransport`
- [x] Filter and query params are typed as `TransportListParams`
- [x] `DriverSummary` is defined in `types/transport.ts` (not imported from `types/drivers.ts`)
