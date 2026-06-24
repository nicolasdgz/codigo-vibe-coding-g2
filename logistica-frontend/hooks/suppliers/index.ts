import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/services/suppliers'
import type { SupplierListParams, SupplierWritePayload } from '@/types/suppliers'

export function useSuppliers(params: SupplierListParams) {
  return useQuery({
    queryKey: ['suppliers', 'list', params],
    queryFn: () => getSuppliers(params),
  })
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => getSupplier(id),
    enabled: id > 0,
  })
}

export function useCreateSupplier() {
  return useMutation({
    mutationFn: (payload: SupplierWritePayload) => createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] })
      toast.success('Proveedor creado correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear el proveedor')
    },
  })
}

export function useUpdateSupplier() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SupplierWritePayload> }) =>
      updateSupplier(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers', variables.id] })
      toast.success('Proveedor actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el proveedor')
    },
  })
}

export function useDeleteSupplier() {
  return useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] })
      toast.success('Proveedor eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el proveedor')
    },
  })
}
