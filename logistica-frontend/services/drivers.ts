import { apiClient } from '@/lib/axios'
import type {
  Driver,
  DriverWritePayload,
  PaginatedDrivers,
  DriverListParams,
} from '@/types/drivers'

export async function getDrivers(params: DriverListParams): Promise<PaginatedDrivers> {
  const { data } = await apiClient.get<PaginatedDrivers>('/drivers/', { params })
  return data
}

export async function getDriver(id: number): Promise<Driver> {
  const { data } = await apiClient.get<Driver>(`/drivers/${id}/`)
  return data
}

export async function createDriver(payload: DriverWritePayload): Promise<Driver> {
  const { data } = await apiClient.post<Driver>('/drivers/', payload)
  return data
}

export async function updateDriver(
  id: number,
  payload: Partial<DriverWritePayload>
): Promise<Driver> {
  const { data } = await apiClient.patch<Driver>(`/drivers/${id}/`, payload)
  return data
}

export async function deleteDriver(id: number): Promise<void> {
  await apiClient.delete(`/drivers/${id}/`)
}
