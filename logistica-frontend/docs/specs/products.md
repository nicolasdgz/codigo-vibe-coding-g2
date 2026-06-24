# Spec: Products

## Purpose

The Products module manages the tech inventory for the logistics system. It is accessible to `admin` and `warehouse_staff` users (`IsAdminOrWarehouseStaff` permission). Users can create, view, edit, and delete product records. Products depend on both Suppliers and Warehouses (FK relationships), so the form requires dropdowns that load those options at runtime. Deletion is protected when a product is referenced by any shipment item.

The module uses the **dual serializer pattern**: GET responses return nested `supplier` and `warehouse` objects, while POST/PATCH request bodies send plain integer IDs. TypeScript types must encode both shapes explicitly.

---

## Screens / Routes

| Route | Type | Description |
|---|---|---|
| `/dashboard/products` | Client | Paginated list of all products with filter controls and a "New Product" button to open the create form |
| `/dashboard/products/[id]` | Client | Detail view for a single product — loads current values into an edit form; also exposes the delete action |

---

## Component List

| Component | Type | File Path | Props |
|---|---|---|---|
| `ProductsTable` | Client | `components/products/ProductsTable.tsx` | `data: Product[]`, `total: number`, `page: number`, `onPageChange: (page: number) => void`, `isLoading: boolean` |
| `ProductFilters` | Client | `components/products/ProductFilters.tsx` | `filters: ProductListParams`, `onChange: (filters: ProductListParams) => void`, `supplierOptions: SupplierSummary[]`, `warehouseOptions: WarehouseSummary[]` |
| `ProductForm` | Client | `components/products/ProductForm.tsx` | `defaultValues?: Partial<ProductWritePayload>`, `onSubmit: (data: ProductWritePayload) => void`, `isSubmitting: boolean`, `supplierOptions: SupplierSummary[]`, `warehouseOptions: WarehouseSummary[]` — used inside a Sheet for create and on the detail page for edit |
| `ProductDeleteDialog` | Client | `components/products/ProductDeleteDialog.tsx` | `productId: number`, `productName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onDeleted: () => void` |

---

## TypeScript Types

```typescript
// types/products.ts

/** Nested supplier shape returned inside GET /api/v1/products/ responses */
export interface SupplierSummary {
  id: number;
  name: string;
}

/** Nested warehouse shape returned inside GET /api/v1/products/ responses */
export interface WarehouseSummary {
  id: number;
  name: string;
  city: string;
}

/** Shape returned by GET /api/v1/products/ and GET /api/v1/products/{id}/ */
export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  weight_kg: string;        // decimal returned as string by DRF
  dimensions: string | null;
  unit_price: string;       // decimal returned as string by DRF
  stock: number;
  supplier: SupplierSummary;
  warehouse: WarehouseSummary;
  is_active: boolean;
  created_at: string;       // ISO 8601 datetime
  updated_at: string;       // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/products/ and PATCH /api/v1/products/{id}/ bodies */
export interface ProductWritePayload {
  name: string;
  description?: string | null;
  sku: string;
  weight_kg: string;
  dimensions?: string | null;
  unit_price: string;
  stock: number;
  supplier: number;         // FK — send integer id, not object
  warehouse: number;        // FK — send integer id, not object
  is_active: boolean;
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

/** Query parameters accepted by GET /api/v1/products/ */
export interface ProductListParams {
  page?: number;
  supplier?: number;        // filter by supplier id
  warehouse?: number;       // filter by warehouse id
  is_active?: boolean;
  search?: string;
  ordering?: string;
}
```

---

## API Calls Needed

### Product CRUD hooks (`hooks/products/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useProducts(params: ProductListParams)` | GET | `/api/v1/products/` | Fetch paginated, filtered list; query key `['products', 'list', params]` |
| `useProduct(id: number)` | GET | `/api/v1/products/{id}/` | Fetch a single product for the detail/edit page; query key `['products', id]` |
| `useCreateProduct()` | POST | `/api/v1/products/` | Create a new product; body is `ProductWritePayload` with `supplier` and `warehouse` as integers; on success (201) invalidate `['products', 'list']` |
| `useUpdateProduct(id: number)` | PATCH | `/api/v1/products/{id}/` | Partially update an existing product; FK fields sent as integers even when changed; on success (200) invalidate `['products', 'list']` and `['products', id]` |
| `useDeleteProduct()` | DELETE | `/api/v1/products/{id}/` | Delete a product; on 204 invalidate `['products', 'list']`; on 400 surface the protected-record error message |

### Dropdown data hooks (`hooks/products/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useSupplierOptions()` | GET | `/api/v1/suppliers/?is_active=true&page_size=100` | Load all active suppliers for dropdown; query key `['suppliers', 'options']`; returns `SupplierSummary[]` extracted from paginated `results` |
| `useWarehouseOptions()` | GET | `/api/v1/warehouses/?is_active=true&page_size=100` | Load all active warehouses for dropdown; query key `['warehouses', 'options']`; returns `WarehouseSummary[]` extracted from paginated `results` |

All hooks live in `hooks/products/`. The underlying Axios calls live in `services/products.ts`. The dropdown hooks may reuse types already declared in `types/suppliers.ts` and `types/warehouses.ts` if those modules are already built; otherwise define `SupplierSummary` and `WarehouseSummary` inline in `types/products.ts`.

