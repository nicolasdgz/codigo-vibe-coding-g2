import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '@/services/warehouses'
import type { Warehouse } from '@/types/warehouses'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockWarehouse: Warehouse = {
  id: 1,
  name: 'Almacén Central',
  address: 'Calle 1 #100',
  city: 'Bogotá',
  country: 'Colombia',
  latitude: '4.729886',
  longitude: '-74.046543',
  capacity: 5000,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockWarehouse] }

beforeEach(() => { vi.clearAllMocks() })

describe('getWarehouses', () => {
  it('llama a GET /warehouses/ con params y retorna paginado', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPaginated })
    const result = await getWarehouses({ city: 'Bogotá', is_active: true })
    expect(apiClient.get).toHaveBeenCalledWith('/warehouses/', { params: { city: 'Bogotá', is_active: true } })
    expect(result).toEqual(mockPaginated)
  })
})

describe('getWarehouse', () => {
  it('llama a GET /warehouses/1/ y retorna Warehouse', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockWarehouse })
    const result = await getWarehouse(1)
    expect(apiClient.get).toHaveBeenCalledWith('/warehouses/1/')
    expect(result).toEqual(mockWarehouse)
  })
})

describe('createWarehouse', () => {
  it('llama a POST /warehouses/ con payload y retorna Warehouse creado', async () => {
    const payload = {
      name: 'Nuevo', address: 'Dir', city: 'Medellín',
      country: 'Colombia', capacity: 1000, is_active: true,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockWarehouse })
    const result = await createWarehouse(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/warehouses/', payload)
    expect(result).toEqual(mockWarehouse)
  })
})

describe('updateWarehouse', () => {
  it('llama a PATCH /warehouses/1/ con patch y retorna Warehouse actualizado', async () => {
    const patch = { capacity: 9999 }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockWarehouse, capacity: 9999 } })
    const result = await updateWarehouse(1, patch)
    expect(apiClient.patch).toHaveBeenCalledWith('/warehouses/1/', patch)
    expect(result.capacity).toBe(9999)
  })
})

describe('deleteWarehouse', () => {
  it('llama a DELETE /warehouses/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteWarehouse(1)
    expect(apiClient.delete).toHaveBeenCalledWith('/warehouses/1/')
  })
})

describe('propagación de errores', () => {
  it('rechaza la promesa si el server falla', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('500'))
    await expect(getWarehouse(99)).rejects.toThrow('500')
  })
})
