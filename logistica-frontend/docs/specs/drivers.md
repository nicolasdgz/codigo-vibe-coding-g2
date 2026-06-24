# Spec: Drivers

## Purpose

The Drivers module manages driver profiles for the logistics system. It is accessible to `admin` users only (`IsAdminGroup` permission). Users can create, view, edit, and delete driver records. Each driver is linked 1:1 to an existing `auth.User` account — the form does **not** create users; it links a driver profile to an already-existing user by numeric ID.

The module uses the **dual serializer pattern**: GET responses return a nested `user` object (`UserSummary`), while POST/PATCH request bodies send a plain integer `user` id. TypeScript types must encode both shapes explicitly.

There is no `/users/` list endpoint exposed by the API. The `user` field in the create/edit form is a plain numeric input where the admin enters the target user's ID. On edit, the current user is displayed as read-only text (username + full name) and cannot be changed through this form.

---

## Screens / Routes

| Route | Type | Description |
|---|---|---|
| `/dashboard/drivers` | Client | Paginated list of all drivers with filter controls and a "New Driver" button to open the create form |
| `/dashboard/drivers/[id]` | Client | Detail view for a single driver — loads current values into an edit form; also exposes the delete action |

---

## Component List

| Component | Type | File Path | Props |
|---|---|---|---|
| `DriversTable` | Client | `components/drivers/DriversTable.tsx` | `data: Driver[]`, `total: number`, `page: number`, `onPageChange: (page: number) => void`, `isLoading: boolean` |
| `DriverFilters` | Client | `components/drivers/DriverFilters.tsx` | `filters: DriverListParams`, `onChange: (filters: DriverListParams) => void` |
| `DriverForm` | Client | `components/drivers/DriverForm.tsx` | `defaultValues?: Partial<DriverWritePayload>`, `currentUser?: UserSummary`, `onSubmit: (data: DriverWritePayload) => void`, `isSubmitting: boolean`, `mode: 'create' \| 'edit'` — used inside a Sheet for create and on the detail page for edit |
| `DriverDeleteDialog` | Client | `components/drivers/DriverDeleteDialog.tsx` | `driverId: number`, `driverName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onDeleted: () => void` |

---

## TypeScript Types

```typescript
// types/drivers.ts

/** Nested user shape returned inside GET /api/v1/drivers/ responses */
export interface UserSummary {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

/** Shape returned by GET /api/v1/drivers/ and GET /api/v1/drivers/{id}/ */
export interface Driver {
  id: number;
  user: UserSummary;
  license_number: string;
  license_expiry: string;   // date as "YYYY-MM-DD"
  phone: string;
  is_available: boolean;
  created_at: string;       // ISO 8601 datetime
  updated_at: string;       // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/drivers/ and PATCH /api/v1/drivers/{id}/ bodies */
export interface DriverWritePayload {
  user: number;             // FK — send integer id of an existing auth.User
  license_number: string;
  license_expiry: string;   // "YYYY-MM-DD"
  phone: string;
  is_available: boolean;
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedDrivers {
  count: number;
  next: string | null;
  previous: string | null;
  results: Driver[];
}

/** Query parameters accepted by GET /api/v1/drivers/ */
export interface DriverListParams {
  page?: number;
  is_available?: boolean;   // filter by availability status
  search?: string;          // searches license_number, user__username, user__first_name, user__last_name
  ordering?: string;        // e.g. "license_expiry" or "-created_at"
}
```

---

## API Calls Needed

All hooks live in `hooks/drivers/`. Underlying Axios calls live in `services/drivers.ts`.

### Driver CRUD hooks (`hooks/drivers/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useDrivers(params: DriverListParams)` | GET | `/api/v1/drivers/` | Fetch paginated, filtered list; query key `['drivers', 'list', params]` |
| `useDriver(id: number)` | GET | `/api/v1/drivers/{id}/` | Fetch a single driver for the detail/edit page; query key `['drivers', id]` |
| `useCreateDriver()` | POST | `/api/v1/drivers/` | Create a new driver; body is `DriverWritePayload` with `user` as an integer; on success (201) invalidate `['drivers', 'list']` |
| `useUpdateDriver()` | PATCH | `/api/v1/drivers/{id}/` | Partially update; call as `mutate({ id, payload })`; on success (200) invalidate `['drivers', 'list']` and `['drivers', id]` |
| `useDeleteDriver()` | DELETE | `/api/v1/drivers/{id}/` | Delete a driver; on 204 invalidate `['drivers', 'list']`; on 400 surface the protected-record error message |

