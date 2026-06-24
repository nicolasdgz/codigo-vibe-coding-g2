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
import { DriverFilters } from '@/components/drivers/DriverFilters'
import { DriversTable } from '@/components/drivers/DriversTable'
import { MobileFilterSheet } from '@/components/ui/mobile-filter-sheet'
import { DriverForm } from '@/components/drivers/DriverForm'
import { DriverDeleteDialog } from '@/components/drivers/DriverDeleteDialog'
import { useDrivers, useCreateDriver } from '@/hooks/drivers'
import type { Driver, DriverListParams, DriverWritePayload } from '@/types/drivers'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function DriversPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [filters, setFilters] = useState<DriverListParams>({})
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null)
  const [createApiErrors, setCreateApiErrors] = useState<
    Partial<Record<keyof DriverWritePayload, string>> | undefined
  >()

  const { data, isLoading, isError, refetch } = useDrivers({ ...filters, page })
  const createDriver = useCreateDriver()

  function handleFiltersChange(nextFilters: DriverListParams) {
    setFilters(nextFilters)
    setPage(1)
  }

  function handleEdit(id: number) {
    router.push(`/drivers/${id}`)
  }

  function handleCreateSubmit(payload: DriverWritePayload) {
    setCreateApiErrors(undefined)
    createDriver.mutate(payload, {
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
            ) as Partial<Record<keyof DriverWritePayload, string>>
          )
        }
      },
    })
  }

  function getDriverName(driver: Driver): string {
    const full = `${driver.user.first_name} ${driver.user.last_name}`.trim()
    return full || driver.user.username
  }

  if (!canAccessModule(user, 'drivers', 'view')) return <AccessDenied />

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Conductores</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de conductores del sistema logístico
          </p>
        </div>
        {canAccessModule(user, 'drivers', 'add') && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Nuevo conductor
          </Button>
        )}
      </div>

      <div className="hidden lg:block">
        <DriverFilters filters={filters} onChange={handleFiltersChange} />
      </div>
      <div className="lg:hidden">
        <MobileFilterSheet
          activeCount={[
            filters.search,
            filters.is_available !== undefined ? 'set' : undefined,
          ].filter(Boolean).length}
        >
          <DriverFilters filters={filters} onChange={handleFiltersChange} layout="col" />
        </MobileFilterSheet>
      </div>

      {isError && (
        <QueryError message="Error al cargar los conductores." onRetry={refetch} />
      )}

      <DriversTable
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
            <SheetTitle>Nuevo conductor</SheetTitle>
          </SheetHeader>
          <DriverForm
            mode="create"
            onSubmit={handleCreateSubmit}
            isSubmitting={createDriver.isPending}
            apiErrors={createApiErrors}
          />
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <DriverDeleteDialog
          driverId={deleteTarget.id}
          driverName={getDriverName(deleteTarget)}
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
