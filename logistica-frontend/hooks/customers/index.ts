import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/services/customers'
import type { CustomerListParams, CustomerWritePayload } from '@/types/customers'

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: ['customers', 'list', params],
    queryFn: () => getCustomers(params),
  })
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => getCustomer(id),
    enabled: id > 0,
  })
}

export function useCreateCustomer() {
  return useMutation({
    mutationFn: (payload: CustomerWritePayload) => createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', 'list'] })
      toast.success('Cliente creado correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear el cliente')
    },
  })
}

export function useUpdateCustomer() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CustomerWritePayload> }) =>
      updateCustomer(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] })
      toast.success('Cliente actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el cliente')
    },
  })
}

export function useDeleteCustomer() {
  return useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', 'list'] })
      toast.success('Cliente eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el cliente')
    },
  })
}
