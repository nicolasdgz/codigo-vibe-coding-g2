/** Shape returned by GET /api/v1/customers/ and GET /api/v1/customers/{id}/ */
export interface Customer {
  id: number
  name: string
  customer_type: 'company' | 'person'
  email: string
  phone: string
  address: string
  tax_id: string | null
  is_active: boolean
  created_at: string // ISO 8601 datetime
  updated_at: string // ISO 8601 datetime
}

/** Shape sent in POST /api/v1/customers/ and PATCH /api/v1/customers/{id}/ bodies */
export interface CustomerWritePayload {
  name: string
  customer_type: 'company' | 'person'
  email: string
  phone: string
  address: string
  tax_id?: string | null
  is_active: boolean
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedCustomers {
  count: number
  next: string | null
  previous: string | null
  results: Customer[]
}

/** Query parameters accepted by GET /api/v1/customers/ */
export interface CustomerListParams {
  page?: number
  customer_type?: 'company' | 'person'
  is_active?: boolean
  search?: string
  ordering?: string
}
