import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { queryClient } from '@/lib/query-client'
import { renderHookWithQuery } from '@/test/utils/renderWithQuery'
import {
  useTransportList,
  useTransport,
  useCreateTransport,
  useUpdateTransport,
  useDeleteTransport,
  useDriverOptions,
} from '@/hooks/transport'
import type { Transport } from '@/types/transport'

vi.mock('@/services/transport', () => ({
  getTransportList: vi.fn(),
  getTransport: vi.fn(),
  createTransport: vi.fn(),
  updateTransport: vi.fn(),
  deleteTransport: vi.fn(),
  getDriverOptions: vi.fn(),
}))

import {
  getTransportList,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport,
  getDriverOptions,
} from '@/services/transport'

const mockTransport: Transport = {
  id: 1, plate_number: 'ABC-123', vehicle_type: 'truck',
  brand: 'Mercedes', model: 'Sprinter', year: 2022,
  capacity_kg: '8000.00', capacity_units: 100,
  driver: { id: 1, license_number: 'LIC-001', name: 'Carlos García', is_available: true },
  is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockTransport] }

beforeEach(() => { vi.clearAllMocks(); queryClient.clear() })
afterEach(() => { vi.restoreAllMocks() })

describe('useTransportList', () => {
  it('retorna datos paginados cuando la query tiene éxito', async () => {
    vi.mocked(getTransportList).mockResolvedValue(mockPaginated)
    const { result } = renderHookWithQuery(() => useTransportList({}))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPaginated)
  })
})

describe('useTransport', () => {
  it('retorna Transport cuando id > 0', async () => {
    vi.mocked(getTransport).mockResolvedValue(mockTransport)
    const { result } = renderHookWithQuery(() => useTransport(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTransport)
  })

  it('query deshabilitada cuando id === 0', () => {
    const { result } = renderHookWithQuery(() => useTransport(0))
    expect(result.current.isFetching).toBe(false)
    expect(getTransport).not.toHaveBeenCalled()
  })
})

describe('useCreateTransport', () => {
  it('llama a createTransport y en éxito invalida ["transport","list"]', async () => {
    vi.mocked(createTransport).mockResolvedValue(mockTransport)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateTransport())
    await result.current.mutateAsync({
      plate_number: 'XYZ-999', vehicle_type: 'van', brand: 'Ford',
      model: 'Transit', year: 2023, capacity_kg: '2000.00',
      capacity_units: 50, driver: null, is_active: true,
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['transport', 'list'] })
    )
  })
})

describe('useUpdateTransport', () => {
  it('en éxito invalida lista y detalle', async () => {
    vi.mocked(updateTransport).mockResolvedValue({ ...mockTransport, capacity_kg: '9000.00' })
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useUpdateTransport())
    await result.current.mutateAsync({ id: 1, payload: { capacity_kg: '9000.00' } })
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['transport', 'list'] })
      expect(spy).toHaveBeenCalledWith({ queryKey: ['transport', 1] })
    })
  })
})

describe('useDeleteTransport', () => {
  it('en éxito invalida ["transport","list"]', async () => {
    vi.mocked(deleteTransport).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteTransport())
    await result.current.mutateAsync(1)
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['transport', 'list'] })
    )
  })
})

describe('useDriverOptions', () => {
  it('retorna opciones de conductores con queryKey ["drivers","options"]', async () => {
    const mockOptions = [{ id: 1, license_number: 'LIC-001', name: 'Carlos', is_available: true }]
    vi.mocked(getDriverOptions).mockResolvedValue(mockOptions)
    const { result } = renderHookWithQuery(() => useDriverOptions())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockOptions)
  })
})
