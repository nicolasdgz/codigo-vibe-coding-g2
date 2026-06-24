import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '@/services/warehouses'
import type { WarehouseListParams, WarehouseWritePayload } from '@/types/warehouses'

export function useWarehouses(params: WarehouseListParams) {
  return useQuery({
    queryKey: ['warehouses', 'list', params],
    queryFn: () => getWarehouses(params),
  })
}

export function useWarehouse(id: number) {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => getWarehouse(id),
    enabled: id > 0,
  })
}

export function useCreateWarehouse() {
  return useMutation({
    mutationFn: (payload: WarehouseWritePayload) => createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', 'list'] })
      toast.success('Depósito creado correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear el depósito')
    },
  })
}

export function useUpdateWarehouse() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<WarehouseWritePayload> }) =>
      updateWarehouse(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['warehouses', variables.id] })
      toast.success('Depósito actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el depósito')
    },
  })
}

export function useDeleteWarehouse() {
  return useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', 'list'] })
      toast.success('Depósito eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el depósito')
    },
  })
}
