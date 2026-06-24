'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCreateShipmentItem } from '@/hooks/shipments'
import type { ProductSummary } from '@/types/shipments'

const itemSchema = z.object({
  product_id: z.string().min(1, 'El producto es obligatorio'),
  quantity: z
    .number({ error: 'La cantidad debe ser un número' })
    .int('Debe ser un número entero')
    .min(1, 'La cantidad mínima es 1'),
  unit_price: z.string().optional(),
})

type ItemFormValues = z.infer<typeof itemSchema>

interface ShipmentItemFormProps {
  shipmentId: number
  productOptions: ProductSummary[]
  isErrorProducts: boolean
  onSuccess: () => void
}

export function ShipmentItemForm({
  shipmentId,
  productOptions,
  isErrorProducts,
  onSuccess,
}: ShipmentItemFormProps) {
  const createItem = useCreateShipmentItem()

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      product_id: '',
      quantity: 1,
      unit_price: '',
    },
  })

  function handleSubmit(values: ItemFormValues) {
    createItem.mutate(
      {
        shipmentId,
        payload: {
          product: Number(values.product_id),
          quantity: values.quantity,
          ...(values.unit_price ? { unit_price: values.unit_price } : {}),
        },
      },
      {
        onSuccess: () => {
          form.reset()
          onSuccess()
        },
      }
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-3 rounded-lg border p-4"
      >
        <p className="text-sm font-medium">Agregar item</p>

        {/* Product */}
        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isErrorProducts}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isErrorProducts ? 'Error al cargar' : 'Seleccionar producto'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productOptions.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} — {p.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isErrorProducts && (
                <p className="text-sm text-destructive">
                  No se pudieron cargar los productos.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unit Price (optional) */}
          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio unitario (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={createItem.isPending} size="sm">
          {createItem.isPending ? 'Agregando...' : 'Agregar item'}
        </Button>
      </form>
    </Form>
  )
}
