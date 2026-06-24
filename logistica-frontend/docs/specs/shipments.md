# Spec: Shipments

## Purpose

The Shipments module is the core business entity of the logistics system. It represents a product shipment from an origin warehouse to a destination address, linking customers, routes, and transported products. Accessible only to `admin` users (`IsAdminGroup` permission). Users can create, view, edit, and delete shipments. Each shipment has a system-generated `tracking_number` (`TRK-XXXXXXXXXX`), a customer, an origin warehouse, a destination (address, city, country), a status lifecycle (`pending → in_transit → delivered / cancelled / returned`), an optional route assignment, and a `total_weight_kg` that is auto-calculated from shipment items. Items are a nested resource managed on the detail page — each item references a product, a quantity, and a unit price snapshot. The module uses the **dual serializer pattern**: GET responses return nested `customer`, `origin_warehouse`, and `route` objects; POST/PATCH request bodies send plain integer IDs (or `null` for nullable FKs). Deleting a shipment cascades and removes all its items.

---

## Screens / Routes

| Route | Type | Description |
|---|---|---|
| `/dashboard/shipments` | Client | Paginated list of all shipments with filter controls and a "New Shipment" button to open the create form |
| `/dashboard/shipments/[id]` | Client | Detail view for a single shipment — loads current values into an edit form, exposes the delete action, and provides inline item management (add / remove items) |

---

## Component List

| Component | Type | File Path | Props |
|---|---|---|---|
| `ShipmentTable` | Client | `components/shipments/ShipmentTable.tsx` | `data: Shipment[]`, `total: number`, `page: number`, `onPageChange: (page: number) => void`, `isLoading: boolean` |
| `ShipmentFilters` | Client | `components/shipments/ShipmentFilters.tsx` | `filters: ShipmentListParams`, `onChange: (filters: ShipmentListParams) => void`, `customerOptions: CustomerSummary[]`, `warehouseOptions: WarehouseSummary[]`, `routeOptions: RouteSummary[]`, `isErrorCustomers: boolean`, `isErrorWarehouses: boolean`, `isErrorRoutes: boolean` |
| `ShipmentForm` | Client | `components/shipments/ShipmentForm.tsx` | `defaultValues?: Partial<ShipmentWritePayload>`, `currentCustomer?: CustomerSummary \| null`, `currentOriginWarehouse?: WarehouseSummary \| null`, `currentRoute?: RouteSummary \| null`, `onSubmit: (data: ShipmentWritePayload) => void`, `isSubmitting: boolean`, `mode: 'create' \| 'edit'`, `customerOptions: CustomerSummary[]`, `warehouseOptions: WarehouseSummary[]`, `routeOptions: RouteSummary[]`, `isErrorCustomers: boolean`, `isErrorWarehouses: boolean`, `isErrorRoutes: boolean`, `apiErrors?: Record<string, string[]>` |
| `ShipmentDeleteDialog` | Client | `components/shipments/ShipmentDeleteDialog.tsx` | `shipmentId: number`, `trackingNumber: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onDeleted: () => void` |
| `ShipmentItemList` | Client | `components/shipments/ShipmentItemList.tsx` | `shipmentId: number`, `items: ShipmentItem[]`, `isLoading: boolean` |
| `ShipmentItemForm` | Client | `components/shipments/ShipmentItemForm.tsx` | `shipmentId: number`, `productOptions: ProductSummary[]`, `isErrorProducts: boolean`, `onSuccess: () => void` |

---

## TypeScript Types

