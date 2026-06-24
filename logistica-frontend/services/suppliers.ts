import { apiClient } from '@/lib/axios'
import type {
  Supplier,
  SupplierWritePayload,
  PaginatedSuppliers,
  SupplierListParams,
} from '@/types/suppliers'

export async function getSuppliers(params: SupplierListParams): Promise<PaginatedSuppliers> {
  const { data } = await apiClient.get<PaginatedSuppliers>('/suppliers/', { params })
  return data
}

export async function getSupplier(id: number): Promise<Supplier> {
  const { data } = await apiClient.get<Supplier>(`/suppliers/${id}/`)
  return data
}

export async function createSupplier(payload: SupplierWritePayload): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>('/suppliers/', payload)
  return data
}

export async function updateSupplier(
  id: number,
  payload: Partial<SupplierWritePayload>
): Promise<Supplier> {
  const { data } = await apiClient.patch<Supplier>(`/suppliers/${id}/`, payload)
  return data
}

export async function deleteSupplier(id: number): Promise<void> {
  await apiClient.delete(`/suppliers/${id}/`)
}
