/** Nested supplier shape returned inside GET /products/ responses */
export interface SupplierSummary {
  id: number
  name: string
}

/** Nested warehouse shape returned inside GET /products/ responses */
export interface WarehouseSummary {
  id: number
  name: string
  city: string
}

/** Shape returned by GET /products/ and GET /products/{id}/ */
export interface Product {
  id: number
  name: string
  description: string | null
  sku: string
  weight_kg: string       // decimal returned as string by DRF
  dimensions: string | null
  unit_price: string      // decimal returned as string by DRF
  stock: number
  supplier: SupplierSummary
  warehouse: WarehouseSummary
  is_active: boolean
  created_at: string      // ISO 8601 datetime
  updated_at: string      // ISO 8601 datetime
}

/** Shape sent in POST /products/ and PATCH /products/{id}/ bodies */
export interface ProductWritePayload {
  name: string
  description?: string | null
  sku: string
  weight_kg: string
  dimensions?: string | null
  unit_price: string
  stock: number
  supplier: number        // FK — send integer id, not object
  warehouse: number       // FK — send integer id, not object
  is_active: boolean
}

/** DRF paginated wrapper for the list endpoint */
export interface PaginatedProducts {
  count: number
  next: string | null
  previous: string | null
  results: Product[]
}

/** Query parameters accepted by GET /products/ */
export interface ProductListParams {
  page?: number
  supplier?: number       // filter by supplier id
  warehouse?: number      // filter by warehouse id
  is_active?: boolean
  search?: string
  ordering?: string
  page_size?: number
}
