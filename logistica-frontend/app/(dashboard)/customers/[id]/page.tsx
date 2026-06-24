'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { CustomerDeleteDialog } from '@/components/customers/CustomerDeleteDialog'
import { useCustomer, useUpdateCustomer } from '@/hooks/customers'
import type { CustomerWritePayload } from '@/types/customers'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function CustomerDetailPage() {
  const user = useAuthStore((s) => s.user)
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [updateApiErrors, setUpdateApiErrors] = useState<
    Partial<Record<keyof CustomerWritePayload, string>> | undefined
  >()

  const { data: customer, isLoading, isError } = useCustomer(id)
  const updateCustomer = useUpdateCustomer()

  function handleSubmit(payload: CustomerWritePayload) {
    if (!customer) return
    const original: CustomerWritePayload = {
      name: customer.name,
      customer_type: customer.customer_type,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      tax_id: customer.tax_id,
      is_active: customer.is_active,
    }
    const changed = (Object.keys(payload) as Array<keyof CustomerWritePayload>).reduce(
      (acc, key) => {
        if (payload[key] !== original[key]) (acc as Record<string, unknown>)[key] = payload[key]
        return acc
      },
      {} as Partial<CustomerWritePayload>
    )
    if (Object.keys(changed).length === 0) return

    setUpdateApiErrors(undefined)
    updateCustomer.mutate({ id, payload: changed }, {
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const data = err.response.data as Record<string, string | string[]>
          setUpdateApiErrors(
            Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            ) as Partial<Record<keyof CustomerWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'customers', 'view')) return <AccessDenied />

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

  if (isError || !customer) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar el cliente. El registro puede no existir o no tenés permisos.
        </div>
        <Button variant="outline" onClick={() => router.push('/customers')}>
          Volver a clientes
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar cliente</h1>
          <p className="text-sm text-muted-foreground">{customer.name}</p>
        </div>
        {canAccessModule(user, 'customers', 'delete') && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </Button>
        )}
      </div>

      <div className="max-w-lg">
        <CustomerForm
          defaultValues={{
            name: customer.name,
            customer_type: customer.customer_type,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            tax_id: customer.tax_id,
            is_active: customer.is_active,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateCustomer.isPending}
          apiErrors={updateApiErrors}
        />
      </div>

      <CustomerDeleteDialog
        customerId={customer.id}
        customerName={customer.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push('/customers')}
      />
    </div>
  )
}
