import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
} from '@/services/drivers'
import type { Driver } from '@/types/drivers'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockDriver: Driver = {
  id: 1,
  user: { id: 10, username: 'driver1', email: 'd@test.com', first_name: 'Carlos', last_name: 'García' },
  license_number: 'LIC-001',
  license_expiry: '2026-12-31',
  phone: '555-2222',
  is_available: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockDriver] }

beforeEach(() => { vi.clearAllMocks() })

describe('getDrivers', () => {
  it('llama a GET /drivers/ con params y retorna paginado', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPaginated })
    const result = await getDrivers({ is_available: true, search: 'Carlos' })
    expect(apiClient.get).toHaveBeenCalledWith('/drivers/', { params: { is_available: true, search: 'Carlos' } })
    expect(result).toEqual(mockPaginated)
  })
})

describe('getDriver', () => {
  it('llama a GET /drivers/1/ y retorna Driver', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDriver })
    const result = await getDriver(1)
    expect(apiClient.get).toHaveBeenCalledWith('/drivers/1/')
    expect(result).toEqual(mockDriver)
  })
})

describe('createDriver', () => {
  it('llama a POST /drivers/ con payload y retorna Driver creado', async () => {
    const payload = {
      user: 10, license_number: 'LIC-002',
      license_expiry: '2027-01-01', phone: '555-3333', is_available: true,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockDriver })
    const result = await createDriver(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/drivers/', payload)
    expect(result).toEqual(mockDriver)
  })
})

describe('updateDriver', () => {
  it('llama a PATCH /drivers/1/ con patch y retorna Driver actualizado', async () => {
    const patch = { phone: '999-0000' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockDriver, phone: '999-0000' } })
    const result = await updateDriver(1, patch)
    expect(apiClient.patch).toHaveBeenCalledWith('/drivers/1/', patch)
    expect(result.phone).toBe('999-0000')
  })
})

describe('deleteDriver', () => {
  it('llama a DELETE /drivers/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteDriver(1)
    expect(apiClient.delete).toHaveBeenCalledWith('/drivers/1/')
  })
})

describe('propagación de errores', () => {
  it('rechaza la promesa si el server falla', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Not Found'))
    await expect(getDriver(999)).rejects.toThrow('Not Found')
  })
})
