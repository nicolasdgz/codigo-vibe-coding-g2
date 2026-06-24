/** Nested driver shape returned inside GET /transport/ responses */
export interface DriverSummary {
  id: number
  license_number: string
  name: string           // pre-formatted full name from backend
  is_available: boolean
}

/** Shape returned by GET /transport/ and GET /transport/{id}/ */
export interface Transport {
  id: number
  plate_number: string
  vehicle_type: 'truck' | 'van' | 'motorcycle' | 'car'
  brand: string
  model: string
  year: number
  capacity_kg: string    // decimal as string, e.g. "8000.00"
  capacity_units: number
  driver: DriverSummary | null
  is_active: boolean
  created_at: string     // ISO 8601 datetime
  updated_at: string     // ISO 8601 datetime
}

/** Shape sent in POST /transport/ and PATCH /transport/{id}/ bodies */
export interface TransportWritePayload {
  plate_number: string
  vehicle_type: 'truck' | 'van' | 'motorcycle' | 'car'
  brand: string
  model: string
  year: number
  capacity_kg: string    // decimal as string
  capacity_units: number
  driver: number | null  // FK — send integer id or null
  is_active: boolean
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedTransport {
  count: number
  next: string | null
  previous: string | null
  results: Transport[]
}

/** Query parameters accepted by GET /transport/ */
export interface TransportListParams {
  page?: number
  vehicle_type?: 'truck' | 'van' | 'motorcycle' | 'car'
  is_active?: boolean
  driver?: number        // filter by driver id
  search?: string        // searches plate_number, brand, model
  ordering?: string      // e.g. "year" or "-capacity_kg"
  page_size?: number
}
