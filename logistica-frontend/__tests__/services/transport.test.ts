import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import {
  getTransportList,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport,
  getDriverOptions,
} from '@/services/transport'
import type { Transport } from '@/types/transport'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockTransport: Transport = {
  id: 1,
  plate_number: 'ABC-123',
  vehicle_type: 'truck',
  brand: 'Mercedes',
  model: 'Sprinter',
  year: 2022,
  capacity_kg: '8000.00',
  capacity_units: 100,
  driver: { id: 1, license_number: 'LIC-001', name: 'Carlos García', is_available: true },
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockTransport] }

beforeEach(() => { vi.clearAllMocks() })

describe('getTransportList', () => {
  it('llama a GET /transport/ con params y retorna paginado', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPaginated })
    const result = await getTransportList({ vehicle_type: 'truck', is_active: true })
    expect(apiClient.get).toHaveBeenCalledWith('/transport/', { params: { vehicle_type: 'truck', is_active: true } })
    expect(result).toEqual(mockPaginated)
  })
})

describe('getTransport', () => {
  it('llama a GET /transport/1/ y retorna Transport', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTransport })
    const result = await getTransport(1)
    expect(apiClient.get).toHaveBeenCalledWith('/transport/1/')
    expect(result).toEqual(mockTransport)
  })
})

describe('createTransport', () => {
  it('llama a POST /transport/ con payload y retorna Transport creado', async () => {
    const payload = {
      plate_number: 'XYZ-999', vehicle_type: 'van' as const,
      brand: 'Ford', model: 'Transit', year: 2023,
      capacity_kg: '2000.00', capacity_units: 50, driver: null, is_active: true,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockTransport })
    const result = await createTransport(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/transport/', payload)
    expect(result).toEqual(mockTransport)
  })
})

describe('updateTransport', () => {
  it('llama a PATCH /transport/1/ con patch y retorna Transport actualizado', async () => {
    const patch = { capacity_kg: '9000.00' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockTransport, capacity_kg: '9000.00' } })
    const result = await updateTransport(1, patch)
    expect(apiClient.patch).toHaveBeenCalledWith('/transport/1/', patch)
    expect(result.capacity_kg).toBe('9000.00')
  })
})

describe('deleteTransport', () => {
  it('llama a DELETE /transport/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteTransport(1)
    expect(apiClient.delete).toHaveBeenCalledWith('/transport/1/')
  })
})

describe('getDriverOptions', () => {
  it('llama a GET /drivers/ con is_active y page_size, retorna results[]', async () => {
    const mockResults = [{ id: 1, license_number: 'LIC-001', name: 'Carlos', is_available: true }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { count: 1, results: mockResults } })
    const result = await getDriverOptions()
    expect(apiClient.get).toHaveBeenCalledWith('/drivers/', { params: { is_active: true, page_size: 100 } })
    expect(result).toEqual(mockResults)
  })
})

describe('propagación de errores', () => {
  it('rechaza la promesa si el server falla', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('503'))
    await expect(getTransport(1)).rejects.toThrow('503')
  })
})
