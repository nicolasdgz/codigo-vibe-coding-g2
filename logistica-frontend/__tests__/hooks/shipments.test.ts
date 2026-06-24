import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { queryClient } from '@/lib/query-client'
import { renderHookWithQuery } from '@/test/utils/renderWithQuery'
import {
  useShipmentList,
  useShipment,
  useCreateShipment,
  useUpdateShipment,
  useDeleteShipment,
  useCreateShipmentItem,
  useDeleteShipmentItem,
  useCustomerOptions,
} from '@/hooks/shipments'
import type { Shipment } from '@/types/shipments'

vi.mock('@/services/shipments', () => ({
  getShipmentList: vi.fn(),
  getShipment: vi.fn(),
  createShipment: vi.fn(),
  updateShipment: vi.fn(),
  deleteShipment: vi.fn(),
  createShipmentItem: vi.fn(),
  patchShipmentItem: vi.fn(),
  deleteShipmentItem: vi.fn(),
  getCustomerOptions: vi.fn(),
  getWarehouseOptions: vi.fn(),
  getRouteOptions: vi.fn(),
  getProductOptions: vi.fn(),
}))

import {
  getShipmentList,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  createShipmentItem,
  deleteShipmentItem,
  getCustomerOptions,
} from '@/services/shipments'

const mockShipment: Shipment = {
  id: 1, tracking_number: 'TRK-0001234567',
  customer: { id: 1, name: 'Cliente Test', email: 'cli@test.com', customer_type: 'company' },
  origin_warehouse: { id: 1, name: 'Almacén Central', city: 'Bogotá' },
  destination_address: 'Av. Corrientes 1234', destination_city: 'Buenos Aires',
  destination_country: 'Argentina', status: 'pending',
  route: { id: 1, name: 'Ruta Test', status: 'planned' },
  estimated_delivery: '2025-12-31', actual_delivery: null,
  total_weight_kg: '10.00', calculated_cost: '50000.00', notes: null,
  created_by: { id: 1, username: 'admin', email: 'admin@test.com' },
  items: [], created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockShipment] }
const mockItem = {
  id: 1, product: { id: 1, name: 'Producto A', sku: 'SKU-001', weight_kg: '2.50' },
  quantity: 5, unit_price: '99.99', subtotal: '499.95',
}

beforeEach(() => { vi.clearAllMocks(); queryClient.clear() })
afterEach(() => { vi.restoreAllMocks() })

describe('useShipmentList', () => {
  it('retorna datos paginados cuando la query tiene éxito', async () => {
    vi.mocked(getShipmentList).mockResolvedValue(mockPaginated)
    const { result } = renderHookWithQuery(() => useShipmentList({}))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPaginated)
  })
})

describe('useShipment', () => {
  it('retorna Shipment cuando id > 0', async () => {
    vi.mocked(getShipment).mockResolvedValue(mockShipment)
    const { result } = renderHookWithQuery(() => useShipment(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockShipment)
  })

  it('query deshabilitada cuando id === 0', () => {
    const { result } = renderHookWithQuery(() => useShipment(0))
    expect(result.current.isFetching).toBe(false)
    expect(getShipment).not.toHaveBeenCalled()
  })
})

describe('useCreateShipment', () => {
  it('llama a createShipment y en éxito invalida ["shipments","list"]', async () => {
    vi.mocked(createShipment).mockResolvedValue(mockShipment)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateShipment())
    await result.current.mutateAsync({
      customer: 1, origin_warehouse: 1,
      destination_address: 'Dir', destination_city: 'BA',
      destination_country: 'AR', status: 'pending',
      route: null, estimated_delivery: null, calculated_cost: '50000', notes: null,
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 'list'] })
    )
  })
})

describe('useUpdateShipment', () => {
  it('en éxito invalida lista y detalle', async () => {
    vi.mocked(updateShipment).mockResolvedValue({ ...mockShipment, status: 'in_transit' })
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useUpdateShipment())
    await result.current.mutateAsync({ id: 1, payload: { status: 'in_transit' } })
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 'list'] })
      expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 1] })
    })
  })
})

describe('useDeleteShipment', () => {
  it('en éxito invalida ["shipments","list"]', async () => {
    vi.mocked(deleteShipment).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteShipment())
    await result.current.mutateAsync(1)
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 'list'] })
    )
  })
})

describe('useCreateShipmentItem', () => {
  it('en éxito invalida ["shipments", shipmentId]', async () => {
    vi.mocked(createShipmentItem).mockResolvedValue(mockItem)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateShipmentItem())
    await result.current.mutateAsync({ shipmentId: 1, payload: { product: 1, quantity: 5 } })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 1] })
    )
  })
})

describe('useDeleteShipmentItem', () => {
  it('en éxito invalida ["shipments", shipmentId]', async () => {
    vi.mocked(deleteShipmentItem).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteShipmentItem())
    await result.current.mutateAsync({ shipmentId: 1, itemId: 1 })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['shipments', 1] })
    )
  })
})

describe('useCustomerOptions', () => {
  it('retorna opciones de clientes', async () => {
    const mockOptions = [{ id: 1, name: 'Cliente A', email: '', customer_type: 'company' }]
    vi.mocked(getCustomerOptions).mockResolvedValue(mockOptions)
    const { result } = renderHookWithQuery(() => useCustomerOptions())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockOptions)
  })
})
