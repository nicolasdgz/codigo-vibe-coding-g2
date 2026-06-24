'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { QueryError } from '@/components/ui/query-error'
import { CustomerFilters } from '@/components/customers/CustomerFilters'
import { CustomersTable } from '@/components/customers/CustomersTable'
import { MobileFilterSheet } from '@/components/ui/mobile-filter-sheet'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { CustomerDeleteDialog } from '@/components/customers/CustomerDeleteDialog'
import { useCustomers, useCreateCustomer } from '@/hooks/customers'
import type { Customer, CustomerListParams, CustomerWritePayload } from '@/types/customers'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function CustomersPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [filters, setFilters] = useState<CustomerListParams>({})
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [createApiErrors, setCreateApiErrors] = useState<
    Partial<Record<keyof CustomerWritePayload, string>> | undefined
  >()

  const { data, isLoading, isError, refetch } = useCustomers({ ...filters, page })
  const createCustomer = useCreateCustomer()

  function handleFiltersChange(nextFilters: CustomerListParams) {
    setFilters(nextFilters)
    setPage(1)
  }

  function handleEdit(id: number) {
    router.push(`/customers/${id}`)
  }

  function handleCreateSubmit(payload: CustomerWritePayload) {
    setCreateApiErrors(undefined)
    createCustomer.mutate(payload, {
      onSuccess: () => {
        setCreateOpen(false)
        setCreateApiErrors(undefined)
      },
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const data = err.response.data as Record<string, string | string[]>
          setCreateApiErrors(
            Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            ) as Partial<Record<keyof CustomerWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'customers', 'view')) return <AccessDenied />

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de clientes del sistema logístico
          </p>
        </div>
        {canAccessModule(user, 'customers', 'add') && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Nuevo cliente
          </Button>
        )}
      </div>

      {/* Desktop: inline filters */}
      <div className="hidden lg:block">
        <CustomerFilters filters={filters} onChange={handleFiltersChange} />
      </div>
      {/* Mobile: Sheet trigger */}
      <div className="lg:hidden">
        <MobileFilterSheet
          activeCount={[
            filters.search,
            filters.customer_type,
            filters.is_active !== undefined ? 'set' : undefined,
          ].filter(Boolean).length}
        >
          <CustomerFilters filters={filters} onChange={handleFiltersChange} layout="col" />
        </MobileFilterSheet>
      </div>

      {isError && (
        <QueryError message="Error al cargar los clientes." onRetry={refetch} />
      )}

      <CustomersTable
        data={data?.results ?? []}
        total={data?.count ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        hasActiveFilters={Object.entries(filters).some(([k, v]) => k !== 'page' && k !== 'ordering' && v !== undefined)}
        onClearFilters={() => handleFiltersChange({})}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
      />

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nuevo cliente</SheetTitle>
          </SheetHeader>
          <CustomerForm
            onSubmit={handleCreateSubmit}
            isSubmitting={createCustomer.isPending}
            apiErrors={createApiErrors}
          />
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <CustomerDeleteDialog
          customerId={deleteTarget.id}
          customerName={deleteTarget.name}
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
