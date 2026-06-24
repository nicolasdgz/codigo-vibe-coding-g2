import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { queryClient } from '@/lib/query-client'
import { renderHookWithQuery } from '@/test/utils/renderWithQuery'
import {
  useWarehouses,
  useWarehouse,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from '@/hooks/warehouses'
import type { Warehouse } from '@/types/warehouses'

vi.mock('@/services/warehouses', () => ({
  getWarehouses: vi.fn(),
  getWarehouse: vi.fn(),
  createWarehouse: vi.fn(),
  updateWarehouse: vi.fn(),
  deleteWarehouse: vi.fn(),
}))

import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '@/services/warehouses'

const mockWarehouse: Warehouse = {
  id: 1, name: 'Almacén Central', address: 'Calle 1 #100',
  city: 'Bogotá', country: 'Colombia', latitude: '4.73', longitude: '-74.05',
  capacity: 5000, is_active: true,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockWarehouse] }

beforeEach(() => { vi.clearAllMocks(); queryClient.clear() })
afterEach(() => { vi.restoreAllMocks() })

describe('useWarehouses', () => {
  it('retorna datos paginados cuando la query tiene éxito', async () => {
    vi.mocked(getWarehouses).mockResolvedValue(mockPaginated)
    const { result } = renderHookWithQuery(() => useWarehouses({}))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPaginated)
  })
})

describe('useWarehouse', () => {
  it('retorna Warehouse cuando id > 0', async () => {
    vi.mocked(getWarehouse).mockResolvedValue(mockWarehouse)
    const { result } = renderHookWithQuery(() => useWarehouse(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockWarehouse)
  })

  it('query deshabilitada cuando id === 0', () => {
    const { result } = renderHookWithQuery(() => useWarehouse(0))
    expect(result.current.isFetching).toBe(false)
    expect(getWarehouse).not.toHaveBeenCalled()
  })
})

describe('useCreateWarehouse', () => {
  it('llama a createWarehouse y en éxito invalida ["warehouses","list"]', async () => {
    vi.mocked(createWarehouse).mockResolvedValue(mockWarehouse)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateWarehouse())
    await result.current.mutateAsync({
      name: 'Test', address: 'Dir', city: 'Medellín',
      country: 'Colombia', capacity: 1000, is_active: true,
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses', 'list'] })
    )
  })
})

describe('useUpdateWarehouse', () => {
  it('en éxito invalida lista y detalle', async () => {
    vi.mocked(updateWarehouse).mockResolvedValue({ ...mockWarehouse, capacity: 9999 })
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useUpdateWarehouse())
    await result.current.mutateAsync({ id: 1, payload: { capacity: 9999 } })
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses', 'list'] })
      expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses', 1] })
    })
  })
})

describe('useDeleteWarehouse', () => {
  it('en éxito invalida ["warehouses","list"]', async () => {
    vi.mocked(deleteWarehouse).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteWarehouse())
    await result.current.mutateAsync(1)
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['warehouses', 'list'] })
    )
  })
})
