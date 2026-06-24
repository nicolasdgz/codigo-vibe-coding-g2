import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
} from '@/services/drivers'
import type { DriverListParams, DriverWritePayload } from '@/types/drivers'

export function useDrivers(params: DriverListParams) {
  return useQuery({
    queryKey: ['drivers', 'list', params],
    queryFn: () => getDrivers(params),
  })
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ['drivers', id],
    queryFn: () => getDriver(id),
    enabled: id > 0,
  })
}

export function useCreateDriver() {
  return useMutation({
    mutationFn: (payload: DriverWritePayload) => createDriver(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', 'list'] })
      toast.success('Conductor creado correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear el conductor')
    },
  })
}

export function useUpdateDriver() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<DriverWritePayload> }) =>
      updateDriver(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['drivers', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['drivers', variables.id] })
      toast.success('Conductor actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el conductor')
    },
  })
}

export function useDeleteDriver() {
  return useMutation({
    mutationFn: (id: number) => deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', 'list'] })
      toast.success('Conductor eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el conductor')
    },
  })
}
