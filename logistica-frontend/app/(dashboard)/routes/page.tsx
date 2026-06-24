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
import { RouteFilters } from '@/components/routes/RouteFilters'
import { RoutesTable } from '@/components/routes/RoutesTable'
import { MobileFilterSheet } from '@/components/ui/mobile-filter-sheet'
import { RouteForm } from '@/components/routes/RouteForm'
import {
  useRouteList,
  useCreateRoute,
  useTransportOptions,
  useWarehouseOptions,
} from '@/hooks/routes'
import type { RouteListParams, RouteWritePayload } from '@/types/routes'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function RoutesPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [filters, setFilters] = useState<RouteListParams>({})
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [createApiErrors, setCreateApiErrors] = useState<
    Partial<Record<keyof RouteWritePayload, string>> | undefined
  >()

  const { data, isLoading, isError, refetch } = useRouteList({ ...filters, page })
  const createRoute = useCreateRoute()
  const { data: transportOptions = [], isError: isErrorTransport } = useTransportOptions()
  const { data: warehouseOptions = [], isError: isErrorWarehouses } = useWarehouseOptions()

  function handleFiltersChange(nextFilters: RouteListParams) {
    setFilters(nextFilters)
    setPage(1)
  }

  function handleEdit(id: number) {
    router.push(`/routes/${id}`)
  }

  function handleCreateSubmit(payload: RouteWritePayload) {
    setCreateApiErrors(undefined)
    createRoute.mutate(payload, {
      onSuccess: () => {
        setCreateOpen(false)
        setCreateApiErrors(undefined)
      },
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const responseData = err.response.data as Record<string, string | string[]>
          setCreateApiErrors(
            Object.fromEntries(
              Object.entries(responseData).map(([k, v]) => [
                k,
                Array.isArray(v) ? v[0] : v,
              ])
            ) as Partial<Record<keyof RouteWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'routes', 'view')) return <AccessDenied />

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rutas</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de rutas de entrega
          </p>
        </div>
        {canAccessModule(user, 'routes', 'add') && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Nueva ruta
          </Button>
        )}
      </div>

      <div className="hidden lg:block">
        <RouteFilters
          filters={filters}
          onChange={handleFiltersChange}
          transportOptions={transportOptions}
          warehouseOptions={warehouseOptions}
          isErrorTransport={isErrorTransport}
          isErrorWarehouses={isErrorWarehouses}
        />
      </div>
      <div className="lg:hidden">
        <MobileFilterSheet
          activeCount={[
            filters.search,
            filters.status,
            filters.transport !== undefined ? 'set' : undefined,
            filters.origin_warehouse !== undefined ? 'set' : undefined,
          ].filter(Boolean).length}
        >
          <RouteFilters
            filters={filters}
            onChange={handleFiltersChange}
            transportOptions={transportOptions}
            warehouseOptions={warehouseOptions}
            isErrorTransport={isErrorTransport}
            isErrorWarehouses={isErrorWarehouses}
            layout="col"
          />
        </MobileFilterSheet>
      </div>

      {isError && (
        <QueryError message="Error al cargar las rutas." onRetry={refetch} />
      )}

      <RoutesTable
        data={data?.results ?? []}
        total={data?.count ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        hasActiveFilters={Object.entries(filters).some(([k, v]) => k !== 'page' && k !== 'ordering' && v !== undefined)}
        onClearFilters={() => handleFiltersChange({})}
        onEdit={handleEdit}
      />

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nueva ruta</SheetTitle>
          </SheetHeader>
          <RouteForm
            mode="create"
            onSubmit={handleCreateSubmit}
            isSubmitting={createRoute.isPending}
            transportOptions={transportOptions}
            warehouseOptions={warehouseOptions}
            isErrorTransport={isErrorTransport}
            isErrorWarehouses={isErrorWarehouses}
            apiErrors={createApiErrors}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
