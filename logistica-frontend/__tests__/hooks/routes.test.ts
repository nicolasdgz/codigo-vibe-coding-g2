import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { queryClient } from '@/lib/query-client'
import { renderHookWithQuery } from '@/test/utils/renderWithQuery'
import {
  useRouteList,
  useRoute,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
  useCreateRouteStop,
  useDeleteRouteStop,
} from '@/hooks/routes'
import type { Route } from '@/types/routes'

vi.mock('@/services/routes', () => ({
  getRouteList: vi.fn(),
  getRoute: vi.fn(),
  createRoute: vi.fn(),
  updateRoute: vi.fn(),
  deleteRoute: vi.fn(),
  createRouteStop: vi.fn(),
  patchRouteStop: vi.fn(),
  deleteRouteStop: vi.fn(),
  getTransportOptions: vi.fn(),
  getWarehouseOptions: vi.fn(),
}))

import {
  getRouteList,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  createRouteStop,
  deleteRouteStop,
} from '@/services/routes'

const mockRoute: Route = {
  id: 1, name: 'Ruta Bogotá-Medellín',
  origin_warehouse: { id: 1, name: 'Almacén Central', city: 'Bogotá' },
  transport: { id: 1, plate_number: 'ABC-123', vehicle_type: 'truck', brand: 'Mercedes' },
  status: 'planned', scheduled_date: '2025-12-01', stops: [],
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockRoute] }
const mockStop = { id: 1, order: 1, address: 'Calle 1', city: 'Medellín', estimated_arrival: null, actual_arrival: null }

beforeEach(() => { vi.clearAllMocks(); queryClient.clear() })
afterEach(() => { vi.restoreAllMocks() })

describe('useRouteList', () => {
  it('retorna datos paginados cuando la query tiene éxito', async () => {
    vi.mocked(getRouteList).mockResolvedValue(mockPaginated)
    const { result } = renderHookWithQuery(() => useRouteList({}))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPaginated)
  })
})

describe('useRoute', () => {
  it('retorna Route cuando id > 0', async () => {
    vi.mocked(getRoute).mockResolvedValue(mockRoute)
    const { result } = renderHookWithQuery(() => useRoute(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockRoute)
  })

  it('query deshabilitada cuando id === 0', () => {
    const { result } = renderHookWithQuery(() => useRoute(0))
    expect(result.current.isFetching).toBe(false)
    expect(getRoute).not.toHaveBeenCalled()
  })
})

describe('useCreateRoute', () => {
  it('llama a createRoute y en éxito invalida ["routes","list"]', async () => {
    vi.mocked(createRoute).mockResolvedValue(mockRoute)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateRoute())
    await result.current.mutateAsync({
      name: 'Nueva', origin_warehouse: 1,
      transport: null, status: 'planned', scheduled_date: '2025-12-15',
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['routes', 'list'] })
    )
  })
})

describe('useUpdateRoute', () => {
  it('en éxito invalida lista y detalle', async () => {
    vi.mocked(updateRoute).mockResolvedValue({ ...mockRoute, status: 'in_progress' })
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useUpdateRoute())
    await result.current.mutateAsync({ id: 1, payload: { status: 'in_progress' } })
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['routes', 'list'] })
      expect(spy).toHaveBeenCalledWith({ queryKey: ['routes', 1] })
    })
  })
})

describe('useDeleteRoute', () => {
  it('en éxito invalida ["routes","list"]', async () => {
    vi.mocked(deleteRoute).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteRoute())
    await result.current.mutateAsync(1)
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['routes', 'list'] })
    )
  })
})

describe('useCreateRouteStop', () => {
  it('en éxito invalida ["routes", routeId]', async () => {
    vi.mocked(createRouteStop).mockResolvedValue(mockStop)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateRouteStop())
    await result.current.mutateAsync({
      routeId: 1,
      payload: { order: 1, address: 'Calle 1', city: 'Medellín' },
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['routes', 1] })
    )
  })
})

describe('useDeleteRouteStop', () => {
  it('en éxito invalida ["routes", routeId]', async () => {
    vi.mocked(deleteRouteStop).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteRouteStop())
    await result.current.mutateAsync({ routeId: 1, stopId: 2 })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['routes', 1] })
    )
  })
})
