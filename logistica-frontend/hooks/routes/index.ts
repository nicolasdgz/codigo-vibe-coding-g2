import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import {
  getRouteList,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  createRouteStop,
  patchRouteStop,
  deleteRouteStop,
  getTransportOptions,
  getWarehouseOptions,
} from '@/services/routes'
import type {
  RouteListParams,
  RouteWritePayload,
  RouteStopWritePayload,
  RouteStopPatchPayload,
} from '@/types/routes'

export function useRouteList(params: RouteListParams) {
  return useQuery({
    queryKey: ['routes', 'list', params],
    queryFn: () => getRouteList(params),
  })
}

export function useRoute(id: number) {
  return useQuery({
    queryKey: ['routes', id],
    queryFn: () => getRoute(id),
    enabled: id > 0,
  })
}

export function useCreateRoute() {
  return useMutation({
    mutationFn: (payload: RouteWritePayload) => createRoute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', 'list'] })
      toast.success('Ruta creada correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear la ruta')
    },
  })
}

export function useUpdateRoute() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RouteWritePayload> }) =>
      updateRoute(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routes', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['routes', variables.id] })
      toast.success('Ruta actualizada')
    },
    onError: () => {
      toast.error('No se pudo actualizar la ruta')
    },
  })
}

export function useDeleteRoute() {
  return useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', 'list'] })
      toast.success('Ruta eliminada')
    },
    onError: () => {
      toast.error('No se pudo eliminar la ruta')
    },
  })
}

export function useCreateRouteStop() {
  return useMutation({
    mutationFn: ({
      routeId,
      payload,
    }: {
      routeId: number
      payload: RouteStopWritePayload
    }) => createRouteStop(routeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routes', variables.routeId] })
      toast.success('Parada agregada')
    },
    onError: () => {
      toast.error('No se pudo agregar la parada')
    },
  })
}

export function usePatchRouteStop() {
  return useMutation({
    mutationFn: ({
      routeId,
      stopId,
      payload,
    }: {
      routeId: number
      stopId: number
      payload: RouteStopPatchPayload
    }) => patchRouteStop(routeId, stopId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routes', variables.routeId] })
      toast.success('Parada actualizada')
    },
    onError: () => {
      toast.error('No se pudo actualizar la parada')
    },
  })
}

export function useDeleteRouteStop() {
  return useMutation({
    mutationFn: ({ routeId, stopId }: { routeId: number; stopId: number }) =>
      deleteRouteStop(routeId, stopId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routes', variables.routeId] })
      toast.success('Parada eliminada')
    },
    onError: () => {
      toast.error('No se pudo eliminar la parada')
    },
  })
}

export function useTransportOptions() {
  return useQuery({
    queryKey: ['transport', 'options'],
    queryFn: () => getTransportOptions(),
  })
}

export function useWarehouseOptions() {
  return useQuery({
    queryKey: ['warehouses', 'options'],
    queryFn: () => getWarehouseOptions(),
  })
}