---

## Acceptance Criteria

### List Page (`/dashboard/products`)

- [x] Page renders a `ProductsTable` with columns: **Name**, **SKU**, **Unit Price**, **Stock**, **Supplier**, **Warehouse**, **Active**
- [x] Supplier column displays `supplier.name` from the nested read shape
- [x] Warehouse column displays `warehouse.name` from the nested read shape
- [x] Table is paginated — page size 20, controlled by `page` query param; total count shown
- [x] `ProductFilters` renders a supplier select (options loaded via `useSupplierOptions`), a warehouse select (options loaded via `useWarehouseOptions`), an `is_active` select (all / active / inactive), a text search input, and an ordering select
- [x] Supplier and warehouse filter selects are disabled while their options are loading
- [x] Changing any filter resets to page 1 and re-fetches the list
- [x] A skeleton or spinner is shown while `useProducts` is loading (`isLoading === true`)
- [x] An error message is shown when the list fetch fails (network or 4xx/5xx)
- [x] A "New Product" button opens a Sheet containing `ProductForm` in create mode

### Create Flow

- [x] `ProductForm` renders fields for all writable attributes: name, description (optional), sku, weight_kg, dimensions (optional), unit_price, stock, supplier dropdown, warehouse dropdown, is_active
- [x] Supplier dropdown renders options from `useSupplierOptions()` — each option displays `name`, submits `id` as an integer
- [x] Warehouse dropdown renders options from `useWarehouseOptions()` — each option displays `name` and `city`, submits `id` as an integer
- [x] Submitting the form calls `useCreateProduct` with a `ProductWritePayload` where `supplier` and `warehouse` are integers (not objects)
- [x] On success (201), the Sheet closes, `['products', 'list']` query is invalidated, and the updated list re-fetches automatically
- [x] While the mutation is pending, the submit button is disabled and shows a loading indicator
- [x] Backend validation errors (400 — e.g., duplicate `sku`, invalid `weight_kg`) are displayed inline next to the relevant field

### Edit Flow (`/dashboard/products/[id]`)

- [x] Page fetches the product via `useProduct(id)` and pre-fills `ProductForm` with current values
- [x] Supplier dropdown pre-selects the current `supplier.id` (sourced from the nested `product.supplier.id` in the read response)
- [x] Warehouse dropdown pre-selects the current `warehouse.id` (sourced from `product.warehouse.id`)
- [x] A skeleton or spinner is shown while the single-product fetch is loading
- [x] Submitting the form calls `useUpdateProduct(id)` with only the changed fields (PATCH semantics — diff against original values); if supplier or warehouse changed, their values are sent as integers
- [x] On success (200), both `['products', 'list']` and `['products', id]` queries are invalidated
- [x] Backend validation errors (400) are displayed inline next to the relevant field
- [x] A "Delete" button is present and opens `ProductDeleteDialog`

### Delete Flow

- [x] `ProductDeleteDialog` displays the product name and a confirmation message before proceeding
- [x] Confirming calls `useDeleteProduct` with the product's `id`
- [x] On success (204), `['products', 'list']` is invalidated and the user is redirected to `/dashboard/products`
- [x] If the backend returns 400 (product is referenced by shipment items), the dialog stays open and displays a user-friendly error such as `"Cannot delete product because it is referenced by existing shipment items."` without crashing
- [x] Cancelling the dialog performs no API call

### Dropdown Loading

- [x] `useSupplierOptions` fetches `/api/v1/suppliers/?is_active=true&page_size=100` and returns `SupplierSummary[]`
- [x] `useWarehouseOptions` fetches `/api/v1/warehouses/?is_active=true&page_size=100` and returns `WarehouseSummary[]`
- [x] Both hooks are called on mount of any page or component that renders `ProductForm` or `ProductFilters`
- [x] If either dropdown fetch fails, the corresponding select renders an error state and does not block the rest of the form
> Missing: Neither `ProductFilters` nor `ProductForm` receive or handle an `isError` state for dropdown fetches. The pages call `useSupplierOptions()` and `useWarehouseOptions()` but only forward `isLoading*` props — no `isError*` props exist on either component, and no error UI is rendered when a dropdown fetch fails.

### Loading & Error States

- [x] All data-fetching hooks show a loading skeleton or spinner while `isLoading` is true
- [x] All mutations disable interactive controls while `isPending` is true
- [x] Unrecoverable errors (401, 403, 500) display a user-visible error message rather than a blank screen

### TypeScript

- [x] No `any` type used anywhere in the products module (types, services, hooks, components, pages)
- [x] GET responses are typed as `Product` — `supplier` field typed as `SupplierSummary`, `warehouse` field typed as `WarehouseSummary`
- [x] POST/PATCH bodies are typed as `ProductWritePayload` — `supplier` and `warehouse` fields are `number`, not objects
- [x] Paginated list response is typed as `PaginatedProducts`
- [x] Filter and query params are typed as `ProductListParams` — `supplier` and `warehouse` filter params are `number` (id), not objects
- [x] Dropdown option arrays are typed as `SupplierSummary[]` and `WarehouseSummary[]` respectively
