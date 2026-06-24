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
import { SupplierFilters } from '@/components/suppliers/SupplierFilters'
import { SuppliersTable } from '@/components/suppliers/SuppliersTable'
import { MobileFilterSheet } from '@/components/ui/mobile-filter-sheet'
import { SupplierForm } from '@/components/suppliers/SupplierForm'
import { SupplierDeleteDialog } from '@/components/suppliers/SupplierDeleteDialog'
import { useSuppliers, useCreateSupplier } from '@/hooks/suppliers'
import type { Supplier, SupplierListParams, SupplierWritePayload } from '@/types/suppliers'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function SuppliersPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [filters, setFilters] = useState<SupplierListParams>({})
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [createApiErrors, setCreateApiErrors] = useState<
    Partial<Record<keyof SupplierWritePayload, string>> | undefined
  >()

  const { data, isLoading, isError, refetch } = useSuppliers({ ...filters, page })
  const createSupplier = useCreateSupplier()

  function handleFiltersChange(nextFilters: SupplierListParams) {
    setFilters(nextFilters)
    setPage(1)
  }

  function handleEdit(id: number) {
    router.push(`/suppliers/${id}`)
  }

  function handleCreateSubmit(payload: SupplierWritePayload) {
    setCreateApiErrors(undefined)
    createSupplier.mutate(payload, {
      onSuccess: () => {
        setCreateOpen(false)
        setCreateApiErrors(undefined)
      },
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const responseData = err.response.data as Record<string, string | string[]>
          setCreateApiErrors(
            Object.fromEntries(
              Object.entries(responseData).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            ) as Partial<Record<keyof SupplierWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'suppliers', 'view')) return <AccessDenied />

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de proveedores del sistema logístico
          </p>
        </div>
        {canAccessModule(user, 'suppliers', 'add') && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Nuevo proveedor
          </Button>
        )}
      </div>

      <div className="hidden lg:block">
        <SupplierFilters filters={filters} onChange={handleFiltersChange} />
      </div>
      <div className="lg:hidden">
        <MobileFilterSheet
          activeCount={[
            filters.search,
            filters.is_active !== undefined ? 'set' : undefined,
          ].filter(Boolean).length}
        >
          <SupplierFilters filters={filters} onChange={handleFiltersChange} layout="col" />
        </MobileFilterSheet>
      </div>

      {isError && (
        <QueryError message="Error al cargar los proveedores." onRetry={refetch} />
      )}

      <SuppliersTable
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
            <SheetTitle>Nuevo proveedor</SheetTitle>
          </SheetHeader>
          <SupplierForm
            onSubmit={handleCreateSubmit}
            isSubmitting={createSupplier.isPending}
            apiErrors={createApiErrors}
          />
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <SupplierDeleteDialog
          supplierId={deleteTarget.id}
          supplierName={deleteTarget.name}
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
