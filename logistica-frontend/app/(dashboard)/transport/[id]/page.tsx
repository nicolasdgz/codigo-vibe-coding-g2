'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransportForm } from '@/components/transport/TransportForm'
import { TransportDeleteDialog } from '@/components/transport/TransportDeleteDialog'
import {
  useTransport,
  useUpdateTransport,
  useDriverOptions,
} from '@/hooks/transport'
import type { TransportWritePayload } from '@/types/transport'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function TransportDetailPage() {
  const user = useAuthStore((s) => s.user)
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [updateApiErrors, setUpdateApiErrors] = useState<
    Partial<Record<keyof TransportWritePayload, string>> | undefined
  >()

  const { data: transport, isLoading, isError } = useTransport(id)
  const updateTransport = useUpdateTransport()
  const { data: driverOptions = [], isError: isErrorDrivers } = useDriverOptions()

  function handleSubmit(payload: TransportWritePayload) {
    if (!transport) return

    const original: TransportWritePayload = {
      plate_number: transport.plate_number,
      vehicle_type: transport.vehicle_type,
      brand: transport.brand,
      model: transport.model,
      year: transport.year,
      capacity_kg: transport.capacity_kg,
      capacity_units: transport.capacity_units,
      driver: transport.driver ? transport.driver.id : null,
      is_active: transport.is_active,
    }

    const changed = (Object.keys(payload) as Array<keyof TransportWritePayload>).reduce(
      (acc, key) => {
        const payloadVal = payload[key]
        const originalVal = original[key]
        // driver can be null — must compare correctly
        if (payloadVal !== originalVal) (acc as Record<string, unknown>)[key] = payloadVal
        return acc
      },
      {} as Partial<TransportWritePayload>
    )

    if (Object.keys(changed).length === 0) return

    setUpdateApiErrors(undefined)
    updateTransport.mutate({ id, payload: changed }, {
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const responseData = err.response.data as Record<string, string | string[]>
          setUpdateApiErrors(
            Object.fromEntries(
              Object.entries(responseData).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            ) as Partial<Record<keyof TransportWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'transport', 'view')) return <AccessDenied />

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !transport) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar el vehículo. El registro puede no existir o no tenés permisos.
        </div>
        <Button variant="outline" onClick={() => router.push('/transport')}>
          Volver a transporte
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar vehículo</h1>
          <p className="text-sm text-muted-foreground">{transport.plate_number}</p>
        </div>
        {canAccessModule(user, 'transport', 'delete') && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </Button>
        )}
      </div>

      <div className="max-w-lg">
        <TransportForm
          mode="edit"
          defaultValues={{
            plate_number: transport.plate_number,
            vehicle_type: transport.vehicle_type,
            brand: transport.brand,
            model: transport.model,
            year: transport.year,
            capacity_kg: transport.capacity_kg,
            capacity_units: transport.capacity_units,
            driver: transport.driver ? transport.driver.id : null,
            is_active: transport.is_active,
          }}
          currentDriver={transport.driver}
          onSubmit={handleSubmit}
          isSubmitting={updateTransport.isPending}
          driverOptions={driverOptions}
          isErrorDrivers={isErrorDrivers}
          apiErrors={updateApiErrors}
        />
      </div>

      <TransportDeleteDialog
        transportId={transport.id}
        plateNumber={transport.plate_number}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push('/transport')}
      />
    </div>
  )
}
