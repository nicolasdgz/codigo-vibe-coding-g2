import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import {
  getShipmentList,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  getShipmentItems,
  createShipmentItem,
  patchShipmentItem,
  deleteShipmentItem,
  getCustomerOptions,
  getWarehouseOptions,
  getRouteOptions,
  getProductOptions,
} from '@/services/shipments'
import type { Shipment, ShipmentItem } from '@/types/shipments'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockShipment: Shipment = {
  id: 1,
  tracking_number: 'TRK-0001234567',
  customer: { id: 1, name: 'Cliente Test', email: 'cli@test.com', customer_type: 'company' },
  origin_warehouse: { id: 1, name: 'Almacén Central', city: 'Bogotá' },
  destination_address: 'Av. Corrientes 1234',
  destination_city: 'Buenos Aires',
  destination_country: 'Argentina',
  status: 'pending',
  route: { id: 1, name: 'Ruta Test', status: 'planned' },
  estimated_delivery: '2025-12-31',
  actual_delivery: null,
  total_weight_kg: '10.00',
  calculated_cost: '50000.00',
  notes: null,
  created_by: { id: 1, username: 'admin', email: 'admin@test.com' },
  items: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
const mockItem: ShipmentItem = {
  id: 1,
  product: { id: 1, name: 'Producto A', sku: 'SKU-001', weight_kg: '2.50' },
  quantity: 5,
  unit_price: '99.99',
  subtotal: '499.95',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockShipment] }

beforeEach(() => { vi.clearAllMocks() })

describe('getShipmentList', () => {
  it('llama a GET /shipments/ con params y retorna paginado', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPaginated })
    const result = await getShipmentList({ status: 'pending', page: 1 })
    expect(apiClient.get).toHaveBeenCalledWith('/shipments/', { params: { status: 'pending', page: 1 } })
    expect(result).toEqual(mockPaginated)
  })
})

describe('getShipment', () => {
  it('llama a GET /shipments/1/ y retorna Shipment', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockShipment })
    const result = await getShipment(1)
    expect(apiClient.get).toHaveBeenCalledWith('/shipments/1/')
    expect(result).toEqual(mockShipment)
  })
})

describe('createShipment', () => {
  it('llama a POST /shipments/ con payload y retorna Shipment creado', async () => {
    const payload = {
      customer: 1, origin_warehouse: 1,
      destination_address: 'Dir', destination_city: 'Buenos Aires',
      destination_country: 'Argentina', status: 'pending' as const,
      route: null, estimated_delivery: null, calculated_cost: '50000.00', notes: null,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockShipment })
    const result = await createShipment(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/shipments/', payload)
    expect(result).toEqual(mockShipment)
  })
})

describe('updateShipment', () => {
  it('llama a PATCH /shipments/1/ con patch y retorna Shipment actualizado', async () => {
    const patch = { status: 'in_transit' as const }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockShipment, status: 'in_transit' } })
    const result = await updateShipment(1, patch)
    expect(apiClient.patch).toHaveBeenCalledWith('/shipments/1/', patch)
    expect(result.status).toBe('in_transit')
  })
})

describe('deleteShipment', () => {
  it('llama a DELETE /shipments/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteShipment(1)
    expect(apiClient.delete).toHaveBeenCalledWith('/shipments/1/')
  })
})

describe('getShipmentItems', () => {
  it('llama a GET /shipments/1/items/ y retorna array de items', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [mockItem] })
    const result = await getShipmentItems(1)
    expect(apiClient.get).toHaveBeenCalledWith('/shipments/1/items/')
    expect(result).toEqual([mockItem])
  })
})

describe('createShipmentItem', () => {
  it('llama a POST /shipments/1/items/ con payload y retorna ShipmentItem', async () => {
    const payload = { product: 1, quantity: 5 }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockItem })
    const result = await createShipmentItem(1, payload)
    expect(apiClient.post).toHaveBeenCalledWith('/shipments/1/items/', payload)
    expect(result).toEqual(mockItem)
  })
})

describe('patchShipmentItem', () => {
  it('llama a PATCH /shipments/1/items/1/ con payload y retorna ShipmentItem', async () => {
    const payload = { quantity: 10 }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockItem, quantity: 10 } })
    const result = await patchShipmentItem(1, 1, payload)
    expect(apiClient.patch).toHaveBeenCalledWith('/shipments/1/items/1/', payload)
    expect(result.quantity).toBe(10)
  })
})

describe('deleteShipmentItem', () => {
  it('llama a DELETE /shipments/1/items/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteShipmentItem(1, 1)
    expect(apiClient.delete).toHaveBeenCalledWith('/shipments/1/items/1/')
  })
})

describe('getCustomerOptions', () => {
  it('llama a GET /customers/ con is_active y page_size, retorna results[]', async () => {
    const mockResults = [{ id: 1, name: 'Cliente A', email: '', customer_type: 'company' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { count: 1, results: mockResults } })
    const result = await getCustomerOptions()
    expect(apiClient.get).toHaveBeenCalledWith('/customers/', { params: { is_active: true, page_size: 100 } })
    expect(result).toEqual(mockResults)
  })
})

describe('getRouteOptions', () => {
  it('llama a GET /routes/ con is_active y page_size, retorna results[]', async () => {
    const mockResults = [{ id: 1, name: 'Ruta A', status: 'planned' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { count: 1, results: mockResults } })
    const result = await getRouteOptions()
    expect(apiClient.get).toHaveBeenCalledWith('/routes/', { params: { is_active: true, page_size: 100 } })
    expect(result).toEqual(mockResults)
  })
})

describe('getProductOptions', () => {
  it('llama a GET /products/ con is_active y page_size, retorna results[]', async () => {
    const mockResults = [{ id: 1, name: 'Producto A', sku: 'SKU-001', weight_kg: '1.00' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { count: 1, results: mockResults } })
    const result = await getProductOptions()
    expect(apiClient.get).toHaveBeenCalledWith('/products/', { params: { is_active: true, page_size: 100 } })
    expect(result).toEqual(mockResults)
  })
})

describe('propagación de errores', () => {
  it('rechaza la promesa si el server falla', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('401'))
    await expect(getShipment(1)).rejects.toThrow('401')
  })
})
