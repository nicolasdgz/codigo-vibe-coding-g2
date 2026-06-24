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
import { TransportFilters } from '@/components/transport/TransportFilters'
import { TransportsTable } from '@/components/transport/TransportsTable'
import { MobileFilterSheet } from '@/components/ui/mobile-filter-sheet'
import { TransportForm } from '@/components/transport/TransportForm'
import { TransportDeleteDialog } from '@/components/transport/TransportDeleteDialog'
import {
  useTransportList,
  useCreateTransport,
  useDriverOptions,
} from '@/hooks/transport'
import type { Transport, TransportListParams, TransportWritePayload } from '@/types/transport'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function TransportPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [filters, setFilters] = useState<TransportListParams>({})
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transport | null>(null)
  const [createApiErrors, setCreateApiErrors] = useState<
    Partial<Record<keyof TransportWritePayload, string>> | undefined
  >()

  const { data, isLoading, isError, refetch } = useTransportList({ ...filters, page })
  const createTransport = useCreateTransport()
  const {
    data: driverOptions = [],
    isError: isErrorDrivers,
  } = useDriverOptions()

  function handleFiltersChange(nextFilters: TransportListParams) {
    setFilters(nextFilters)
    setPage(1)
  }

  function handleEdit(id: number) {
    router.push(`/transport/${id}`)
  }

  function handleCreateSubmit(payload: TransportWritePayload) {
    setCreateApiErrors(undefined)
    createTransport.mutate(payload, {
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
            ) as Partial<Record<keyof TransportWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'transport', 'view')) return <AccessDenied />

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transporte</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de la flota de vehículos
          </p>
        </div>
        {canAccessModule(user, 'transport', 'add') && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Nuevo vehículo
          </Button>
        )}
      </div>

      <div className="hidden lg:block">
        <TransportFilters
          filters={filters}
          onChange={handleFiltersChange}
          driverOptions={driverOptions}
          isErrorDrivers={isErrorDrivers}
        />
      </div>
      <div className="lg:hidden">
        <MobileFilterSheet
          activeCount={[
            filters.search,
            filters.vehicle_type,
            filters.is_active !== undefined ? 'set' : undefined,
            filters.driver !== undefined ? 'set' : undefined,
          ].filter(Boolean).length}
        >
          <TransportFilters
            filters={filters}
            onChange={handleFiltersChange}
            driverOptions={driverOptions}
            isErrorDrivers={isErrorDrivers}
            layout="col"
          />
        </MobileFilterSheet>
      </div>

      {isError && (
        <QueryError message="Error al cargar los vehículos." onRetry={refetch} />
      )}

      <TransportsTable
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
            <SheetTitle>Nuevo vehículo</SheetTitle>
          </SheetHeader>
          <TransportForm
            mode="create"
            onSubmit={handleCreateSubmit}
            isSubmitting={createTransport.isPending}
            driverOptions={driverOptions}
            isErrorDrivers={isErrorDrivers}
            apiErrors={createApiErrors}
          />
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <TransportDeleteDialog
          transportId={deleteTarget.id}
          plateNumber={deleteTarget.plate_number}
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
