# Spec: Suppliers

## Purpose

The Suppliers module manages product vendors used throughout the logistics system. It is restricted to administrators (`IsAdminGroup` permission). Users can create, view, edit, and delete supplier records. Suppliers are a foundational entity — they are directly referenced by Products — so deletion is protected when linked product records exist.

---

## Screens / Routes

| Route | Type | Description |
|---|---|---|
| `/dashboard/suppliers` | Client | Paginated list of all suppliers with filter controls and a "New Supplier" button to open the create form |
| `/dashboard/suppliers/[id]` | Client | Detail view for a single supplier — loads current values into an edit form; also exposes the delete action |

---

## Component List

| Component | Type | File Path | Props |
|---|---|---|---|
| `SuppliersTable` | Client | `components/suppliers/SuppliersTable.tsx` | `data: Supplier[]`, `total: number`, `page: number`, `onPageChange: (page: number) => void`, `isLoading: boolean` |
| `SupplierFilters` | Client | `components/suppliers/SupplierFilters.tsx` | `filters: SupplierListParams`, `onChange: (filters: SupplierListParams) => void` |
| `SupplierForm` | Client | `components/suppliers/SupplierForm.tsx` | `defaultValues?: Partial<SupplierWritePayload>`, `onSubmit: (data: SupplierWritePayload) => void`, `isSubmitting: boolean` — used inside a Sheet for create and on the detail page for edit |
| `SupplierDeleteDialog` | Client | `components/suppliers/SupplierDeleteDialog.tsx` | `supplierId: number`, `supplierName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onDeleted: () => void` |

---

## TypeScript Types

```typescript
// types/suppliers.ts

/** Shape returned by GET /api/v1/suppliers/ and GET /api/v1/suppliers/{id}/ */
export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  contact_name: string;
  is_active: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/suppliers/ and PATCH /api/v1/suppliers/{id}/ bodies */
export interface SupplierWritePayload {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  contact_name: string;
  is_active: boolean;
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedSuppliers {
  count: number;
  next: string | null;
  previous: string | null;
  results: Supplier[];
}

/** Query parameters accepted by GET /api/v1/suppliers/ */
export interface SupplierListParams {
  page?: number;
  is_active?: boolean;
  search?: string;
  ordering?: string;
}
```

---

## API Calls Needed

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useSuppliers(params: SupplierListParams)` | GET | `/api/v1/suppliers/` | Fetch paginated, filtered list; query key `['suppliers', 'list', params]` |
| `useSupplier(id: number)` | GET | `/api/v1/suppliers/{id}/` | Fetch a single supplier for the detail/edit page; query key `['suppliers', id]` |
| `useCreateSupplier()` | POST | `/api/v1/suppliers/` | Create a new supplier; on success invalidate `['suppliers', 'list']` |
| `useUpdateSupplier(id: number)` | PATCH | `/api/v1/suppliers/{id}/` | Partially update an existing supplier; on success invalidate `['suppliers', 'list']` and `['suppliers', id]` |
| `useDeleteSupplier()` | DELETE | `/api/v1/suppliers/{id}/` | Delete a supplier; on 204 invalidate `['suppliers', 'list']`; on 400 surface the protected-record error message |

All hooks live in `hooks/suppliers/`. The underlying Axios calls live in `services/suppliers.ts`.

---

## Acceptance Criteria

### List Page (`/dashboard/suppliers`)

- [x] Page renders a `SuppliersTable` with columns: **Name**, **Email**, **Contact Name**, **Tax ID**, **Active**
- [x] Table is paginated — page size 20, controlled by `page` query param; total count shown
- [x] `SupplierFilters` renders an `is_active` select (all / active / inactive), a text search input, and an ordering select
- [x] Changing any filter resets to page 1 and re-fetches the list
- [x] A skeleton or spinner is shown while `useSuppliers` is loading (`isLoading === true`)
- [x] An error message is shown when the list fetch fails (network or 4xx/5xx)
- [x] A "New Supplier" button opens a Sheet containing `SupplierForm` in create mode

### Create Flow

- [x] `SupplierForm` renders fields for all writable attributes: name, email, phone, address, tax_id, contact_name, is_active
- [x] Submitting the form calls `useCreateSupplier` with a `SupplierWritePayload` (no extra fields, no `id`, no timestamps)
- [x] On success (201), the Sheet closes, `['suppliers', 'list']` query is invalidated, and the updated list re-fetches automatically
- [x] While the mutation is pending, the submit button is disabled and shows a loading indicator
- [x] Backend validation errors (400 — e.g., duplicate `tax_id`, invalid email) are displayed inline next to the relevant field

### Edit Flow (`/dashboard/suppliers/[id]`)

- [x] Page fetches the supplier via `useSupplier(id)` and pre-fills `SupplierForm` with current values
- [x] A skeleton or spinner is shown while the single-supplier fetch is loading
- [x] Submitting the form calls `useUpdateSupplier(id)` with only the changed fields (PATCH semantics — diff against original values)
- [x] On success (200), both `['suppliers', 'list']` and `['suppliers', id]` queries are invalidated
- [x] Backend validation errors (400) are displayed inline next to the relevant field
- [x] A "Delete" button is present and opens `SupplierDeleteDialog`

### Delete Flow

- [x] `SupplierDeleteDialog` displays the supplier name and a confirmation message before proceeding
- [x] Confirming calls `useDeleteSupplier` with the supplier's `id`
- [x] On success (204), `['suppliers', 'list']` is invalidated and the user is redirected to `/dashboard/suppliers`
- [x] If the backend returns 400 (supplier has linked products), the dialog stays open and displays a user-friendly error such as `"Cannot delete supplier with existing linked products."` without crashing
- [x] Cancelling the dialog performs no API call

### Loading & Error States

- [x] All data-fetching hooks show a loading skeleton or spinner while `isLoading` is true
- [x] All mutations disable interactive controls while `isPending` is true
- [x] Unrecoverable errors (401, 403, 500) display a user-visible error message rather than a blank screen

### TypeScript

- [x] No `any` type used anywhere in the suppliers module (types, services, hooks, components, pages)
- [x] GET responses are typed as `Supplier` (full read shape including `id`, `created_at`, `updated_at`)
- [x] POST/PATCH bodies are typed as `SupplierWritePayload` (write shape without read-only fields)
- [x] Paginated list response is typed as `PaginatedSuppliers`
- [x] Filter and query params are typed as `SupplierListParams`
