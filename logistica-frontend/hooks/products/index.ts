import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSupplierOptions,
  getWarehouseOptions,
} from '@/services/products'
import type { ProductListParams, ProductWritePayload } from '@/types/products'

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ['products', 'list', params],
    queryFn: () => getProducts(params),
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
    enabled: id > 0,
  })
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: (payload: ProductWritePayload) => createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] })
      toast.success('Producto creado correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear el producto')
    },
  })
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ProductWritePayload> }) =>
      updateProduct(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] })
      toast.success('Producto actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el producto')
    },
  })
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] })
      toast.success('Producto eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el producto')
    },
  })
}

export function useSupplierOptions() {
  return useQuery({
    queryKey: ['suppliers', 'options'],
    queryFn: () => getSupplierOptions(),
  })
}

export function useWarehouseOptions() {
  return useQuery({
    queryKey: ['warehouses', 'options'],
    queryFn: () => getWarehouseOptions(),
  })
}
