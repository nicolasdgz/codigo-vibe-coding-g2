import { apiClient } from '@/lib/axios'
import type {
  Route,
  RouteWritePayload,
  PaginatedRoutes,
  RouteListParams,
  RouteStop,
  RouteStopWritePayload,
  RouteStopPatchPayload,
  TransportSummary,
  WarehouseSummary,
} from '@/types/routes'

export async function getRouteList(params: RouteListParams): Promise<PaginatedRoutes> {
  const { data } = await apiClient.get<PaginatedRoutes>('/routes/', { params })
  return data
}

export async function getRoute(id: number): Promise<Route> {
  const { data } = await apiClient.get<Route>(`/routes/${id}/`)
  return data
}

export async function createRoute(payload: RouteWritePayload): Promise<Route> {
  const { data } = await apiClient.post<Route>('/routes/', payload)
  return data
}

export async function updateRoute(
  id: number,
  payload: Partial<RouteWritePayload>
): Promise<Route> {
  const { data } = await apiClient.patch<Route>(`/routes/${id}/`, payload)
  return data
}

export async function deleteRoute(id: number): Promise<void> {
  await apiClient.delete(`/routes/${id}/`)
}

export async function getRouteStops(routeId: number): Promise<RouteStop[]> {
  const { data } = await apiClient.get<RouteStop[]>(`/routes/${routeId}/stops/`)
  return data
}

export async function createRouteStop(
  routeId: number,
  payload: RouteStopWritePayload
): Promise<RouteStop> {
  const { data } = await apiClient.post<RouteStop>(`/routes/${routeId}/stops/`, payload)
  return data
}

export async function patchRouteStop(
  routeId: number,
  stopId: number,
  payload: RouteStopPatchPayload
): Promise<RouteStop> {
  const { data } = await apiClient.patch<RouteStop>(
    `/routes/${routeId}/stops/${stopId}/`,
    payload
  )
  return data
}

export async function deleteRouteStop(routeId: number, stopId: number): Promise<void> {
  await apiClient.delete(`/routes/${routeId}/stops/${stopId}/`)
}

export async function getTransportOptions(): Promise<TransportSummary[]> {
  const { data } = await apiClient.get<{ count: number; results: TransportSummary[] }>(
    '/transport/',
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
