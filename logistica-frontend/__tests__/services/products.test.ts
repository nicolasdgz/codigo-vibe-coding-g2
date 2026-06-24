import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/axios'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSupplierOptions,
  getWarehouseOptions,
} from '@/services/products'
import type { Product } from '@/types/products'

vi.mock('@/lib/axios', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const mockProduct: Product = {
  id: 1,
  name: 'Producto Test',
  description: 'Descripción del producto',
  sku: 'SKU-001',
  weight_kg: '2.50',
  dimensions: '10x10x10',
  unit_price: '99.99',
  stock: 50,
  supplier: { id: 1, name: 'Proveedor A' },
  warehouse: { id: 1, name: 'Almacén Central', city: 'Bogotá' },
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockProduct] }

beforeEach(() => { vi.clearAllMocks() })

describe('getProducts', () => {
  it('llama a GET /products/ con params y retorna paginado', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockPaginated })
    const result = await getProducts({ supplier: 1, is_active: true })
    expect(apiClient.get).toHaveBeenCalledWith('/products/', { params: { supplier: 1, is_active: true } })
    expect(result).toEqual(mockPaginated)
  })
})

describe('getProduct', () => {
  it('llama a GET /products/1/ y retorna Product', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockProduct })
    const result = await getProduct(1)
    expect(apiClient.get).toHaveBeenCalledWith('/products/1/')
    expect(result).toEqual(mockProduct)
  })
})

describe('createProduct', () => {
  it('llama a POST /products/ con payload y retorna Product creado', async () => {
    const payload = {
      name: 'Nuevo', sku: 'SKU-002', weight_kg: '1.00',
      unit_price: '50.00', stock: 10, supplier: 1, warehouse: 1, is_active: true,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockProduct })
    const result = await createProduct(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/products/', payload)
    expect(result).toEqual(mockProduct)
  })
})

describe('updateProduct', () => {
  it('llama a PATCH /products/1/ con patch y retorna Product actualizado', async () => {
    const patch = { stock: 999 }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...mockProduct, stock: 999 } })
    const result = await updateProduct(1, patch)
    expect(apiClient.patch).toHaveBeenCalledWith('/products/1/', patch)
    expect(result.stock).toBe(999)
  })
})

describe('deleteProduct', () => {
  it('llama a DELETE /products/1/', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({})
    await deleteProduct(1)
    expect(apiClient.delete).toHaveBeenCalledWith('/products/1/')
  })
})

describe('getSupplierOptions', () => {
  it('llama a GET /suppliers/ con is_active y page_size, retorna results[]', async () => {
    const mockResults = [{ id: 1, name: 'Proveedor A' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { count: 1, results: mockResults } })
    const result = await getSupplierOptions()
    expect(apiClient.get).toHaveBeenCalledWith('/suppliers/', { params: { is_active: true, page_size: 100 } })
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
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('500'))
    await expect(getProduct(1)).rejects.toThrow('500')
  })
})
