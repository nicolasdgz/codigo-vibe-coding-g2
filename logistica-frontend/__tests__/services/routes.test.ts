import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import {
  getRouteList,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStops,
  createRouteStop,
  patchRouteStop,
  deleteRouteStop,
  getTransportOptions,
  getWarehouseOptions,
} from '@/services/routes'
import type { Route, RouteStop } from '@/types/routes'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockRoute: Route = {
  id: 1,
  name: 'Ruta Bogotá-Medellín',
  origin_warehouse: { id: 1, name: 'Almacén Central', city: 'Bogotá' },
  transport: { id: 1, plate_number: 'ABC-123', vehicle_type: 'truck', brand: 'Mercedes' },
  status: 'planned',
  scheduled_date: '2025-12-01',
  stops: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
const mockStop: RouteStop = {
  id: 1,
  order: 1,
  address: 'Calle 1',
  city: 'Medellín',
  estimated_arrival: '2025-12-01T10:00:00Z',
  actual_arrival: null,
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockRoute] }

beforeEach(() => { vi.clearAllMocks() })

describe('getRouteList', () => {
  it('llama a GET /routes/ con params y retorna paginado', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPaginated })
    const result = await getRouteList({ status: 'planned', page: 1 })
    expect(apiClient.get).toHaveBeenCalledWith('/routes/', { params: { status: 'planned', page: 1 } })
    expect(result).toEqual(mockPaginated)
  })
})

describe('getRoute', () => {
  it('llama a GET /routes/1/ y retorna Route', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRoute })
    const result = await getRoute(1)
    expect(apiClient.get).toHaveBeenCalledWith('/routes/1/')
    expect(result).toEqual(mockRoute)
  })
})

describe('createRoute', () => {
  it('llama a POST /routes/ con payload y retorna Route creado', async () => {
    const payload = {
      name: 'Nueva Ruta', origin_warehouse: 1,
      transport: null, status: 'planned' as const, scheduled_date: '2025-12-15',
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRoute })
    const result = await createRoute(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/routes/', payload)
    expect(result).toEqual(mockRoute)
  })
})

describe('updateRoute', () => {
  it('llama a PATCH /routes/1/ con patch y retorna Route actualizado', async () => {
    const patch = { status: 'in_progress' as const }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockRoute, status: 'in_progress' } })
    const result = await updateRoute(1, patch)
    expect(apiClient.patch).toHaveBeenCalledWith('/routes/1/', patch)
    expect(result.status).toBe('in_progress')
  })
})

describe('deleteRoute', () => {
  it('llama a DELETE /routes/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteRoute(1)
    expect(apiClient.delete).toHaveBeenCalledWith('/routes/1/')
  })
})

describe('getRouteStops', () => {
  it('llama a GET /routes/1/stops/ y retorna array de paradas', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [mockStop] })
    const result = await getRouteStops(1)
    expect(apiClient.get).toHaveBeenCalledWith('/routes/1/stops/')
    expect(result).toEqual([mockStop])
  })
})

describe('createRouteStop', () => {
  it('llama a POST /routes/1/stops/ con payload y retorna RouteStop', async () => {
    const payload = { order: 2, address: 'Calle 2', city: 'Cali' }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockStop })
    const result = await createRouteStop(1, payload)
    expect(apiClient.post).toHaveBeenCalledWith('/routes/1/stops/', payload)
    expect(result).toEqual(mockStop)
  })
})

describe('patchRouteStop', () => {
  it('llama a PATCH /routes/1/stops/1/ con payload y retorna RouteStop', async () => {
    const payload = { actual_arrival: '2025-12-01T12:00:00Z' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockStop, actual_arrival: '2025-12-01T12:00:00Z' } })
    const result = await patchRouteStop(1, 1, payload)
    expect(apiClient.patch).toHaveBeenCalledWith('/routes/1/stops/1/', payload)
    expect(result.actual_arrival).toBe('2025-12-01T12:00:00Z')
  })
})

describe('deleteRouteStop', () => {
  it('llama a DELETE /routes/1/stops/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteRouteStop(1, 1)
    expect(apiClient.delete).toHaveBeenCalledWith('/routes/1/stops/1/')
  })
})

describe('getTransportOptions', () => {
  it('llama a GET /transport/ con is_active y page_size, retorna results[]', async () => {
    const mockResults = [{ id: 1, plate_number: 'ABC-123', vehicle_type: 'truck', brand: 'Mercedes' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { count: 1, results: mockResults } })
    const result = await getTransportOptions()
    expect(apiClient.get).toHaveBeenCalledWith('/transport/', { params: { is_active: true, page_size: 100 } })
    expect(result).toEqual(mockResults)
  })
})

describe('getWarehouseOptions', () => {
  it('llama a GET /warehouses/ con is_active y page_size, retorna results[]', async () => {
    const mockResults = [{ id: 1, name: 'Almacén Central', city: 'Bogotá' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { count: 1, results: mockResults } })
    const result = await getWarehouseOptions()
    expect(apiClient.get).toHaveBeenCalledWith('/warehouses/', { params: { is_active: true, page_size: 100 } })
    expect(result).toEqual(mockResults)
  })
})

describe('propagación de errores', () => {
  it('rechaza la promesa si el server falla', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('404'))
    await expect(getRoute(999)).rejects.toThrow('404')
  })
})
