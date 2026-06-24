import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/services/customers'
import type { Customer } from '@/types/customers'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockCustomer: Customer = {
  id: 1,
  name: 'ACME Corp',
  customer_type: 'company',
  email: 'acme@test.com',
  phone: '555-1234',
  address: 'Av. Test 123',
  tax_id: 'ACME-123',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockCustomer] }

beforeEach(() => { vi.clearAllMocks() })

describe('getCustomers', () => {
  it('llama a GET /customers/ con params y retorna paginado', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPaginated })
    const result = await getCustomers({ page: 1, search: 'test' })
    expect(apiClient.get).toHaveBeenCalledWith('/customers/', { params: { page: 1, search: 'test' } })
    expect(result).toEqual(mockPaginated)
  })
})

describe('getCustomer', () => {
  it('llama a GET /customers/1/ y retorna Customer', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockCustomer })
    const result = await getCustomer(1)
    expect(apiClient.get).toHaveBeenCalledWith('/customers/1/')
    expect(result).toEqual(mockCustomer)
  })
})

describe('createCustomer', () => {
  it('llama a POST /customers/ con payload y retorna Customer creado', async () => {
    const payload = {
      name: 'Nuevo', customer_type: 'person' as const,
      email: 'n@test.com', phone: '123', address: 'Calle 1', is_active: true,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockCustomer })
    const result = await createCustomer(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/customers/', payload)
    expect(result).toEqual(mockCustomer)
  })
})

describe('updateCustomer', () => {
  it('llama a PATCH /customers/1/ con patch y retorna Customer actualizado', async () => {
    const patch = { name: 'Actualizado' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockCustomer, name: 'Actualizado' } })
    const result = await updateCustomer(1, patch)
    expect(apiClient.patch).toHaveBeenCalledWith('/customers/1/', patch)
    expect(result.name).toBe('Actualizado')
  })
})

describe('deleteCustomer', () => {
  it('llama a DELETE /customers/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteCustomer(1)
    expect(apiClient.delete).toHaveBeenCalledWith('/customers/1/')
  })
})

describe('propagación de errores', () => {
  it('rechaza la promesa si el server falla', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network Error'))
    await expect(getCustomer(999)).rejects.toThrow('Network Error')
  })
})
