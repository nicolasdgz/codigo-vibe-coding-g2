'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RouteForm } from '@/components/routes/RouteForm'
import { RouteDeleteDialog } from '@/components/routes/RouteDeleteDialog'
import { RouteStopList } from '@/components/routes/RouteStopList'
import {
  useRoute,
  useUpdateRoute,
  useTransportOptions,
  useWarehouseOptions,
} from '@/hooks/routes'
import type { RouteWritePayload } from '@/types/routes'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function RouteDetailPage() {
  const user = useAuthStore((s) => s.user)
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [updateApiErrors, setUpdateApiErrors] = useState<
    Partial<Record<keyof RouteWritePayload, string>> | undefined
  >()

  const { data: route, isLoading, isError } = useRoute(id)
  const updateRoute = useUpdateRoute()
  const { data: transportOptions = [], isError: isErrorTransport } = useTransportOptions()
  const { data: warehouseOptions = [], isError: isErrorWarehouses } = useWarehouseOptions()

  function handleSubmit(payload: RouteWritePayload) {
    if (!route) return

    const original: RouteWritePayload = {
      name: route.name,
      transport: route.transport?.id ?? null,
      origin_warehouse: route.origin_warehouse.id,
      status: route.status,
      scheduled_date: route.scheduled_date,
    }

    const changed = (Object.keys(payload) as Array<keyof RouteWritePayload>).reduce(
      (acc, key) => {
        if (payload[key] !== original[key]) (acc as Record<string, unknown>)[key] = payload[key]
        return acc
      },
      {} as Partial<RouteWritePayload>
    )

    if (Object.keys(changed).length === 0) return

    setUpdateApiErrors(undefined)
    updateRoute.mutate(
      { id, payload: changed },
      {
        onError: (err) => {
          if (axios.isAxiosError(err) && err.response?.status === 400) {
            const responseData = err.response.data as Record<string, string | string[]>
            setUpdateApiErrors(
              Object.fromEntries(
                Object.entries(responseData).map(([k, v]) => [
                  k,
                  Array.isArray(v) ? v[0] : v,
                ])
              ) as Partial<Record<keyof RouteWritePayload, string>>
            )
          }
        },
      }
    )
  }

  if (!canAccessModule(user, 'routes', 'view')) return <AccessDenied />

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !route) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar la ruta. El registro puede no existir o no tenés permisos.
        </div>
        <Button variant="outline" onClick={() => router.push('/routes')}>
          Volver a rutas
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar ruta</h1>
          <p className="text-sm text-muted-foreground">{route.name}</p>
        </div>
        {canAccessModule(user, 'routes', 'delete') && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </Button>
        )}
      </div>

      <div className="max-w-lg">
        <RouteForm
          mode="edit"
          defaultValues={{
            name: route.name,
            transport: route.transport?.id ?? null,
            origin_warehouse: route.origin_warehouse.id,
            status: route.status,
            scheduled_date: route.scheduled_date,
          }}
          currentTransport={route.transport}
          currentOriginWarehouse={route.origin_warehouse}
          onSubmit={handleSubmit}
          isSubmitting={updateRoute.isPending}
          transportOptions={transportOptions}
          warehouseOptions={warehouseOptions}
          isErrorTransport={isErrorTransport}
          isErrorWarehouses={isErrorWarehouses}
          apiErrors={updateApiErrors}
        />
      </div>

      <RouteStopList
        routeId={route.id}
        stops={route.stops}
        isLoading={false}
      />

      <RouteDeleteDialog
        routeId={route.id}
        routeName={route.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push('/routes')}
      />
    </div>
  )
}
