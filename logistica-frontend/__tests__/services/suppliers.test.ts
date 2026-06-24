import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/services/suppliers'
import type { Supplier } from '@/types/suppliers'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockSupplier: Supplier = {
  id: 1,
  name: 'Proveedor Test',
  email: 'prov@test.com',
  phone: '555-9999',
  address: 'Calle Test 1',
  tax_id: 'TAX-001',
  contact_name: 'Juan Pérez',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockSupplier] }

beforeEach(() => { vi.clearAllMocks() })

describe('getSuppliers', () => {
  it('llama a GET /suppliers/ con params y retorna paginado', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPaginated })
    const result = await getSuppliers({ page: 1, is_active: true })
    expect(apiClient.get).toHaveBeenCalledWith('/suppliers/', { params: { page: 1, is_active: true } })
    expect(result).toEqual(mockPaginated)
  })
})

describe('getSupplier', () => {
  it('llama a GET /suppliers/1/ y retorna Supplier', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockSupplier })
    const result = await getSupplier(1)
    expect(apiClient.get).toHaveBeenCalledWith('/suppliers/1/')
    expect(result).toEqual(mockSupplier)
  })
})

describe('createSupplier', () => {
  it('llama a POST /suppliers/ con payload y retorna Supplier creado', async () => {
    const payload = {
      name: 'Nuevo', email: 'n@test.com', phone: '123',
      address: 'Dir', tax_id: 'TAX-002', contact_name: 'Ana', is_active: true,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockSupplier })
    const result = await createSupplier(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/suppliers/', payload)
    expect(result).toEqual(mockSupplier)
  })
})

describe('updateSupplier', () => {
  it('llama a PATCH /suppliers/1/ con patch y retorna Supplier actualizado', async () => {
    const patch = { contact_name: 'Pedro' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockSupplier, contact_name: 'Pedro' } })
    const result = await updateSupplier(1, patch)
    expect(apiClient.patch).toHaveBeenCalledWith('/suppliers/1/', patch)
    expect(result.contact_name).toBe('Pedro')
  })
})

describe('deleteSupplier', () => {
  it('llama a DELETE /suppliers/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteSupplier(1)
    expect(apiClient.delete).toHaveBeenCalledWith('/suppliers/1/')
  })
})

describe('propagación de errores', () => {
  it('rechaza la promesa si el server falla', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('404'))
    await expect(getSupplier(999)).rejects.toThrow('404')
  })
})
