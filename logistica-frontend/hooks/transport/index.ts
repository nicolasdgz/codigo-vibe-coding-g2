import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import {
  getTransportList,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport,
  getDriverOptions,
} from '@/services/transport'
import type { TransportListParams, TransportWritePayload } from '@/types/transport'

export function useTransportList(params: TransportListParams) {
  return useQuery({
    queryKey: ['transport', 'list', params],
    queryFn: () => getTransportList(params),
  })
}

export function useTransport(id: number) {
  return useQuery({
    queryKey: ['transport', id],
    queryFn: () => getTransport(id),
    enabled: id > 0,
  })
}

export function useCreateTransport() {
  return useMutation({
    mutationFn: (payload: TransportWritePayload) => createTransport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'list'] })
      toast.success('Vehículo creado correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear el vehículo')
    },
  })
}

export function useUpdateTransport() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<TransportWritePayload> }) =>
      updateTransport(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['transport', variables.id] })
      toast.success('Vehículo actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el vehículo')
    },
  })
}

export function useDeleteTransport() {
  return useMutation({
    mutationFn: (id: number) => deleteTransport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport', 'list'] })
      toast.success('Vehículo eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el vehículo')
    },
  })
}

export function useDriverOptions() {
  return useQuery({
    queryKey: ['drivers', 'options'],
    queryFn: () => getDriverOptions(),
  })
}
