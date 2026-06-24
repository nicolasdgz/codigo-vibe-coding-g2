import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { queryClient } from '@/lib/query-client'
import { renderHookWithQuery } from '@/test/utils/renderWithQuery'
import {
  useSuppliers,
  useSupplier,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '@/hooks/suppliers'
import type { Supplier } from '@/types/suppliers'

vi.mock('@/services/suppliers', () => ({
  getSuppliers: vi.fn(),
  getSupplier: vi.fn(),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  deleteSupplier: vi.fn(),
}))

import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/services/suppliers'

const mockSupplier: Supplier = {
  id: 1, name: 'Proveedor Test', email: 'prov@test.com', phone: '555-9999',
  address: 'Calle Test 1', tax_id: 'TAX-001', contact_name: 'Juan Pérez',
  is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockSupplier] }

beforeEach(() => { vi.clearAllMocks(); queryClient.clear() })
afterEach(() => { vi.restoreAllMocks() })

describe('useSuppliers', () => {
  it('retorna datos paginados cuando la query tiene éxito', async () => {
    vi.mocked(getSuppliers).mockResolvedValue(mockPaginated)
    const { result } = renderHookWithQuery(() => useSuppliers({}))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPaginated)
  })
})

describe('useSupplier', () => {
  it('retorna Supplier cuando id > 0', async () => {
    vi.mocked(getSupplier).mockResolvedValue(mockSupplier)
    const { result } = renderHookWithQuery(() => useSupplier(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockSupplier)
  })

  it('query deshabilitada cuando id === 0', () => {
    const { result } = renderHookWithQuery(() => useSupplier(0))
    expect(result.current.isFetching).toBe(false)
    expect(getSupplier).not.toHaveBeenCalled()
  })
})

describe('useCreateSupplier', () => {
  it('llama a createSupplier y en éxito invalida ["suppliers","list"]', async () => {
    vi.mocked(createSupplier).mockResolvedValue(mockSupplier)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateSupplier())
    await result.current.mutateAsync({
      name: 'Test', email: 't@t.com', phone: '123',
      address: 'Dir', tax_id: 'TAX-002', contact_name: 'Ana', is_active: true,
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers', 'list'] })
    )
  })
})

describe('useUpdateSupplier', () => {
  it('en éxito invalida lista y detalle', async () => {
    vi.mocked(updateSupplier).mockResolvedValue({ ...mockSupplier, contact_name: 'Pedro' })
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useUpdateSupplier())
    await result.current.mutateAsync({ id: 1, payload: { contact_name: 'Pedro' } })
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers', 'list'] })
      expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers', 1] })
    })
  })
})

describe('useDeleteSupplier', () => {
  it('en éxito invalida ["suppliers","list"]', async () => {
    vi.mocked(deleteSupplier).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteSupplier())
    await result.current.mutateAsync(1)
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['suppliers', 'list'] })
    )
  })
})
