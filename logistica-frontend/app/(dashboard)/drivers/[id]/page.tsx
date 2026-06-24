'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DriverForm } from '@/components/drivers/DriverForm'
import { DriverDeleteDialog } from '@/components/drivers/DriverDeleteDialog'
import { useDriver, useUpdateDriver } from '@/hooks/drivers'
import type { DriverWritePayload } from '@/types/drivers'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function DriverDetailPage() {
  const user = useAuthStore((s) => s.user)
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [updateApiErrors, setUpdateApiErrors] = useState<
    Partial<Record<keyof DriverWritePayload, string>> | undefined
  >()

  const { data: driver, isLoading, isError } = useDriver(id)
  const updateDriver = useUpdateDriver()

  function handleSubmit(payload: DriverWritePayload) {
    if (!driver) return

    // Diff only against the editable fields — user is never changed in edit mode
    const original = {
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
      phone: driver.phone,
      is_available: driver.is_available,
    }

    type EditableKey = keyof typeof original
    const changed = (Object.keys(original) as EditableKey[]).reduce(
      (acc, key) => {
        if (payload[key] !== original[key]) {
          (acc as Record<string, unknown>)[key] = payload[key]
        }
        return acc
      },
      {} as Partial<DriverWritePayload>
    )

    if (Object.keys(changed).length === 0) return

    setUpdateApiErrors(undefined)
    updateDriver.mutate({ id, payload: changed }, {
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const responseData = err.response.data as Record<string, string | string[]>
          setUpdateApiErrors(
            Object.fromEntries(
              Object.entries(responseData).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            ) as Partial<Record<keyof DriverWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'drivers', 'view')) return <AccessDenied />

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !driver) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar el conductor. El registro puede no existir o no tenés permisos.
        </div>
        <Button variant="outline" onClick={() => router.push('/drivers')}>
          Volver a conductores
        </Button>
      </div>
    )
  }

  const fullName = `${driver.user.first_name} ${driver.user.last_name}`.trim() || driver.user.username

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar conductor</h1>
          <p className="text-sm text-muted-foreground">{fullName}</p>
        </div>
        {canAccessModule(user, 'drivers', 'delete') && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </Button>
        )}
      </div>

      <div className="max-w-lg">
        <DriverForm
          mode="edit"
          defaultValues={{
            license_number: driver.license_number,
            license_expiry: driver.license_expiry,
            phone: driver.phone,
            is_available: driver.is_available,
          }}
          currentUser={driver.user}
          onSubmit={handleSubmit}
          isSubmitting={updateDriver.isPending}
          apiErrors={updateApiErrors}
        />
      </div>

      <DriverDeleteDialog
        driverId={driver.id}
        driverName={fullName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push('/drivers')}
      />
    </div>
  )
}
