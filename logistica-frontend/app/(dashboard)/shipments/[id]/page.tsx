'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShipmentForm } from '@/components/shipments/ShipmentForm'
import { ShipmentDeleteDialog } from '@/components/shipments/ShipmentDeleteDialog'
import { ShipmentItemList } from '@/components/shipments/ShipmentItemList'
import {
  useShipment,
  useUpdateShipment,
  useCustomerOptions,
  useWarehouseOptions,
  useRouteOptions,
} from '@/hooks/shipments'
import type { ShipmentWritePayload } from '@/types/shipments'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function ShipmentDetailPage() {
  const user = useAuthStore((s) => s.user)
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [updateApiErrors, setUpdateApiErrors] = useState<
    Record<string, string[]> | undefined
  >()

  const { data: shipment, isLoading, isError } = useShipment(id)
  const updateShipment = useUpdateShipment()

  const { data: customerOptions = [], isError: isErrorCustomers } = useCustomerOptions()
  const { data: warehouseOptions = [], isError: isErrorWarehouses } = useWarehouseOptions()
  const { data: routeOptions = [], isError: isErrorRoutes } = useRouteOptions()

  function handleSubmit(payload: ShipmentWritePayload) {
    if (!shipment) return

    const original: ShipmentWritePayload = {
      customer: shipment.customer?.id ?? null,
      origin_warehouse: shipment.origin_warehouse.id,
      destination_address: shipment.destination_address,
      destination_city: shipment.destination_city,
      destination_country: shipment.destination_country,
      status: shipment.status,
      route: shipment.route?.id ?? null,
      estimated_delivery: shipment.estimated_delivery,
      calculated_cost: shipment.calculated_cost,
      notes: shipment.notes,
    }

    const changed = (Object.keys(payload) as Array<keyof ShipmentWritePayload>).reduce(
      (acc, key) => {
        if (payload[key] !== original[key]) (acc as Record<string, unknown>)[key] = payload[key]
        return acc
      },
      {} as Partial<ShipmentWritePayload>
    )

    if (Object.keys(changed).length === 0) return

    setUpdateApiErrors(undefined)
    updateShipment.mutate(
      { id, payload: changed },
      {
        onError: (err) => {
          if (axios.isAxiosError(err) && err.response?.status === 400) {
            const responseData = err.response.data as Record<string, string | string[]>
            setUpdateApiErrors(
              Object.fromEntries(
                Object.entries(responseData).map(([k, v]) => [
                  k,
                  Array.isArray(v) ? v : [v],
                ])
              ) as Record<string, string[]>
            )
          }
        },
      }
    )
  }

  if (!canAccessModule(user, 'shipments', 'view')) return <AccessDenied />

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !shipment) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar el envío. El registro puede no existir o no tenés permisos.
        </div>
        <Button variant="outline" onClick={() => router.push('/shipments')}>
          Volver a envíos
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar envío</h1>
          <div className="mt-1 flex flex-col gap-0.5">
            <div className="text-sm text-muted-foreground">
              Tracking:{' '}
              <span className="font-mono font-medium text-foreground">
                {shipment.tracking_number}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Peso total:{' '}
              <span className="font-medium text-foreground">
                {shipment.total_weight_kg} kg
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Costo:{' '}
              <span className="font-medium text-foreground">
                ${shipment.calculated_cost}
              </span>
            </div>
          </div>
        </div>
        {canAccessModule(user, 'shipments', 'delete') && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </Button>
        )}
      </div>

      <div className="max-w-lg">
        <ShipmentForm
          mode="edit"
          defaultValues={{
            customer: shipment.customer?.id ?? null,
            origin_warehouse: shipment.origin_warehouse.id,
            destination_address: shipment.destination_address,
            destination_city: shipment.destination_city,
            destination_country: shipment.destination_country,
            status: shipment.status,
            route: shipment.route?.id ?? null,
            estimated_delivery: shipment.estimated_delivery,
            calculated_cost: shipment.calculated_cost,
            notes: shipment.notes,
          }}
          currentCustomer={shipment.customer}
          currentOriginWarehouse={shipment.origin_warehouse}
          currentRoute={shipment.route}
          onSubmit={handleSubmit}
          isSubmitting={updateShipment.isPending}
          customerOptions={customerOptions}
          warehouseOptions={warehouseOptions}
          routeOptions={routeOptions}
          isErrorCustomers={isErrorCustomers}
          isErrorWarehouses={isErrorWarehouses}
          isErrorRoutes={isErrorRoutes}
          apiErrors={updateApiErrors}
        />
      </div>

      <ShipmentItemList
        shipmentId={shipment.id}
        items={shipment.items}
        totalWeightKg={shipment.total_weight_kg}
        isLoading={false}
      />

      <ShipmentDeleteDialog
        shipmentId={shipment.id}
        trackingNumber={shipment.tracking_number}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push('/shipments')}
      />
    </div>
  )
}
