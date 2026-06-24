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
import { WarehouseFilters } from '@/components/warehouses/WarehouseFilters'
import { WarehousesTable } from '@/components/warehouses/WarehousesTable'
import { MobileFilterSheet } from '@/components/ui/mobile-filter-sheet'
import { WarehouseForm } from '@/components/warehouses/WarehouseForm'
import { WarehouseDeleteDialog } from '@/components/warehouses/WarehouseDeleteDialog'
import { useWarehouses, useCreateWarehouse } from '@/hooks/warehouses'
import type { Warehouse, WarehouseListParams, WarehouseWritePayload } from '@/types/warehouses'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function WarehousesPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [filters, setFilters] = useState<WarehouseListParams>({})
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null)
  const [createApiErrors, setCreateApiErrors] = useState<
    Partial<Record<keyof WarehouseWritePayload, string>> | undefined
  >()

  const { data, isLoading, isError, refetch } = useWarehouses({ ...filters, page })
  const createWarehouse = useCreateWarehouse()

  function handleFiltersChange(nextFilters: WarehouseListParams) {
    setFilters(nextFilters)
    setPage(1)
  }

  function handleEdit(id: number) {
    router.push(`/warehouses/${id}`)
  }

  function handleCreateSubmit(payload: WarehouseWritePayload) {
    setCreateApiErrors(undefined)
    createWarehouse.mutate(payload, {
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
            ) as Partial<Record<keyof WarehouseWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'warehouses', 'view')) return <AccessDenied />

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Almacenes</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de almacenes del sistema logístico
          </p>
        </div>
        {canAccessModule(user, 'warehouses', 'add') && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Nuevo almacén
          </Button>
        )}
      </div>

      <div className="hidden lg:block">
        <WarehouseFilters filters={filters} onChange={handleFiltersChange} />
      </div>
      <div className="lg:hidden">
        <MobileFilterSheet
          activeCount={[
            filters.search,
            filters.city,
            filters.country,
            filters.is_active !== undefined ? 'set' : undefined,
          ].filter(Boolean).length}
        >
          <WarehouseFilters filters={filters} onChange={handleFiltersChange} layout="col" />
        </MobileFilterSheet>
      </div>

      {isError && (
        <QueryError message="Error al cargar los almacenes." onRetry={refetch} />
      )}

      <WarehousesTable
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
            <SheetTitle>Nuevo almacén</SheetTitle>
          </SheetHeader>
          <WarehouseForm
            onSubmit={handleCreateSubmit}
            isSubmitting={createWarehouse.isPending}
            apiErrors={createApiErrors}
          />
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <WarehouseDeleteDialog
          warehouseId={deleteTarget.id}
          warehouseName={deleteTarget.name}
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
