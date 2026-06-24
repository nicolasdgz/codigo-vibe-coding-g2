import { apiClient } from '@/lib/axios'
import type {
  Product,
  ProductWritePayload,
  PaginatedProducts,
  ProductListParams,
  SupplierSummary,
  WarehouseSummary,
} from '@/types/products'

export async function getProducts(params: ProductListParams): Promise<PaginatedProducts> {
  const { data } = await apiClient.get<PaginatedProducts>('/products/', { params })
  return data
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/products/${id}/`)
  return data
}

export async function createProduct(payload: ProductWritePayload): Promise<Product> {
  const { data } = await apiClient.post<Product>('/products/', payload)
  return data
}

export async function updateProduct(
  id: number,
  payload: Partial<ProductWritePayload>
): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/products/${id}/`, payload)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/products/${id}/`)
}

export async function getSupplierOptions(): Promise<SupplierSummary[]> {
  const { data } = await apiClient.get<{ count: number; results: SupplierSummary[] }>(
    '/suppliers/',
    { params: { is_active: true, page_size: 100 } }
  )
  return data.results
}

export async function getWarehouseOptions(): Promise<WarehouseSummary[]> {
  const { data } = await apiClient.get<{ count: number; results: WarehouseSummary[] }>(
    '/warehouses/',
    { params: { is_active: true, page_size: 100 } }
  )
  return data.results
}
