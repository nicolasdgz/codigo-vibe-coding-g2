import { apiClient } from '@/lib/axios'
import type {
  Transport,
  TransportWritePayload,
  PaginatedTransport,
  TransportListParams,
  DriverSummary,
} from '@/types/transport'

export async function getTransportList(params: TransportListParams): Promise<PaginatedTransport> {
  const { data } = await apiClient.get<PaginatedTransport>('/transport/', { params })
  return data
}

export async function getTransport(id: number): Promise<Transport> {
  const { data } = await apiClient.get<Transport>(`/transport/${id}/`)
  return data
}

export async function createTransport(payload: TransportWritePayload): Promise<Transport> {
  const { data } = await apiClient.post<Transport>('/transport/', payload)
  return data
}

export async function updateTransport(
  id: number,
  payload: Partial<TransportWritePayload>
): Promise<Transport> {
  const { data } = await apiClient.patch<Transport>(`/transport/${id}/`, payload)
  return data
}

export async function deleteTransport(id: number): Promise<void> {
  await apiClient.delete(`/transport/${id}/`)
}

export async function getDriverOptions(): Promise<DriverSummary[]> {
  const { data } = await apiClient.get<{ count: number; results: DriverSummary[] }>(
    '/drivers/',
    { params: { is_active: true, page_size: 100 } }
  )
  return data.results
}
