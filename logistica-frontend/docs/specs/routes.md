# Spec: Routes

## Purpose

The Routes module manages delivery routes composed of sequential stops in the logistics system. It is accessible to `admin` users only (`IsAdminGroup` permission). Users can create, view, edit, and delete route records. Each route has an `origin_warehouse` (required FK), an optional `transport` assignment (nullable FK), a `status` lifecycle (`planned → in_progress → completed / cancelled`), and a `scheduled_date`. Stops are a nested resource managed inline on the detail page — each stop has an `order`, `address`, `city`, and optional `estimated_arrival` / `actual_arrival` datetimes. The module uses the **dual serializer pattern**: GET responses return nested `origin_warehouse` and `transport` objects; POST/PATCH request bodies send plain integer IDs (or `null` for transport). Routes cannot be deleted while linked to shipments — the backend returns a 400 error that must be surfaced as a user-friendly message. Deleting a route cascades and removes all its stops.

---

## Screens / Routes

| Route | Type | Description |
|---|---|---|
| `/dashboard/routes` | Client | Paginated list of all routes with filter controls and a "New Route" button to open the create form |
| `/dashboard/routes/[id]` | Client | Detail view for a single route — loads current values into an edit form, exposes the delete action, and provides inline stop management (add / remove stops) |

---

## Component List

| Component | Type | File Path | Props |
|---|---|---|---|
| `RouteTable` | Client | `components/routes/RouteTable.tsx` | `data: Route[]`, `total: number`, `page: number`, `onPageChange: (page: number) => void`, `isLoading: boolean` |
| `RouteFilters` | Client | `components/routes/RouteFilters.tsx` | `filters: RouteListParams`, `onChange: (filters: RouteListParams) => void`, `transportOptions: TransportSummary[]`, `warehouseOptions: WarehouseSummary[]`, `isErrorTransport: boolean`, `isErrorWarehouses: boolean` |
| `RouteForm` | Client | `components/routes/RouteForm.tsx` | `defaultValues?: Partial<RouteWritePayload>`, `currentTransport?: TransportSummary \| null`, `currentOriginWarehouse?: WarehouseSummary`, `onSubmit: (data: RouteWritePayload) => void`, `isSubmitting: boolean`, `mode: 'create' \| 'edit'`, `transportOptions: TransportSummary[]`, `warehouseOptions: WarehouseSummary[]`, `isErrorTransport: boolean`, `isErrorWarehouses: boolean`, `apiErrors?: Record<string, string[]>` |
| `RouteDeleteDialog` | Client | `components/routes/RouteDeleteDialog.tsx` | `routeId: number`, `routeName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onDeleted: () => void` |
| `RouteStopList` | Client | `components/routes/RouteStopList.tsx` | `routeId: number`, `stops: RouteStop[]`, `isLoading: boolean` |
| `RouteStopForm` | Client | `components/routes/RouteStopForm.tsx` | `routeId: number`, `onSuccess: () => void` |

---

## TypeScript Types

```typescript
// types/routes.ts

/** Nested transport shape returned inside GET /api/v1/routes/ responses */
export interface TransportSummary {
  id: number;
  plate_number: string;
  vehicle_type: string;
  brand: string;
}

/** Nested warehouse shape returned inside GET /api/v1/routes/ responses */
export interface WarehouseSummary {
  id: number;
  name: string;
  city: string;
}

/** Route stop shape — same structure in both list and nested responses */
export interface RouteStop {
  id: number;
  order: number;
  address: string;
  city: string;
  estimated_arrival: string | null;  // ISO 8601 datetime or null
  actual_arrival: string | null;     // ISO 8601 datetime or null
}

/** Shape returned by GET /api/v1/routes/ and GET /api/v1/routes/{id}/ */
export interface Route {
  id: number;
  name: string;
  origin_warehouse: WarehouseSummary;
  transport: TransportSummary | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;            // 'YYYY-MM-DD'
  stops: RouteStop[];
  created_at: string;                // ISO 8601 datetime
  updated_at: string;                // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/routes/ and PATCH /api/v1/routes/{id}/ bodies */
export interface RouteWritePayload {
  name: string;
  origin_warehouse: number;          // FK — send integer id
  transport: number | null;          // FK — send integer id or null
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;            // 'YYYY-MM-DD'
}

/** Shape sent in POST /api/v1/routes/{id}/stops/ body */
export interface RouteStopWritePayload {
  order: number;
  address: string;
  city: string;
  estimated_arrival?: string | null; // ISO 8601 datetime, optional
}

/** Shape sent in PATCH /api/v1/routes/{id}/stops/{stop_id}/ body */
export interface RouteStopPatchPayload {
  actual_arrival?: string | null;
  order?: number;
  address?: string;
  city?: string;
  estimated_arrival?: string | null;
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedRoutes {
  count: number;
  next: string | null;
  previous: string | null;
  results: Route[];
}

/** Query parameters accepted by GET /api/v1/routes/ */
export interface RouteListParams {
  page?: number;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  transport?: number;                // filter by transport id
  origin_warehouse?: number;         // filter by warehouse id
  search?: string;                   // searches name
  ordering?: string;                 // e.g. "scheduled_date" or "-created_at"
}
```

