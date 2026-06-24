import { apiClient } from '@/lib/axios'
import type {
  Warehouse,
  WarehouseWritePayload,
  PaginatedWarehouses,
  WarehouseListParams,
} from '@/types/warehouses'

export async function getWarehouses(params: WarehouseListParams): Promise<PaginatedWarehouses> {
  const { data } = await apiClient.get<PaginatedWarehouses>('/warehouses/', { params })
  return data
}

export async function getWarehouse(id: number): Promise<Warehouse> {
  const { data } = await apiClient.get<Warehouse>(`/warehouses/${id}/`)
  return data
}

export async function createWarehouse(payload: WarehouseWritePayload): Promise<Warehouse> {
  const { data } = await apiClient.post<Warehouse>('/warehouses/', payload)
  return data
}

export async function updateWarehouse(
  id: number,
  payload: Partial<WarehouseWritePayload>
): Promise<Warehouse> {
  const { data } = await apiClient.patch<Warehouse>(`/warehouses/${id}/`, payload)
  return data
}

export async function deleteWarehouse(id: number): Promise<void> {
  await apiClient.delete(`/warehouses/${id}/`)
}
