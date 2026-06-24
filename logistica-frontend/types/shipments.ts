/** Nested customer shape returned inside GET /api/v1/shipments/ responses */
export interface CustomerSummary {
  id: number
  name: string
  email: string
  customer_type: string
}

/** Nested warehouse shape returned inside GET /api/v1/shipments/ responses */
export interface WarehouseSummary {
  id: number
  name: string
  city: string
}

/** Nested route shape returned inside GET /api/v1/shipments/ responses */
export interface RouteSummary {
  id: number
  name: string
  status: string
}

/** Nested product shape returned inside ShipmentItem responses */
export interface ProductSummary {
  id: number
  name: string
  sku: string
  weight_kg: string
}

/** Nested created_by user shape */
export interface UserSummary {
  id: number
  username: string
  email: string
}

/** Shipment item shape returned in GET /api/v1/shipments/{id}/items/ and nested in Shipment */
export interface ShipmentItem {
  id: number
  product: ProductSummary
  quantity: number
  unit_price: string   // decimal string e.g. "1299.99"
  subtotal: string     // auto-calculated: quantity × unit_price, read-only
}

/** Shape returned by GET /api/v1/shipments/ and GET /api/v1/shipments/{id}/ */
export interface Shipment {
  id: number
  tracking_number: string              // auto-generated, read-only
  customer: CustomerSummary | null
  origin_warehouse: WarehouseSummary
  destination_address: string
  destination_city: string
  destination_country: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'returned'
  route: RouteSummary | null
  estimated_delivery: string | null    // 'YYYY-MM-DD' or null
  actual_delivery: string | null       // ISO 8601 datetime or null
  total_weight_kg: string              // auto-calculated, read-only
  calculated_cost: string              // decimal string e.g. "125000.00"
  notes: string | null
  created_by: UserSummary              // auto-filled from JWT, read-only
  items: ShipmentItem[]                // read-only on shipment; managed via /items/ endpoints
  created_at: string                   // ISO 8601 datetime
  updated_at: string                   // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/shipments/ and PATCH /api/v1/shipments/{id}/ bodies */
export interface ShipmentWritePayload {
  customer: number | null              // FK — send integer id or null
  origin_warehouse: number             // FK — send integer id
  destination_address: string
  destination_city: string
  destination_country: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'returned'
  route: number | null                 // FK — send integer id or null
  estimated_delivery: string | null    // 'YYYY-MM-DD' or null
  calculated_cost: string
  notes: string | null
}

/** Shape sent in POST /api/v1/shipments/{id}/items/ body */
export interface ShipmentItemWritePayload {
  product: number                      // FK — send integer id
  quantity: number
  unit_price?: string                  // optional; defaults to product.unit_price if omitted
}

/** Shape sent in PATCH /api/v1/shipments/{id}/items/{item_id}/ body */
export interface ShipmentItemPatchPayload {
  quantity?: number
  unit_price?: string
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedShipments {
  count: number
  next: string | null
  previous: string | null
  results: Shipment[]
}

/** Query parameters accepted by GET /api/v1/shipments/ */
export interface ShipmentListParams {
  page?: number
  status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled' | 'returned'
  customer?: number                    // filter by customer id
  origin_warehouse?: number            // filter by warehouse id
  route?: number                       // filter by route id
  search?: string                      // searches tracking_number, destination_city, destination_country
  ordering?: string                    // e.g. "-created_at" or "total_weight_kg"
  page_size?: number
}
