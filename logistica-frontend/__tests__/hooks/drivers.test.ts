import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { queryClient } from '@/lib/query-client'
import { renderHookWithQuery } from '@/test/utils/renderWithQuery'
import {
  useDrivers,
  useDriver,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
} from '@/hooks/drivers'
import type { Driver } from '@/types/drivers'

vi.mock('@/services/drivers', () => ({
  getDrivers: vi.fn(),
  getDriver: vi.fn(),
  createDriver: vi.fn(),
  updateDriver: vi.fn(),
  deleteDriver: vi.fn(),
}))

import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
} from '@/services/drivers'

const mockDriver: Driver = {
  id: 1,
  user: { id: 10, username: 'driver1', email: 'd@test.com', first_name: 'Carlos', last_name: 'García' },
  license_number: 'LIC-001', license_expiry: '2026-12-31',
  phone: '555-2222', is_available: true,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockDriver] }

beforeEach(() => { vi.clearAllMocks(); queryClient.clear() })
afterEach(() => { vi.restoreAllMocks() })

describe('useDrivers', () => {
  it('retorna datos paginados cuando la query tiene éxito', async () => {
    vi.mocked(getDrivers).mockResolvedValue(mockPaginated)
    const { result } = renderHookWithQuery(() => useDrivers({}))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPaginated)
  })
})

describe('useDriver', () => {
  it('retorna Driver cuando id > 0', async () => {
    vi.mocked(getDriver).mockResolvedValue(mockDriver)
    const { result } = renderHookWithQuery(() => useDriver(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockDriver)
  })

  it('query deshabilitada cuando id === 0', () => {
    const { result } = renderHookWithQuery(() => useDriver(0))
    expect(result.current.isFetching).toBe(false)
    expect(getDriver).not.toHaveBeenCalled()
  })
})

describe('useCreateDriver', () => {
  it('llama a createDriver y en éxito invalida ["drivers","list"]', async () => {
    vi.mocked(createDriver).mockResolvedValue(mockDriver)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateDriver())
    await result.current.mutateAsync({
      user: 10, license_number: 'LIC-002',
      license_expiry: '2027-01-01', phone: '555-3333', is_available: true,
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers', 'list'] })
    )
  })
})

describe('useUpdateDriver', () => {
  it('en éxito invalida lista y detalle', async () => {
    vi.mocked(updateDriver).mockResolvedValue({ ...mockDriver, phone: '999-0000' })
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useUpdateDriver())
    await result.current.mutateAsync({ id: 1, payload: { phone: '999-0000' } })
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers', 'list'] })
      expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers', 1] })
    })
  })
})

describe('useDeleteDriver', () => {
  it('en éxito invalida ["drivers","list"]', async () => {
    vi.mocked(deleteDriver).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteDriver())
    await result.current.mutateAsync(1)
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['drivers', 'list'] })
    )
  })
})
