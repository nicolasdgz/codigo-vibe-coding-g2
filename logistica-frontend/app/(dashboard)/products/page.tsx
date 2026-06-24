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
import { ProductFilters } from '@/components/products/ProductFilters'
import { ProductsTable } from '@/components/products/ProductsTable'
import { MobileFilterSheet } from '@/components/ui/mobile-filter-sheet'
import { ProductForm } from '@/components/products/ProductForm'
import { ProductDeleteDialog } from '@/components/products/ProductDeleteDialog'
import {
  useProducts,
  useCreateProduct,
  useSupplierOptions,
  useWarehouseOptions,
} from '@/hooks/products'
import type { Product, ProductListParams, ProductWritePayload } from '@/types/products'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function ProductsPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [filters, setFilters] = useState<ProductListParams>({})
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [createApiErrors, setCreateApiErrors] = useState<
    Partial<Record<keyof ProductWritePayload, string>> | undefined
  >()

  const { data, isLoading, isError, refetch } = useProducts({ ...filters, page })
  const createProduct = useCreateProduct()
  const { data: supplierOptions = [], isLoading: isLoadingSuppliers, isError: isErrorSuppliers } = useSupplierOptions()
  const { data: warehouseOptions = [], isLoading: isLoadingWarehouses, isError: isErrorWarehouses } = useWarehouseOptions()

  function handleFiltersChange(nextFilters: ProductListParams) {
    setFilters(nextFilters)
    setPage(1)
  }

  function handleEdit(id: number) {
    router.push(`/products/${id}`)
  }

  function handleCreateSubmit(payload: ProductWritePayload) {
    setCreateApiErrors(undefined)
    createProduct.mutate(payload, {
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
            ) as Partial<Record<keyof ProductWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'products', 'view')) return <AccessDenied />

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de productos del sistema logístico
          </p>
        </div>
        {canAccessModule(user, 'products', 'add') && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Nuevo producto
          </Button>
        )}
      </div>

      <div className="hidden lg:block">
        <ProductFilters
          filters={filters}
          onChange={handleFiltersChange}
          supplierOptions={supplierOptions}
          warehouseOptions={warehouseOptions}
          isLoadingSuppliers={isLoadingSuppliers}
          isLoadingWarehouses={isLoadingWarehouses}
          isErrorSuppliers={isErrorSuppliers}
          isErrorWarehouses={isErrorWarehouses}
        />
      </div>
      <div className="lg:hidden">
        <MobileFilterSheet
          activeCount={[
            filters.search,
            filters.supplier !== undefined ? 'set' : undefined,
            filters.warehouse !== undefined ? 'set' : undefined,
            filters.is_active !== undefined ? 'set' : undefined,
          ].filter(Boolean).length}
        >
          <ProductFilters
            filters={filters}
            onChange={handleFiltersChange}
            supplierOptions={supplierOptions}
            warehouseOptions={warehouseOptions}
            isLoadingSuppliers={isLoadingSuppliers}
            isLoadingWarehouses={isLoadingWarehouses}
            isErrorSuppliers={isErrorSuppliers}
            isErrorWarehouses={isErrorWarehouses}
            layout="col"
          />
        </MobileFilterSheet>
      </div>

      {isError && (
        <QueryError message="Error al cargar los productos." onRetry={refetch} />
      )}

      <ProductsTable
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
            <SheetTitle>Nuevo producto</SheetTitle>
          </SheetHeader>
          <ProductForm
            onSubmit={handleCreateSubmit}
            isSubmitting={createProduct.isPending}
            supplierOptions={supplierOptions}
            warehouseOptions={warehouseOptions}
            apiErrors={createApiErrors}
            isErrorSuppliers={isErrorSuppliers}
            isErrorWarehouses={isErrorWarehouses}
          />
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <ProductDeleteDialog
          productId={deleteTarget.id}
          productName={deleteTarget.name}
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
