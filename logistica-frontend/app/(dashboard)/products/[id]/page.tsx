'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductForm } from '@/components/products/ProductForm'
import { ProductDeleteDialog } from '@/components/products/ProductDeleteDialog'
import {
  useProduct,
  useUpdateProduct,
  useSupplierOptions,
  useWarehouseOptions,
} from '@/hooks/products'
import type { ProductWritePayload } from '@/types/products'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'
import { AccessDenied } from '@/components/layout/access-denied'

export default function ProductDetailPage() {
  const user = useAuthStore((s) => s.user)
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [updateApiErrors, setUpdateApiErrors] = useState<
    Partial<Record<keyof ProductWritePayload, string>> | undefined
  >()

  const { data: product, isLoading, isError } = useProduct(id)
  const updateProduct = useUpdateProduct()
  const { data: supplierOptions = [], isError: isErrorSuppliers } = useSupplierOptions()
  const { data: warehouseOptions = [], isError: isErrorWarehouses } = useWarehouseOptions()

  function handleSubmit(payload: ProductWritePayload) {
    if (!product) return

    const original: ProductWritePayload = {
      name: product.name,
      description: product.description,
      sku: product.sku,
      weight_kg: product.weight_kg,
      dimensions: product.dimensions,
      unit_price: product.unit_price,
      stock: product.stock,
      supplier: product.supplier.id,
      warehouse: product.warehouse.id,
      is_active: product.is_active,
    }

    const changed = (Object.keys(payload) as Array<keyof ProductWritePayload>).reduce(
      (acc, key) => {
        if (payload[key] !== original[key]) (acc as Record<string, unknown>)[key] = payload[key]
        return acc
      },
      {} as Partial<ProductWritePayload>
    )

    if (Object.keys(changed).length === 0) return

    setUpdateApiErrors(undefined)
    updateProduct.mutate({ id, payload: changed }, {
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const responseData = err.response.data as Record<string, string | string[]>
          setUpdateApiErrors(
            Object.fromEntries(
              Object.entries(responseData).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            ) as Partial<Record<keyof ProductWritePayload, string>>
          )
        }
      },
    })
  }

  if (!canAccessModule(user, 'products', 'view')) return <AccessDenied />

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar el producto. El registro puede no existir o no tenés permisos.
        </div>
        <Button variant="outline" onClick={() => router.push('/products')}>
          Volver a productos
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar producto</h1>
          <p className="text-sm text-muted-foreground">{product.name}</p>
        </div>
        {canAccessModule(user, 'products', 'delete') && (
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </Button>
        )}
      </div>

      <div className="max-w-lg">
        <ProductForm
          defaultValues={{
            name: product.name,
            description: product.description,
            sku: product.sku,
            weight_kg: product.weight_kg,
            dimensions: product.dimensions,
            unit_price: product.unit_price,
            stock: product.stock,
            supplier: product.supplier.id,
            warehouse: product.warehouse.id,
            is_active: product.is_active,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateProduct.isPending}
          supplierOptions={supplierOptions}
          warehouseOptions={warehouseOptions}
          apiErrors={updateApiErrors}
          isErrorSuppliers={isErrorSuppliers}
          isErrorWarehouses={isErrorWarehouses}
        />
      </div>

      <ProductDeleteDialog
        productId={product.id}
        productName={product.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push('/products')}
      />
    </div>
  )
}
