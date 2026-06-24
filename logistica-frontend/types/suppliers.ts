/** Shape returned by GET /suppliers/ and GET /suppliers/{id}/ */
export interface Supplier {
  id: number
  name: string
  email: string
  phone: string
  address: string
  tax_id: string
  contact_name: string
  is_active: boolean
  created_at: string // ISO 8601 datetime
  updated_at: string // ISO 8601 datetime
}

/** Shape sent in POST /suppliers/ and PATCH /suppliers/{id}/ bodies */
export interface SupplierWritePayload {
  name: string
  email: string
  phone: string
  address: string
  tax_id: string
  contact_name: string
  is_active: boolean
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedSuppliers {
  count: number
  next: string | null
  previous: string | null
  results: Supplier[]
}

/** Query parameters accepted by GET /suppliers/ */
export interface SupplierListParams {
  page?: number
  is_active?: boolean
  search?: string
  ordering?: string
}
