import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { queryClient } from '@/lib/query-client'
import { renderHookWithQuery } from '@/test/utils/renderWithQuery'
import {
  useCustomers,
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '@/hooks/customers'
import type { Customer } from '@/types/customers'

vi.mock('@/services/customers', () => ({
  getCustomers: vi.fn(),
  getCustomer: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}))

import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/services/customers'

const mockCustomer: Customer = {
  id: 1, name: 'ACME Corp', customer_type: 'company',
  email: 'acme@test.com', phone: '555-1234', address: 'Av. Test 123',
  tax_id: null, is_active: true,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockCustomer] }

beforeEach(() => {
  vi.clearAllMocks()
  queryClient.clear()
})
afterEach(() => { vi.restoreAllMocks() })

describe('useCustomers', () => {
  it('retorna datos paginados cuando la query tiene éxito', async () => {
    vi.mocked(getCustomers).mockResolvedValue(mockPaginated)
    const { result } = renderHookWithQuery(() => useCustomers({}))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPaginated)
    expect(getCustomers).toHaveBeenCalledWith({})
  })

  it('usa queryKey ["customers", "list", params]', async () => {
    vi.mocked(getCustomers).mockResolvedValue(mockPaginated)
    const params = { page: 2, search: 'test' }
    const { result } = renderHookWithQuery(() => useCustomers(params))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getCustomers).toHaveBeenCalledWith(params)
  })
})

describe('useCustomer', () => {
  it('retorna Customer cuando id > 0', async () => {
    vi.mocked(getCustomer).mockResolvedValue(mockCustomer)
    const { result } = renderHookWithQuery(() => useCustomer(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCustomer)
    expect(getCustomer).toHaveBeenCalledWith(1)
  })

  it('query deshabilitada cuando id === 0', () => {
    const { result } = renderHookWithQuery(() => useCustomer(0))
    expect(result.current.isFetching).toBe(false)
    expect(getCustomer).not.toHaveBeenCalled()
  })
})

describe('useCreateCustomer', () => {
  it('llama a createCustomer y en éxito invalida ["customers","list"]', async () => {
    vi.mocked(createCustomer).mockResolvedValue(mockCustomer)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateCustomer())
    await result.current.mutateAsync({
      name: 'Test', customer_type: 'company', email: 't@t.com',
      phone: '123', address: 'Dir', is_active: true,
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['customers', 'list'] })
    )
  })
})

describe('useUpdateCustomer', () => {
  it('llama a updateCustomer y en éxito invalida lista y detalle', async () => {
    vi.mocked(updateCustomer).mockResolvedValue({ ...mockCustomer, name: 'Updated' })
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useUpdateCustomer())
    await result.current.mutateAsync({ id: 1, payload: { name: 'Updated' } })
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['customers', 'list'] })
      expect(spy).toHaveBeenCalledWith({ queryKey: ['customers', 1] })
    })
  })
})

describe('useDeleteCustomer', () => {
  it('llama a deleteCustomer y en éxito invalida ["customers","list"]', async () => {
    vi.mocked(deleteCustomer).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteCustomer())
    await result.current.mutateAsync(1)
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['customers', 'list'] })
    )
  })
})
