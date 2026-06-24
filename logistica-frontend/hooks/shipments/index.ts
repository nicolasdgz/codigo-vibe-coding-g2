import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryClient } from '@/lib/query-client'
import {
  getShipmentList,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  createShipmentItem,
  patchShipmentItem,
  deleteShipmentItem,
  getCustomerOptions,
  getWarehouseOptions,
  getRouteOptions,
  getProductOptions,
} from '@/services/shipments'
import type {
  ShipmentListParams,
  ShipmentWritePayload,
  ShipmentItemWritePayload,
  ShipmentItemPatchPayload,
} from '@/types/shipments'

export function useShipmentList(params: ShipmentListParams) {
  return useQuery({
    queryKey: ['shipments', 'list', params],
    queryFn: () => getShipmentList(params),
  })
}

export function useShipment(id: number) {
  return useQuery({
    queryKey: ['shipments', id],
    queryFn: () => getShipment(id),
    enabled: id > 0,
  })
}

export function useCreateShipment() {
  return useMutation({
    mutationFn: (payload: ShipmentWritePayload) => createShipment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments', 'list'] })
      toast.success('Envío creado correctamente')
    },
    onError: () => {
      toast.error('No se pudo crear el envío')
    },
  })
}

export function useUpdateShipment() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ShipmentWritePayload> }) =>
      updateShipment(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.id] })
      toast.success('Envío actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el envío')
    },
  })
}

export function useDeleteShipment() {
  return useMutation({
    mutationFn: (id: number) => deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments', 'list'] })
      toast.success('Envío eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el envío')
    },
  })
}

export function useCreateShipmentItem() {
  return useMutation({
    mutationFn: ({
      shipmentId,
      payload,
    }: {
      shipmentId: number
      payload: ShipmentItemWritePayload
    }) => createShipmentItem(shipmentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] })
      toast.success('Ítem agregado')
    },
    onError: () => {
      toast.error('No se pudo agregar el ítem')
    },
  })
}

export function usePatchShipmentItem() {
  return useMutation({
    mutationFn: ({
      shipmentId,
      itemId,
      payload,
    }: {
      shipmentId: number
      itemId: number
      payload: ShipmentItemPatchPayload
    }) => patchShipmentItem(shipmentId, itemId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] })
      toast.success('Ítem actualizado')
    },
    onError: () => {
      toast.error('No se pudo actualizar el ítem')
    },
  })
}

export function useDeleteShipmentItem() {
  return useMutation({
    mutationFn: ({ shipmentId, itemId }: { shipmentId: number; itemId: number }) =>
      deleteShipmentItem(shipmentId, itemId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] })
      toast.success('Ítem eliminado')
    },
    onError: () => {
      toast.error('No se pudo eliminar el ítem')
    },
  })
}

export function useCustomerOptions() {
  return useQuery({
    queryKey: ['customers', 'options'],
    queryFn: () => getCustomerOptions(),
  })
}

export function useWarehouseOptions() {
  return useQuery({
    queryKey: ['warehouses', 'options'],
    queryFn: () => getWarehouseOptions(),
  })
}

export function useRouteOptions() {
  return useQuery({
    queryKey: ['routes', 'options'],
    queryFn: () => getRouteOptions(),
  })
}

export function useProductOptions() {
  return useQuery({
    queryKey: ['products', 'options'],
    queryFn: () => getProductOptions(),
  })
}
