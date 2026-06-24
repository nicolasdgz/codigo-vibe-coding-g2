/** Shape returned by GET /api/v1/warehouses/ and GET /api/v1/warehouses/{id}/ */
export interface Warehouse {
  id: number
  name: string
  address: string
  city: string
  country: string
  latitude: string | null   // decimal string as returned by DRF, e.g. "4.729886"
  longitude: string | null  // decimal string as returned by DRF, e.g. "-74.046543"
  capacity: number
  is_active: boolean
  created_at: string // ISO 8601 datetime
  updated_at: string // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/warehouses/ and PATCH /api/v1/warehouses/{id}/ bodies */
export interface WarehouseWritePayload {
  name: string
  address: string
  city: string
  country: string
  latitude?: string | null
  longitude?: string | null
  capacity: number
  is_active: boolean
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedWarehouses {
  count: number
  next: string | null
  previous: string | null
  results: Warehouse[]
}

/** Query parameters accepted by GET /api/v1/warehouses/ */
export interface WarehouseListParams {
  page?: number
  city?: string
  country?: string
  is_active?: boolean
  search?: string
  ordering?: string
}