```typescript
// types/shipments.ts

/** Nested customer shape returned inside GET /api/v1/shipments/ responses */
export interface CustomerSummary {
  id: number;
  name: string;
  email: string;
  customer_type: string;
}

/** Nested warehouse shape returned inside GET /api/v1/shipments/ responses */
export interface WarehouseSummary {
  id: number;
  name: string;
  city: string;
}

/** Nested route shape returned inside GET /api/v1/shipments/ responses */
export interface RouteSummary {
  id: number;
  name: string;
  status: string;
}

/** Nested product shape returned inside ShipmentItem responses */
export interface ProductSummary {
  id: number;
  name: string;
  sku: string;
  weight_kg: string;
}

/** Nested created_by user shape */
export interface UserSummary {
  id: number;
  username: string;
  email: string;
}

/** Shipment item shape returned in GET /api/v1/shipments/{id}/items/ and nested in Shipment */
export interface ShipmentItem {
  id: number;
  product: ProductSummary;
  quantity: number;
  unit_price: string;   // decimal string e.g. "1299.99"
  subtotal: string;     // auto-calculated: quantity × unit_price, read-only
}

/** Shape returned by GET /api/v1/shipments/ and GET /api/v1/shipments/{id}/ */
export interface Shipment {
  id: number;
  tracking_number: string;              // auto-generated, read-only
  customer: CustomerSummary | null;
  origin_warehouse: WarehouseSummary;
  destination_address: string;
  destination_city: string;
  destination_country: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'returned';
  route: RouteSummary | null;
  estimated_delivery: string | null;    // 'YYYY-MM-DD' or null
  actual_delivery: string | null;       // ISO 8601 datetime or null
  total_weight_kg: string;              // auto-calculated, read-only
  calculated_cost: string;              // decimal string e.g. "125000.00"
  notes: string | null;
  created_by: UserSummary;              // auto-filled from JWT, read-only
  items: ShipmentItem[];                // read-only on shipment; managed via /items/ endpoints
  created_at: string;                   // ISO 8601 datetime
  updated_at: string;                   // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/shipments/ and PATCH /api/v1/shipments/{id}/ bodies */
export interface ShipmentWritePayload {
  customer: number | null;              // FK — send integer id or null
  origin_warehouse: number;             // FK — send integer id
  destination_address: string;
  destination_city: string;
  destination_country: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'returned';
  route: number | null;                 // FK — send integer id or null
  estimated_delivery: string | null;    // 'YYYY-MM-DD' or null
  calculated_cost: string;
  notes: string | null;
}

/** Shape sent in POST /api/v1/shipments/{id}/items/ body */
export interface ShipmentItemWritePayload {
  product: number;                      // FK — send integer id
  quantity: number;
  unit_price?: string;                  // optional; defaults to product.unit_price if omitted
}

/** Shape sent in PATCH /api/v1/shipments/{id}/items/{item_id}/ body */
export interface ShipmentItemPatchPayload {
  quantity?: number;
  unit_price?: string;
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedShipments {
  count: number;
  next: string | null;
  previous: string | null;
  results: Shipment[];
}

/** Query parameters accepted by GET /api/v1/shipments/ */
export interface ShipmentListParams {
  page?: number;
  status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'returned';
  customer?: number;                    // filter by customer id
  origin_warehouse?: number;            // filter by warehouse id
  route?: number;                       // filter by route id
  search?: string;                      // searches tracking_number, destination_city, destination_country
  ordering?: string;                    // e.g. "-created_at" or "total_weight_kg"
}
```

---

## API Calls Needed

All hooks live in `hooks/shipments/`. Underlying Axios calls live in `services/shipments.ts`.

### Shipment CRUD hooks (`hooks/shipments/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useShipmentList(params: ShipmentListParams)` | GET | `/shipments/` | Fetch paginated, filtered list; query key `['shipments', 'list', params]` |
| `useShipment(id: number)` | GET | `/shipments/{id}/` | Fetch a single shipment for the detail/edit page; query key `['shipments', id]` |
| `useCreateShipment()` | POST | `/shipments/` | Create a new shipment; body is `ShipmentWritePayload`; on success (201) invalidate `['shipments', 'list']` |
| `useUpdateShipment()` | PATCH | `/shipments/{id}/` | Partially update; call as `mutate({ id, payload })`; on success (200) invalidate `['shipments', 'list']` and `['shipments', id]` |
| `useDeleteShipment()` | DELETE | `/shipments/{id}/` | Delete a shipment; on 204 invalidate `['shipments', 'list']`; items cascade-deleted automatically |

### Item management hooks (`hooks/shipments/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useCreateShipmentItem()` | POST | `/shipments/{id}/items/` | Add an item to a shipment; call as `mutate({ shipmentId, payload })`; on success (201) invalidate `['shipments', id]` |
| `usePatchShipmentItem()` | PATCH | `/shipments/{id}/items/{item_id}/` | Update item quantity or unit_price; call as `mutate({ shipmentId, itemId, payload })`; on success (200) invalidate `['shipments', id]` |
| `useDeleteShipmentItem()` | DELETE | `/shipments/{id}/items/{item_id}/` | Remove an item; call as `mutate({ shipmentId, itemId })`; on success (204) invalidate `['shipments', id]` |

### Dropdown options hooks (`hooks/shipments/`)

