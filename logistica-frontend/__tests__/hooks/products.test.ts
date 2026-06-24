import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { queryClient } from '@/lib/query-client'
import { renderHookWithQuery } from '@/test/utils/renderWithQuery'
import {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useSupplierOptions,
  useWarehouseOptions,
} from '@/hooks/products'
import type { Product } from '@/types/products'

vi.mock('@/services/products', () => ({
  getProducts: vi.fn(),
  getProduct: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getSupplierOptions: vi.fn(),
  getWarehouseOptions: vi.fn(),
}))

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSupplierOptions,
  getWarehouseOptions,
} from '@/services/products'

const mockProduct: Product = {
  id: 1, name: 'Producto Test', description: null, sku: 'SKU-001',
  weight_kg: '2.50', dimensions: null, unit_price: '99.99', stock: 50,
  supplier: { id: 1, name: 'Proveedor A' },
  warehouse: { id: 1, name: 'Almacén Central', city: 'Bogotá' },
  is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}
const mockPaginated = { count: 1, next: null, previous: null, results: [mockProduct] }

beforeEach(() => { vi.clearAllMocks(); queryClient.clear() })
afterEach(() => { vi.restoreAllMocks() })

describe('useProducts', () => {
  it('retorna datos paginados cuando la query tiene éxito', async () => {
    vi.mocked(getProducts).mockResolvedValue(mockPaginated)
    const { result } = renderHookWithQuery(() => useProducts({}))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPaginated)
  })
})

describe('useProduct', () => {
  it('retorna Product cuando id > 0', async () => {
    vi.mocked(getProduct).mockResolvedValue(mockProduct)
    const { result } = renderHookWithQuery(() => useProduct(1))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockProduct)
  })

  it('query deshabilitada cuando id === 0', () => {
    const { result } = renderHookWithQuery(() => useProduct(0))
    expect(result.current.isFetching).toBe(false)
    expect(getProduct).not.toHaveBeenCalled()
  })
})

describe('useCreateProduct', () => {
  it('llama a createProduct y en éxito invalida ["products","list"]', async () => {
    vi.mocked(createProduct).mockResolvedValue(mockProduct)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useCreateProduct())
    await result.current.mutateAsync({
      name: 'Test', sku: 'SKU-002', weight_kg: '1.00',
      unit_price: '50.00', stock: 10, supplier: 1, warehouse: 1, is_active: true,
    })
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['products', 'list'] })
    )
  })
})

describe('useUpdateProduct', () => {
  it('en éxito invalida lista y detalle', async () => {
    vi.mocked(updateProduct).mockResolvedValue({ ...mockProduct, stock: 999 })
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useUpdateProduct())
    await result.current.mutateAsync({ id: 1, payload: { stock: 999 } })
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: ['products', 'list'] })
      expect(spy).toHaveBeenCalledWith({ queryKey: ['products', 1] })
    })
  })
})

describe('useDeleteProduct', () => {
  it('en éxito invalida ["products","list"]', async () => {
    vi.mocked(deleteProduct).mockResolvedValue(undefined)
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithQuery(() => useDeleteProduct())
    await result.current.mutateAsync(1)
    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ['products', 'list'] })
    )
  })
})

describe('useSupplierOptions', () => {
  it('retorna opciones de proveedores con queryKey ["suppliers","options"]', async () => {
    const mockOptions = [{ id: 1, name: 'Proveedor A' }]
    vi.mocked(getSupplierOptions).mockResolvedValue(mockOptions)
    const { result } = renderHookWithQuery(() => useSupplierOptions())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockOptions)
  })
})

describe('useWarehouseOptions', () => {
  it('retorna opciones de almacenes con queryKey ["warehouses","options"]', async () => {
    const mockOptions = [{ id: 1, name: 'Almacén Central', city: 'Bogotá' }]
    vi.mocked(getWarehouseOptions).mockResolvedValue(mockOptions)
    const { result } = renderHookWithQuery(() => useWarehouseOptions())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockOptions)
  })
})
