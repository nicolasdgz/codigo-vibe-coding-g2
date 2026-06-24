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
import { ShipmentFilters } from '@/components/shipments/ShipmentFilters'
import { ShipmentsTable } from '@/components/shipments/ShipmentsTable'
import { MobileFilterSheet } from '@/components/ui/mobile-filter-sheet'
import { ShipmentForm } from '@/components/shipments/ShipmentForm'
import {
  useShipmentList,
  useCreateShipment,
  useCustomerOptions,
  useWarehouseOptions,
  useRouteOptions,
} from '@/hooks/shipments'
import type { ShipmentListParams, ShipmentWritePayload } from '@/types/shipments'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function ShipmentsPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [filters, setFilters] = useState<ShipmentListParams>({})
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [createApiErrors, setCreateApiErrors] = useState<
    Record<string, string[]> | undefined
  >()

  const { data, isLoading, isError, refetch } = useShipmentList({ ...filters, page })
  const createShipment = useCreateShipment()

  const { data: customerOptions = [], isError: isErrorCustomers } = useCustomerOptions()
  const { data: warehouseOptions = [], isError: isErrorWarehouses } = useWarehouseOptions()
  const { data: routeOptions = [], isError: isErrorRoutes } = useRouteOptions()

  function handleFiltersChange(nextFilters: ShipmentListParams) {
    setFilters(nextFilters)
    setPage(1)
  }

  function handleEdit(id: number) {
    router.push(`/shipments/${id}`)
  }

  function handleCreateSubmit(payload: ShipmentWritePayload) {
    setCreateApiErrors(undefined)
    createShipment.mutate(payload, {
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
                Array.isArray(v) ? v : [v],
              ])
            ) as Record<string, string[]>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'shipments', 'view')) return <AccessDenied />

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Envíos</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de envíos del sistema logístico
          </p>
        </div>
        {canAccessModule(user, 'shipments', 'add') && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Nuevo envío
          </Button>
        )}
      </div>

      <div className="hidden lg:block">
        <ShipmentFilters
          filters={filters}
          onChange={handleFiltersChange}
          customerOptions={customerOptions}
          warehouseOptions={warehouseOptions}
          routeOptions={routeOptions}
          isErrorCustomers={isErrorCustomers}
          isErrorWarehouses={isErrorWarehouses}
          isErrorRoutes={isErrorRoutes}
        />
      </div>
      <div className="lg:hidden">
        <MobileFilterSheet
          activeCount={[
            filters.search,
            filters.status,
            filters.customer !== undefined ? 'set' : undefined,
            filters.origin_warehouse !== undefined ? 'set' : undefined,
            filters.route !== undefined ? 'set' : undefined,
          ].filter(Boolean).length}
        >
          <ShipmentFilters
            filters={filters}
            onChange={handleFiltersChange}
            customerOptions={customerOptions}
            warehouseOptions={warehouseOptions}
            routeOptions={routeOptions}
            isErrorCustomers={isErrorCustomers}
            isErrorWarehouses={isErrorWarehouses}
            isErrorRoutes={isErrorRoutes}
            layout="col"
          />
        </MobileFilterSheet>
      </div>

      {isError && (
        <QueryError message="Error al cargar los envíos." onRetry={refetch} />
      )}

      <ShipmentsTable
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
            <SheetTitle>Nuevo envío</SheetTitle>
          </SheetHeader>
          <ShipmentForm
            mode="create"
            onSubmit={handleCreateSubmit}
            isSubmitting={createShipment.isPending}
            customerOptions={customerOptions}
            warehouseOptions={warehouseOptions}
            routeOptions={routeOptions}
            isErrorCustomers={isErrorCustomers}
            isErrorWarehouses={isErrorWarehouses}
            isErrorRoutes={isErrorRoutes}
            apiErrors={createApiErrors}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
