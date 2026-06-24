'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SupplierForm } from '@/components/suppliers/SupplierForm'
import { SupplierDeleteDialog } from '@/components/suppliers/SupplierDeleteDialog'
import { useSupplier, useUpdateSupplier } from '@/hooks/suppliers'
import type { SupplierWritePayload } from '@/types/suppliers'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function SupplierDetailPage() {
  const user = useAuthStore((s) => s.user)
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [updateApiErrors, setUpdateApiErrors] = useState<
    Partial<Record<keyof SupplierWritePayload, string>> | undefined
  >()

  const { data: supplier, isLoading, isError } = useSupplier(id)
  const updateSupplier = useUpdateSupplier()

  function handleSubmit(payload: SupplierWritePayload) {
    if (!supplier) return
    const original: SupplierWritePayload = {
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      tax_id: supplier.tax_id,
      contact_name: supplier.contact_name,
      is_active: supplier.is_active,
    }
    const changed = (Object.keys(payload) as Array<keyof SupplierWritePayload>).reduce(
      (acc, key) => {
        if (payload[key] !== original[key]) (acc as Record<string, unknown>)[key] = payload[key]
        return acc
      },
      {} as Partial<SupplierWritePayload>
    )
    if (Object.keys(changed).length === 0) return

    setUpdateApiErrors(undefined)
    updateSupplier.mutate({ id, payload: changed }, {
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const responseData = err.response.data as Record<string, string | string[]>
          setUpdateApiErrors(
            Object.fromEntries(
              Object.entries(responseData).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            ) as Partial<Record<keyof SupplierWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'suppliers', 'view')) return <AccessDenied />

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !supplier) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar el proveedor. El registro puede no existir o no tenés permisos.
        </div>
        <Button variant="outline" onClick={() => router.push('/suppliers')}>
          Volver a proveedores
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar proveedor</h1>
          <p className="text-sm text-muted-foreground">{supplier.name}</p>
        </div>
        {canAccessModule(user, 'suppliers', 'delete') && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </Button>
        )}
      </div>

      <div className="max-w-lg">
        <SupplierForm
          defaultValues={{
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            tax_id: supplier.tax_id,
            contact_name: supplier.contact_name,
            is_active: supplier.is_active,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateSupplier.isPending}
          apiErrors={updateApiErrors}
        />
      </div>

      <SupplierDeleteDialog
        supplierId={supplier.id}
        supplierName={supplier.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push('/suppliers')}
      />
    </div>
  )
}
