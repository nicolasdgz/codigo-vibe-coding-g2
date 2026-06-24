'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WarehouseForm } from '@/components/warehouses/WarehouseForm'
import { WarehouseDeleteDialog } from '@/components/warehouses/WarehouseDeleteDialog'
import { useWarehouse, useUpdateWarehouse } from '@/hooks/warehouses'
import type { WarehouseWritePayload } from '@/types/warehouses'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function WarehouseDetailPage() {
  const user = useAuthStore((s) => s.user)
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [updateApiErrors, setUpdateApiErrors] = useState<
    Partial<Record<keyof WarehouseWritePayload, string>> | undefined
  >()

  const { data: warehouse, isLoading, isError } = useWarehouse(id)
  const updateWarehouse = useUpdateWarehouse()

  function handleSubmit(payload: WarehouseWritePayload) {
    if (!warehouse) return
    const original: WarehouseWritePayload = {
      name: warehouse.name,
      address: warehouse.address,
      city: warehouse.city,
      country: warehouse.country,
      latitude: warehouse.latitude,
      longitude: warehouse.longitude,
      capacity: warehouse.capacity,
      is_active: warehouse.is_active,
    }
    const changed = (Object.keys(payload) as Array<keyof WarehouseWritePayload>).reduce(
      (acc, key) => {
        if (payload[key] !== original[key]) (acc as Record<string, unknown>)[key] = payload[key]
        return acc
      },
      {} as Partial<WarehouseWritePayload>
    )
    if (Object.keys(changed).length === 0) return

    setUpdateApiErrors(undefined)
    updateWarehouse.mutate({ id, payload: changed }, {
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const responseData = err.response.data as Record<string, string | string[]>
          setUpdateApiErrors(
            Object.fromEntries(
              Object.entries(responseData).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            ) as Partial<Record<keyof WarehouseWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'warehouses', 'view')) return <AccessDenied />

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

  if (isError || !warehouse) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar el almacén. El registro puede no existir o no tenés permisos.
        </div>
        <Button variant="outline" onClick={() => router.push('/warehouses')}>
          Volver a almacenes
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar almacén</h1>
          <p className="text-sm text-muted-foreground">{warehouse.name}</p>
        </div>
        {canAccessModule(user, 'warehouses', 'delete') && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </Button>
        )}
      </div>

      <div className="max-w-lg">
        <WarehouseForm
          defaultValues={{
            name: warehouse.name,
            address: warehouse.address,
            city: warehouse.city,
            country: warehouse.country,
            latitude: warehouse.latitude,
            longitude: warehouse.longitude,
            capacity: warehouse.capacity,
            is_active: warehouse.is_active,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateWarehouse.isPending}
          apiErrors={updateApiErrors}
        />
      </div>

      <WarehouseDeleteDialog
        warehouseId={warehouse.id}
        warehouseName={warehouse.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push('/warehouses')}
      />
    </div>
  )
}