---

## API Calls Needed

All hooks live in `hooks/routes/`. Underlying Axios calls live in `services/routes.ts`.

### Route CRUD hooks (`hooks/routes/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useRouteList(params: RouteListParams)` | GET | `/routes/` | Fetch paginated, filtered list; query key `['routes', 'list', params]` |
| `useRoute(id: number)` | GET | `/routes/{id}/` | Fetch a single route for the detail/edit page; query key `['routes', id]` |
| `useCreateRoute()` | POST | `/routes/` | Create a new route; body is `RouteWritePayload`; on success (201) invalidate `['routes', 'list']` |
| `useUpdateRoute()` | PATCH | `/routes/{id}/` | Partially update; call as `mutate({ id, payload })`; on success (200) invalidate `['routes', 'list']` and `['routes', id]` |
| `useDeleteRoute()` | DELETE | `/routes/{id}/` | Delete a route; on 204 invalidate `['routes', 'list']`; on 400 surface the protected-record error message |

### Stop management hooks (`hooks/routes/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useCreateRouteStop()` | POST | `/routes/{id}/stops/` | Add a stop to a route; call as `mutate({ routeId, payload })`; on success (201) invalidate `['routes', id]` |
| `useDeleteRouteStop()` | DELETE | `/routes/{id}/stops/{stop_id}/` | Remove a stop; call as `mutate({ routeId, stopId })`; on success (204) invalidate `['routes', id]` |
| `usePatchRouteStop()` | PATCH | `/routes/{id}/stops/{stop_id}/` | Update stop fields (e.g. `actual_arrival`); call as `mutate({ routeId, stopId, payload })`; on success (200) invalidate `['routes', id]` |

### Dropdown options hooks (`hooks/routes/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useTransportOptions()` | GET | `/transport/?is_active=true&page_size=100` | Fetch active transport records for form/filter dropdowns; returns `TransportSummary[]`; query key `['transport', 'options']` |
| `useWarehouseOptions()` | GET | `/warehouses/?is_active=true&page_size=100` | Fetch active warehouses for form/filter dropdowns; returns `WarehouseSummary[]`; query key `['warehouses', 'options']` |

> Note: Both option hooks live in `hooks/routes/` and use summary types defined in `types/routes.ts`. Services call paths are `/transport/` and `/warehouses/` (baseURL already includes `/api/v1`).

---

## Acceptance Criteria

### List Page (`/dashboard/routes`)

- [ ] Page renders a `RouteTable` with columns: **Name**, **Origin Warehouse**, **Transport**, **Status**, **Scheduled Date**
- [ ] Origin Warehouse column shows `origin_warehouse.name` from the nested read shape
- [ ] Transport column shows `transport.plate_number` from the nested read shape, or a dash when `transport` is `null`
- [ ] Status column renders a badge reflecting the route's `status` value (`planned`, `in_progress`, `completed`, `cancelled`)
- [ ] Table is paginated — page size 20, controlled by `page` query param; total count shown
- [ ] `RouteFilters` renders: a `status` select (all / planned / in_progress / completed / cancelled), a `transport` select populated from `useTransportOptions()`, an `origin_warehouse` select populated from `useWarehouseOptions()`, and a text search input
- [ ] Changing any filter resets to page 1 and re-fetches the list
- [ ] If `useTransportOptions` fails, `isErrorTransport` prop is passed to `RouteFilters` and the transport filter shows a user-friendly error state instead of crashing
- [ ] If `useWarehouseOptions` fails, `isErrorWarehouses` prop is passed to `RouteFilters` and the warehouse filter shows a user-friendly error state instead of crashing
- [ ] A skeleton or spinner is shown while `useRouteList` is loading (`isLoading === true`)
- [ ] An error message is shown when the list fetch fails (network or 4xx/5xx)
- [ ] A "New Route" button opens a Sheet containing `RouteForm` in create mode

### Create Flow