---

## Acceptance Criteria

### List Page (`/dashboard/drivers`)

- [x] Page renders a `DriversTable` with columns: **Full Name** (`user.first_name + ' ' + user.last_name`), **License Number**, **License Expiry**, **Phone**, **Available**
- [x] Full Name column is derived by concatenating `user.first_name` and `user.last_name` from the nested read shape
- [x] Available column renders a boolean badge or checkmark reflecting `is_available`
- [x] Table is paginated — page size 20, controlled by `page` query param; total count shown
- [x] `DriverFilters` renders an `is_available` select (all / available / unavailable), a text search input, and an ordering select
- [x] Changing any filter resets to page 1 and re-fetches the list
- [x] A skeleton or spinner is shown while `useDrivers` is loading (`isLoading === true`)
- [x] An error message is shown when the list fetch fails (network or 4xx/5xx)
- [x] A "New Driver" button opens a Sheet containing `DriverForm` in create mode

### Create Flow

- [x] `DriverForm` in `mode="create"` renders a numeric input for `user` (label: "User ID"), and inputs for: `license_number`, `license_expiry` (date picker or date input), `phone`, `is_available` (checkbox or toggle)
- [x] The `user` field is a plain numeric input — the admin enters the ID of an existing `auth.User`
- [x] Submitting the form calls `useCreateDriver` with a `DriverWritePayload` where `user` is an integer
- [x] On success (201), the Sheet closes, `['drivers', 'list']` query is invalidated, and the updated list re-fetches automatically
- [x] While the mutation is pending, the submit button is disabled and shows a loading indicator
- [x] Backend validation errors (400 — e.g., user already linked to another driver, duplicate `license_number`) are displayed inline next to the relevant field

### Edit Flow (`/dashboard/drivers/[id]`)

- [x] Page fetches the driver via `useDriver(id)` and pre-fills `DriverForm` with current values
- [x] The `user` field is rendered as **read-only display text** showing `user.username` and full name (`user.first_name + ' ' + user.last_name`) — it is not an editable input on edit
- [x] The `DriverWritePayload` sent on PATCH still includes `user: driver.user.id` (sourced from the nested read shape) so the backend receives a valid payload if all fields are sent, but PATCH sends only changed fields
- [x] `license_number`, `license_expiry`, `phone`, and `is_available` are pre-filled and editable
- [x] A skeleton or spinner is shown while the single-driver fetch is loading
- [x] Submitting the form calls `useUpdateDriver()` with only the changed fields via `mutate({ id, payload })` (PATCH semantics — diff against original values)
- [x] On success (200), both `['drivers', 'list']` and `['drivers', id]` queries are invalidated
- [x] Backend validation errors (400) are displayed inline next to the relevant field
- [x] A "Delete" button is present and opens `DriverDeleteDialog`

### Delete Flow

- [x] `DriverDeleteDialog` displays the driver's full name and a confirmation message before proceeding
- [x] Confirming calls `useDeleteDriver` with the driver's `id`
- [x] On success (204), `['drivers', 'list']` is invalidated and the user is redirected to `/dashboard/drivers`
- [x] If the backend returns 400 (driver is assigned to a vehicle), the dialog stays open and displays a user-friendly error such as `"Cannot delete driver because they are currently assigned to a vehicle."` without crashing
- [x] Cancelling the dialog performs no API call

### Loading & Error States

- [x] All data-fetching hooks show a loading skeleton or spinner while `isLoading` is true
- [x] All mutations disable interactive controls while `isPending` is true
- [x] Unrecoverable errors (401, 403, 500) display a user-visible error message rather than a blank screen

### TypeScript

- [x] No `any` type used anywhere in the drivers module (types, services, hooks, components, pages)
- [x] GET responses are typed as `Driver` — `user` field typed as `UserSummary`
- [x] POST/PATCH bodies are typed as `DriverWritePayload` — `user` field is `number`, not an object
- [x] Paginated list response is typed as `PaginatedDrivers`
- [x] Filter and query params are typed as `DriverListParams`