| Hook | Method | Endpoint | Purpose |
|---|---|---|---|
| `useCustomerOptions()` | GET | `/customers/?is_active=true&page_size=100` | Fetch active customers for form/filter dropdowns; returns `CustomerSummary[]`; query key `['customers', 'options']` |
| `useWarehouseOptions()` | GET | `/warehouses/?is_active=true&page_size=100` | Fetch active warehouses for form/filter dropdowns; returns `WarehouseSummary[]`; query key `['warehouses', 'options']` |
| `useRouteOptions()` | GET | `/routes/?is_active=true&page_size=100` | Fetch active routes for form/filter dropdowns; returns `RouteSummary[]`; query key `['routes', 'options']` |
| `useProductOptions()` | GET | `/products/?is_active=true&page_size=100` | Fetch active products for item form dropdown; returns `ProductSummary[]`; query key `['products', 'options']` |

> Note: All option hooks live in `hooks/shipments/` and use summary types defined in `types/shipments.ts`. Service call paths omit `/api/v1` prefix (baseURL already includes it).

---

## Acceptance Criteria

### List Page (`/dashboard/shipments`)

- [ ] Page renders a `ShipmentTable` with columns: **Tracking Number**, **Customer**, **Destination City**, **Status**, **Total Weight (kg)**, **Estimated Delivery**
- [ ] Customer column shows `customer.name` from the nested read shape, or a dash when `customer` is `null`
- [ ] Status column renders a colored badge reflecting the shipment's `status` value (`pending`, `in_transit`, `delivered`, `cancelled`, `returned`)
- [ ] Table is paginated — page size 20, controlled by `page` query param; total count shown
- [ ] `ShipmentFilters` renders: a `status` select (all / pending / in_transit / delivered / cancelled / returned), a `customer` select populated from `useCustomerOptions()`, an `origin_warehouse` select populated from `useWarehouseOptions()`, a `route` select populated from `useRouteOptions()`, and a text search input (searches tracking_number, destination_city, destination_country)
- [ ] Changing any filter resets to page 1 and re-fetches the list
- [ ] If `useCustomerOptions` fails, `isErrorCustomers` prop is passed to `ShipmentFilters` and the customer filter shows a user-friendly error state instead of crashing
- [ ] If `useWarehouseOptions` fails, `isErrorWarehouses` prop is passed to `ShipmentFilters` and the warehouse filter shows a user-friendly error state instead of crashing
- [ ] If `useRouteOptions` fails, `isErrorRoutes` prop is passed to `ShipmentFilters` and the route filter shows a user-friendly error state instead of crashing
- [ ] A skeleton or spinner is shown while `useShipmentList` is loading (`isLoading === true`)
- [ ] An error message is shown when the list fetch fails (network or 4xx/5xx)
- [ ] A "New Shipment" button opens a Sheet containing `ShipmentForm` in create mode

### Create Flow

- [ ] `ShipmentForm` in `mode="create"` renders inputs for: `customer` (select from `customerOptions`, nullable — includes an "No customer" option), `origin_warehouse` (select from `warehouseOptions`, required), `destination_address` (text, required), `destination_city` (text, required), `destination_country` (text, required), `status` (select: pending / in_transit / delivered / cancelled / returned, defaults to "pending"), `route` (select from `routeOptions`, nullable — includes an "No route" option), `estimated_delivery` (date input, `YYYY-MM-DD`, optional), `calculated_cost` (text/number input, required), `notes` (textarea, optional)
- [ ] The `customer` select is populated from `customerOptions` prop; if `isErrorCustomers` is true, the select shows an error state
- [ ] The `origin_warehouse` select is populated from `warehouseOptions` prop; if `isErrorWarehouses` is true, the select shows an error state
- [ ] The `route` select is populated from `routeOptions` prop; if `isErrorRoutes` is true, the select shows an error state
- [ ] Submitting the form calls `useCreateShipment` with a `ShipmentWritePayload` where `customer` and `route` are integers or `null`, and `origin_warehouse` is an integer
- [ ] `tracking_number` and `total_weight_kg` are NOT present in the create form — they are read-only, auto-generated by the backend
- [ ] On success (201), the Sheet closes, `['shipments', 'list']` query is invalidated, and the updated list re-fetches automatically
- [ ] While the mutation is pending, the submit button is disabled and shows a loading indicator
- [ ] Backend validation errors (400) are received via `apiErrors` prop and set on the form via `useEffect → form.setError` for inline display next to the relevant field

### Edit Flow (`/dashboard/shipments/[id]`)

