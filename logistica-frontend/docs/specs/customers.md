# Spec: Customers

## Purpose

The Customers module manages the companies and individuals that generate shipments in the logistics system. It is used exclusively by administrators (`IsAdminGroup` permission) to create, view, edit, and delete customer records. Customers are a foundational entity — they are referenced by Shipments — so deletion is protected when linked records exist.

---

## Screens / Routes

| Route | Type | Description |
|---|---|---|
| `/dashboard/customers` | Client | Paginated list of all customers with filter controls and a "New Customer" button to open the create form |
| `/dashboard/customers/[id]` | Client | Detail view for a single customer — loads current values into an edit form; also exposes the delete action |

---

## Component List

| Component | Type | File Path | Props |
|---|---|---|---|
| `CustomersTable` | Client | `components/customers/CustomersTable.tsx` | `data: Customer[]`, `total: number`, `page: number`, `onPageChange: (page: number) => void`, `isLoading: boolean` |
| `CustomerFilters` | Client | `components/customers/CustomerFilters.tsx` | `filters: CustomerListParams`, `onChange: (filters: CustomerListParams) => void` |
| `CustomerForm` | Client | `components/customers/CustomerForm.tsx` | `defaultValues?: Partial<CustomerWritePayload>`, `onSubmit: (data: CustomerWritePayload) => void`, `isSubmitting: boolean` — used inside a Sheet for create and on the detail page for edit |
| `CustomerDeleteDialog` | Client | `components/customers/CustomerDeleteDialog.tsx` | `customerId: number`, `customerName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onDeleted: () => void` |

---

## TypeScript Types

```typescript
// types/customers.ts

/** Shape returned by GET /api/v1/customers/ and GET /api/v1/customers/{id}/ */
export interface Customer {
  id: number;
  name: string;
  customer_type: 'company' | 'person';
  email: string;
  phone: string;
  address: string;
  tax_id: string | null;
  is_active: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/customers/ and PATCH /api/v1/customers/{id}/ bodies */
export interface CustomerWritePayload {
  name: string;
  customer_type: 'company' | 'person';
  email: string;
  phone: string;
  address: string;
  tax_id?: string | null;
  is_active: boolean;
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedCustomers {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

/** Query parameters accepted by GET /api/v1/customers/ */
export interface CustomerListParams {
  page?: number;
  customer_type?: 'company' | 'person';
  is_active?: boolean;
  search?: string;
  ordering?: string;
}
```

---

## API Calls Needed

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useCustomers(params: CustomerListParams)` | GET | `/api/v1/customers/` | Fetch paginated, filtered list; query key `['customers', 'list', params]` |
| `useCustomer(id: number)` | GET | `/api/v1/customers/{id}/` | Fetch a single customer for the detail/edit page; query key `['customers', id]` |
| `useCreateCustomer()` | POST | `/api/v1/customers/` | Create a new customer; on success invalidate `['customers', 'list']` |
| `useUpdateCustomer(id: number)` | PATCH | `/api/v1/customers/{id}/` | Partially update an existing customer; on success invalidate `['customers', 'list']` and `['customers', id]` |
| `useDeleteCustomer()` | DELETE | `/api/v1/customers/{id}/` | Delete a customer; on 204 invalidate `['customers', 'list']`; on 400 surface the protected-record error message |

All hooks live in `hooks/customers/`. The underlying Axios calls live in `services/customers.ts`.

---

## Acceptance Criteria

### List Page (`/dashboard/customers`)

- [x] Page renders a `CustomersTable` with columns: **Name**, **Type**, **Email**, **Phone**, **Active**
- [x] Table is paginated — page size 20, controlled by `page` query param; total count shown
- [x] `CustomerFilters` renders a `customer_type` select (`company` / `person` / all), an `is_active` toggle, a text search input, and an ordering select
- [x] Changing any filter resets to page 1 and re-fetches the list
- [x] A skeleton or spinner is shown while `useCustomers` is loading (`isLoading === true`)
- [x] An error message is shown when the list fetch fails (network or 4xx/5xx)
- [x] A "New Customer" button opens a Sheet containing `CustomerForm` in create mode

### Create Flow

- [x] `CustomerForm` renders fields for all writable attributes: name, customer_type, email, phone, address, tax_id (optional), is_active
- [x] Submitting the form calls `useCreateCustomer` with a `CustomerWritePayload` (no extra fields, no `id`, no timestamps)
- [x] On success (201), the Sheet closes, `['customers', 'list']` query is invalidated, and the updated list re-fetches automatically
- [x] While the mutation is pending, the submit button is disabled and shows a loading indicator
- [x] Backend validation errors (400 — e.g., duplicate email or tax_id) are displayed inline next to the relevant field

### Edit Flow (`/dashboard/customers/[id]`)

- [x] Page fetches the customer via `useCustomer(id)` and pre-fills `CustomerForm` with current values
- [x] A skeleton or spinner is shown while the single-customer fetch is loading
- [x] Submitting the form calls `useUpdateCustomer(id)` with only the changed fields (PATCH semantics)
- [x] On success (200), both `['customers', 'list']` and `['customers', id]` queries are invalidated
- [x] Backend validation errors (400) are displayed inline next to the relevant field
- [x] A "Delete" button is present and opens `CustomerDeleteDialog`

### Delete Flow

- [x] `CustomerDeleteDialog` displays the customer name and a confirmation message before proceeding
- [x] Confirming calls `useDeleteCustomer` with the customer's `id`
- [x] On success (204), `['customers', 'list']` is invalidated and the user is redirected to `/dashboard/customers`
- [x] If the backend returns 400 (customer has linked shipments), the dialog stays open and displays the error message `"Cannot delete customer with existing shipments."` without crashing
- [x] Cancelling the dialog performs no API call

### Loading & Error States

- [x] All data-fetching hooks show a loading skeleton or spinner while `isLoading` is true
- [x] All mutations disable interactive controls while `isPending` is true
- [x] Unrecoverable errors (401, 403, 500) display a user-visible error message rather than a blank screen

### TypeScript

- [x] No `any` type used anywhere in the customers module (types, services, hooks, components, pages)
- [x] GET responses are typed as `Customer` (full read shape including `id`, `created_at`, `updated_at`)
- [x] POST/PATCH bodies are typed as `CustomerWritePayload` (write shape without read-only fields)
- [x] Paginated list response is typed as `PaginatedCustomers`
- [x] Filter and query params are typed as `CustomerListParams`
