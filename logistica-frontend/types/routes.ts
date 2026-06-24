/** Nested transport shape returned inside GET /routes/ responses */
export interface TransportSummary {
  id: number
  plate_number: string
  vehicle_type: string
  brand: string
}

/** Nested warehouse shape returned inside GET /routes/ responses */
export interface WarehouseSummary {
  id: number
  name: string
  city: string
}

/** Route stop shape — same structure in both list and nested responses */
export interface RouteStop {
  id: number
  order: number
  address: string
  city: string
  estimated_arrival: string | null  // ISO 8601 datetime or null
  actual_arrival: string | null     // ISO 8601 datetime or null
}

/** Shape returned by GET /routes/ and GET /routes/{id}/ */
export interface Route {
  id: number
  name: string
  origin_warehouse: WarehouseSummary
  transport: TransportSummary | null
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date: string            // 'YYYY-MM-DD'
  stops: RouteStop[]
  created_at: string                // ISO 8601 datetime
  updated_at: string                // ISO 8601 datetime
}

/** Shape sent in POST /routes/ and PATCH /routes/{id}/ bodies */
export interface RouteWritePayload {
  name: string
  origin_warehouse: number          // FK — send integer id
  transport: number | null          // FK — send integer id or null
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date: string            // 'YYYY-MM-DD'
}

/** Shape sent in POST /routes/{id}/stops/ body */
export interface RouteStopWritePayload {
  order: number
  address: string
  city: string
  estimated_arrival?: string | null // ISO 8601 datetime, optional
}

/** Shape sent in PATCH /routes/{id}/stops/{stop_id}/ body */
export interface RouteStopPatchPayload {
  actual_arrival?: string | null
  order?: number
  address?: string
  city?: string
  estimated_arrival?: string | null
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedRoutes {
  count: number
  next: string | null
  previous: string | null
  results: Route[]
}

/** Query parameters accepted by GET /routes/ */
export interface RouteListParams {
  page?: number
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  transport?: number                // filter by transport id
  origin_warehouse?: number         // filter by warehouse id
  search?: string                   // searches name
  ordering?: string                 // e.g. "scheduled_date" or "-created_at"
  page_size?: number
}
