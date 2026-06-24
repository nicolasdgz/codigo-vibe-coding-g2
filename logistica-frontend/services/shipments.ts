import { apiClient } from '@/lib/axios'
import type {
  Shipment,
  ShipmentWritePayload,
  PaginatedShipments,
  ShipmentListParams,
  ShipmentItem,
  ShipmentItemWritePayload,
  ShipmentItemPatchPayload,
  CustomerSummary,
  WarehouseSummary,
  RouteSummary,
  ProductSummary,
} from '@/types/shipments'

export async function getShipmentList(params: ShipmentListParams): Promise<PaginatedShipments> {
  const { data } = await apiClient.get<PaginatedShipments>('/shipments/', { params })
  return data
}

export async function getShipment(id: number): Promise<Shipment> {
  const { data } = await apiClient.get<Shipment>(`/shipments/${id}/`)
  return data
}

export async function createShipment(payload: ShipmentWritePayload): Promise<Shipment> {
  const { data } = await apiClient.post<Shipment>('/shipments/', payload)
  return data
}

export async function updateShipment(
  id: number,
  payload: Partial<ShipmentWritePayload>
): Promise<Shipment> {
  const { data } = await apiClient.patch<Shipment>(`/shipments/${id}/`, payload)
  return data
}

export async function deleteShipment(id: number): Promise<void> {
  await apiClient.delete(`/shipments/${id}/`)
}

export async function getShipmentItems(shipmentId: number): Promise<ShipmentItem[]> {
  const { data } = await apiClient.get<ShipmentItem[]>(`/shipments/${shipmentId}/items/`)
  return data
}

export async function createShipmentItem(
  shipmentId: number,
  payload: ShipmentItemWritePayload
): Promise<ShipmentItem> {
  const { data } = await apiClient.post<ShipmentItem>(
    `/shipments/${shipmentId}/items/`,
    payload
  )
  return data
}

export async function patchShipmentItem(
  shipmentId: number,
  itemId: number,
  payload: ShipmentItemPatchPayload
): Promise<ShipmentItem> {
  const { data } = await apiClient.patch<ShipmentItem>(
    `/shipments/${shipmentId}/items/${itemId}/`,
    payload
  )
  return data
}

export async function deleteShipmentItem(shipmentId: number, itemId: number): Promise<void> {
  await apiClient.delete(`/shipments/${shipmentId}/items/${itemId}/`)
}

export async function getCustomerOptions(): Promise<CustomerSummary[]> {
  const { data } = await apiClient.get<{ count: number; results: CustomerSummary[] }>(
    '/customers/',
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

export async function getRouteOptions(): Promise<RouteSummary[]> {
  const { data } = await apiClient.get<{ count: number; results: RouteSummary[] }>(
    '/routes/',
    { params: { is_active: true, page_size: 100 } }
  )
  return data.results
}

export async function getProductOptions(): Promise<ProductSummary[]> {
  const { data } = await apiClient.get<{ count: number; results: ProductSummary[] }>(
    '/products/',
    { params: { is_active: true, page_size: 100 } }
  )
  return data.results
}
