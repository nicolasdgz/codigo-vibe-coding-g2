# MVP Build Plan

## Module Build Order

| # | Module | Depends On | API |
|---|--------|------------|-----|
| 1 | auth | — | POST /auth/token/, /auth/token/refresh/ |
| 2 | customers | — | /api/v1/customers/ |
| 3 | warehouses | — | /api/v1/warehouses/ |
| 4 | suppliers | — | /api/v1/suppliers/ |
| 5 | products | suppliers, warehouses | /api/v1/products/ |
| 6 | drivers | user accounts | /api/v1/drivers/ |
| 7 | transport | drivers | /api/v1/transport/ |
| 8 | routes | transport, warehouses | /api/v1/routes/ + /routes/{id}/stops/ |
| 9 | shipments | customers, warehouses, routes, products | /api/v1/shipments/ + /shipments/{id}/items/ |

## Rule

**Always work one module at a time.** Check this file for the correct order. Never start a module whose dependencies are not yet built.

---

## Scope per Module

### 1. auth
Login form with username + password. JWT token storage in Zustand (persisted to localStorage). Sets `logged-in=1` cookie for proxy route guard. Logout clears store, removes cookie, redirects to `/login`.

**Routes:** `/login`

**No CRUD** — auth only.

---

### 2. customers
Manage companies/persons that generate shipments.

**Routes:**
- `/dashboard/customers` — paginated list table + create button
- `/dashboard/customers/[id]` — edit/delete form

**Table columns:** name, customer_type, email, phone, is_active  
**Filters:** customer_type, is_active, search (name/email/tax_id), ordering  
**Note:** DELETE is protected — backend returns 400 if customer has linked shipments. Show user-friendly error.

---

### 3. warehouses
Storage and dispatch points.

**Routes:**
- `/dashboard/warehouses` — list + create
- `/dashboard/warehouses/[id]` — edit/delete

**Table columns:** name, city, country, capacity, is_active  
**Filters:** city, country, is_active, search  
**Note:** DELETE protected if linked to products/routes/shipments.

---

### 4. suppliers
Product vendors.

**Routes:**
- `/dashboard/suppliers` — list + create
- `/dashboard/suppliers/[id]` — edit/delete

**Table columns:** name, email, contact_name, tax_id, is_active  
**Filters:** is_active, search  
**Note:** DELETE protected if linked to products.

---

### 5. products
Tech inventory management.

**Routes:**
- `/dashboard/products` — list + create
- `/dashboard/products/[id]` — edit/delete

**Table columns:** name, sku, unit_price, stock, supplier.name, warehouse.name, is_active  
**Filters:** supplier, warehouse, is_active, search  
**Dropdowns needed:** supplier list, warehouse list  
**Dual serializer:** GET returns nested `{ supplier: { id, name }, warehouse: { id, name } }`, write sends `{ supplier: 1, warehouse: 2 }`  
**Note:** DELETE protected if product is in any shipment item.

---

### 6. drivers
Driver profiles linked to existing auth.User accounts.

**Routes:**
- `/dashboard/drivers` — list + create
- `/dashboard/drivers/[id]` — edit/delete

**Table columns:** user.first_name + user.last_name, license_number, license_expiry, phone, is_available  
**Filters:** is_available, search  
**Note:** POST body uses existing `user` id (no user creation here). DELETE protected if assigned to vehicles.

---

### 7. transport
Vehicle fleet.

**Routes:**
- `/dashboard/transport` — list + create
- `/dashboard/transport/[id]` — edit/delete

**Table columns:** plate_number, vehicle_type, brand, model, year, capacity_kg, driver.name, is_active  
**Filters:** vehicle_type, is_active, driver  
**Dropdown needed:** driver list (nullable — vehicle can be unassigned)  
**Note:** DELETE protected if vehicle is linked to routes.

---

### 8. routes
Delivery routes with sequential stops.

**Routes:**
- `/dashboard/routes` — list + create
- `/dashboard/routes/[id]` — detail page with stop management

**Table columns:** name, origin_warehouse.name, transport.plate_number, status, scheduled_date  
**Filters:** status, transport, origin_warehouse  
**Dropdowns needed:** transport list, warehouse list  
**Detail page:** add/remove stops, mark `actual_arrival` per stop  
**Status lifecycle:** `planned → in_progress → completed / cancelled`  
**Note:** DELETE cascades stops. DELETE protected if linked to shipments.

---

### 9. shipments
Core business entity. Most complex module.

**Routes:**
- `/dashboard/shipments` — list + create
- `/dashboard/shipments/[id]` — detail page with item management

**Table columns:** tracking_number, customer.name, destination_city, status, total_weight_kg, estimated_delivery  
**Filters:** status, customer, origin_warehouse, route, search (tracking_number/city)  
**Dropdowns needed:** customer, warehouse, route (nullable), product (for items)  
**Detail page:** add/remove shipment items (product + quantity + unit_price)  
**Read-only fields:** `tracking_number` (auto TRK-XXXXXXXXXX), `total_weight_kg` (auto-calculated)  
**Status lifecycle:** `pending → in_transit → delivered / cancelled / returned`  
**Note:** DELETE cascades items.
