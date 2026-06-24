/** Nested user shape returned inside GET /drivers/ responses */
export interface UserSummary {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

/** Shape returned by GET /drivers/ and GET /drivers/{id}/ */
export interface Driver {
  id: number
  user: UserSummary
  license_number: string
  license_expiry: string   // date as "YYYY-MM-DD"
  phone: string
  is_available: boolean
  created_at: string       // ISO 8601 datetime
  updated_at: string       // ISO 8601 datetime
}

/** Shape sent in POST /drivers/ and PATCH /drivers/{id}/ bodies */
export interface DriverWritePayload {
  user: number             // FK — send integer id of an existing auth.User
  license_number: string
  license_expiry: string   // "YYYY-MM-DD"
  phone: string
  is_available: boolean
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedDrivers {
  count: number
  next: string | null
  previous: string | null
  results: Driver[]
}

/** Query parameters accepted by GET /drivers/ */
export interface DriverListParams {
  page?: number
  is_available?: boolean   // filter by availability status
  search?: string          // searches license_number, user__username, user__first_name, user__last_name
  ordering?: string        // e.g. "license_expiry" or "-created_at"
  page_size?: number
}