- [ ] `RouteForm` in `mode="create"` renders inputs for: `name` (text), `origin_warehouse` (select from `warehouseOptions`, required), `transport` (select from `transportOptions`, nullable — includes an "Unassigned" option), `status` (select: planned / in_progress / completed / cancelled, defaults to "planned"), `scheduled_date` (date input, `YYYY-MM-DD`)
- [ ] The `transport` select is populated from the `transportOptions` prop; if `isErrorTransport` is true, the select shows an error state
- [ ] The `origin_warehouse` select is populated from the `warehouseOptions` prop; if `isErrorWarehouses` is true, the select shows an error state
- [ ] Submitting the form calls `useCreateRoute` with a `RouteWritePayload` where `transport` is a number or `null` and `origin_warehouse` is a number
- [ ] On success (201), the Sheet closes, `['routes', 'list']` query is invalidated, and the updated list re-fetches automatically
- [ ] While the mutation is pending, the submit button is disabled and shows a loading indicator
- [ ] Backend validation errors (400) are received via `apiErrors` prop and set on the form via `useEffect → form.setError` for inline display next to the relevant field

### Edit Flow (`/dashboard/routes/[id]`)

- [ ] Page fetches the route via `useRoute(id)` and pre-fills `RouteForm` with current values
- [ ] The `transport` field is pre-selected in the dropdown based on the current `transport.id` from the nested read shape (or shows "Unassigned" when `null`)
- [ ] The `origin_warehouse` field is pre-selected based on `origin_warehouse.id`
- [ ] All fields (`name`, `origin_warehouse`, `transport`, `status`, `scheduled_date`) are pre-filled and editable
- [ ] A skeleton or spinner is shown while the single-route fetch is loading
- [ ] Submitting the form calls `useUpdateRoute()` with only the changed fields via `mutate({ id, payload })` (PATCH semantics — diff against original values)
- [ ] The PATCH diff correctly handles `transport` changing to `null` (unassigning transport must be sent explicitly)
- [ ] On success (200), both `['routes', 'list']` and `['routes', id]` queries are invalidated
- [ ] Backend validation errors (400) are set inline via `apiErrors` prop pattern
- [ ] A "Delete" button is present and opens `RouteDeleteDialog`

### Delete Flow

- [ ] `RouteDeleteDialog` displays the route's `name` and a confirmation message before proceeding
- [ ] Confirming calls `useDeleteRoute` with the route's `id`
- [ ] On success (204), `['routes', 'list']` is invalidated and the user is redirected to `/dashboard/routes`
- [ ] If the backend returns 400 (route is linked to a shipment), the dialog stays open and displays a user-friendly error such as `"Cannot delete route because it is linked to one or more shipments."` without crashing
- [ ] Cancelling the dialog performs no API call

### Stop Management (detail page)

- [ ] The detail page (`/dashboard/routes/[id]`) renders a `RouteStopList` showing all stops for the route, sorted by `order`
- [ ] Each stop row shows: `order`, `address`, `city`, `estimated_arrival`, `actual_arrival`
- [ ] A "Add Stop" button renders `RouteStopForm` inline or in a dialog; form fields: `order` (number), `address` (text), `city` (text), `estimated_arrival` (datetime-local, optional)
- [ ] Submitting the add-stop form calls `useCreateRouteStop` with `mutate({ routeId, payload })`; on success (201), `['routes', id]` is invalidated and the stop list refreshes
- [ ] Each stop row has a "Delete" action; confirming calls `useDeleteRouteStop` with `mutate({ routeId, stopId })`; on success (204), `['routes', id]` is invalidated
- [ ] Each stop row has a way to record `actual_arrival` (e.g. a datetime input or "Mark arrived" button); saving calls `usePatchRouteStop` with `mutate({ routeId, stopId, payload: { actual_arrival } })`
- [ ] Stop management mutations show loading/disabled states while pending
- [ ] Stop-level validation errors (400) from add-stop are displayed inline near the form

### Loading & Error States

- [ ] All data-fetching hooks show a loading skeleton or spinner while `isLoading` is true
- [ ] All mutations disable interactive controls while `isPending` is true
- [ ] Unrecoverable errors (401, 403, 500) display a user-visible error message rather than a blank screen

### TypeScript

- [ ] No `any` type used anywhere in the routes module (types, services, hooks, components, pages)
- [ ] GET responses are typed as `Route` — `transport` field typed as `TransportSummary | null`, `origin_warehouse` as `WarehouseSummary`, `stops` as `RouteStop[]`
- [ ] POST/PATCH route bodies are typed as `RouteWritePayload` — `origin_warehouse` and `transport` fields are integers (not objects), `transport` allows `null`
- [ ] POST stop body is typed as `RouteStopWritePayload`; PATCH stop body is typed as `RouteStopPatchPayload`
- [ ] Paginated list response is typed as `PaginatedRoutes`
- [ ] Filter and query params are typed as `RouteListParams`
- [ ] `TransportSummary` and `WarehouseSummary` are defined in `types/routes.ts` (not imported from other modules' type files)