- [ ] Page fetches the shipment via `useShipment(id)` and pre-fills `ShipmentForm` with current values
- [ ] The `customer` field is pre-selected in the dropdown based on `customer.id` from the nested read shape (or shows "No customer" when `null`)
- [ ] The `origin_warehouse` field is pre-selected based on `origin_warehouse.id`
- [ ] The `route` field is pre-selected based on `route.id` (or shows "No route" when `null`)
- [ ] `tracking_number` and `total_weight_kg` are shown as read-only display values (not form inputs)
- [ ] All editable fields are pre-filled: `destination_address`, `destination_city`, `destination_country`, `status`, `estimated_delivery`, `calculated_cost`, `notes`
- [ ] A skeleton or spinner is shown while the single-shipment fetch is loading
- [ ] Submitting the form calls `useUpdateShipment()` with only the changed fields via `mutate({ id, payload })` (PATCH semantics — diff against original values)
- [ ] The PATCH diff correctly handles `customer` and `route` changing to `null` (clearing them must be sent explicitly)
- [ ] On success (200), both `['shipments', 'list']` and `['shipments', id]` queries are invalidated
- [ ] Backend validation errors (400) are set inline via `apiErrors` prop pattern
- [ ] A "Delete" button is present and opens `ShipmentDeleteDialog`

### Delete Flow

- [ ] `ShipmentDeleteDialog` displays the shipment's `tracking_number` and a confirmation message before proceeding
- [ ] Confirming calls `useDeleteShipment` with the shipment's `id`
- [ ] On success (204), `['shipments', 'list']` is invalidated and the user is redirected to `/dashboard/shipments`
- [ ] All items are cascade-deleted automatically by the backend — no separate item deletion needed
- [ ] Cancelling the dialog performs no API call

### Item Management (detail page)

- [ ] The detail page (`/dashboard/shipments/[id]`) renders a `ShipmentItemList` showing all items for the shipment
- [ ] Each item row shows: `product.name`, `product.sku`, `quantity`, `unit_price`, `subtotal`
- [ ] The shipment's `total_weight_kg` is displayed as a read-only summary on the detail page, updating reactively when items change
- [ ] An "Add Item" button renders `ShipmentItemForm` inline or in a dialog; form fields: `product` (select from `productOptions`, required), `quantity` (number, required, positive integer), `unit_price` (number, optional — defaults to product's price if omitted)
- [ ] If `useProductOptions` fails, `isErrorProducts` is passed to `ShipmentItemForm` and the product select shows a user-friendly error state
- [ ] Submitting the add-item form calls `useCreateShipmentItem` with `mutate({ shipmentId, payload })`; on success (201), `['shipments', id]` is invalidated and the item list refreshes
- [ ] Each item row has a "Delete" action; confirming calls `useDeleteShipmentItem` with `mutate({ shipmentId, itemId })`; on success (204), `['shipments', id]` is invalidated and `total_weight_kg` updates
- [ ] Item management mutations show loading/disabled states while pending
- [ ] Item-level validation errors (400) from add-item are displayed inline near the form

### Loading & Error States

- [ ] All data-fetching hooks show a loading skeleton or spinner while `isLoading` is true
- [ ] All mutations disable interactive controls while `isPending` is true
- [ ] Unrecoverable errors (401, 403, 500) display a user-visible error message rather than a blank screen

### TypeScript

- [ ] No `any` type used anywhere in the shipments module (types, services, hooks, components, pages)
- [ ] GET responses are typed as `Shipment` — `customer` typed as `CustomerSummary | null`, `origin_warehouse` as `WarehouseSummary`, `route` as `RouteSummary | null`, `items` as `ShipmentItem[]`
- [ ] POST/PATCH shipment bodies are typed as `ShipmentWritePayload` — `customer` and `route` fields are integers or `null`, `origin_warehouse` is an integer
- [ ] POST item body is typed as `ShipmentItemWritePayload`; PATCH item body is typed as `ShipmentItemPatchPayload`
- [ ] Paginated list response is typed as `PaginatedShipments`
- [ ] Filter and query params are typed as `ShipmentListParams`
- [ ] `CustomerSummary`, `WarehouseSummary`, `RouteSummary`, and `ProductSummary` are defined in `types/shipments.ts` (not imported from other modules' type files)
- [ ] `tracking_number` and `total_weight_kg` are present on `Shipment` (read type) but absent from `ShipmentWritePayload` (write type)
