'use client'

import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShipmentItemForm } from './ShipmentItemForm'
import { useDeleteShipmentItem, useProductOptions } from '@/hooks/shipments'
import type { ShipmentItem } from '@/types/shipments'

interface ShipmentItemListProps {
  shipmentId: number
  items: ShipmentItem[]
  totalWeightKg: string
  isLoading: boolean
}

export function ShipmentItemList({
  shipmentId,
  items,
  totalWeightKg,
  isLoading,
}: ShipmentItemListProps) {
  const deleteItem = useDeleteShipmentItem()
  const {
    data: productOptions = [],
    isError: isErrorProducts,
  } = useProductOptions()

  function handleDeleteItem(itemId: number) {
    deleteItem.mutate({ shipmentId, itemId })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Items del envío</h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay items registrados para este envío.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.product.name}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {item.product.sku}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Cantidad: <span className="text-foreground">{item.quantity}</span></span>
                  <span>Precio unit.: <span className="text-foreground">${item.unit_price}</span></span>
                  <span>Subtotal: <span className="text-foreground">${item.subtotal}</span></span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDeleteItem(item.id)}
                disabled={deleteItem.isPending}
                aria-label="Eliminar item"
                className="text-destructive hover:text-destructive"
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end rounded-lg border bg-muted/30 px-4 py-2 text-sm">
        <span className="text-muted-foreground">Peso total:</span>
        <span className="ml-2 font-semibold">{totalWeightKg} kg</span>
      </div>

      <ShipmentItemForm
        shipmentId={shipmentId}
        productOptions={productOptions}
        isErrorProducts={isErrorProducts}
        onSuccess={() => {}}
      />
    </div>
  )
}
