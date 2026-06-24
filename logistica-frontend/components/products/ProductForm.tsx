'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import type { ProductWritePayload, SupplierSummary, WarehouseSummary } from '@/types/products'

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().nullable().optional(),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  weight_kg: z.string().min(1, 'El peso es obligatorio'),
  dimensions: z.string().nullable().optional(),
  unit_price: z.string().min(1, 'El precio unitario es obligatorio'),
  stock: z.number().int('El stock debe ser un número entero').min(0, 'El stock no puede ser negativo'),
  // FK selects — stored as string in form, parsed to number on submit
  supplier_id: z.string().min(1, 'El proveedor es obligatorio'),
  warehouse_id: z.string().min(1, 'El almacén es obligatorio'),
  is_active: z.boolean(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  defaultValues?: Partial<ProductWritePayload>
  onSubmit: (data: ProductWritePayload) => void
  isSubmitting: boolean
  supplierOptions: SupplierSummary[]
  warehouseOptions: WarehouseSummary[]
  apiErrors?: Partial<Record<keyof ProductWritePayload, string>>
  isErrorSuppliers?: boolean
  isErrorWarehouses?: boolean
}

export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  supplierOptions,
  warehouseOptions,
  apiErrors,
  isErrorSuppliers = false,
  isErrorWarehouses = false,
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      sku: defaultValues?.sku ?? '',
      weight_kg: defaultValues?.weight_kg ?? '',
      dimensions: defaultValues?.dimensions ?? '',
      unit_price: defaultValues?.unit_price ?? '',
      stock: defaultValues?.stock ?? 0,
      supplier_id: defaultValues?.supplier ? String(defaultValues.supplier) : '',
      warehouse_id: defaultValues?.warehouse ? String(defaultValues.warehouse) : '',
      is_active: defaultValues?.is_active ?? true,
    },
  })

  useEffect(() => {
    if (!apiErrors) return
    let firstField: string | undefined
    ;(Object.keys(apiErrors) as Array<keyof ProductWritePayload>).forEach((field) => {
      const msg = apiErrors[field]
      if (!msg) return
      let formField: string
      if (field === 'supplier') {
        formField = 'supplier_id'
        form.setError('supplier_id', { message: msg })
      } else if (field === 'warehouse') {
        formField = 'warehouse_id'
        form.setError('warehouse_id', { message: msg })
      } else if (field === 'stock') {
        formField = 'stock'
        form.setError('stock', { message: msg })
      } else {
        formField = field as string
        form.setError(field as keyof ProductFormValues, { message: msg })
      }
      if (!firstField) firstField = formField
    })
    if (firstField) form.setFocus(firstField as any)
  }, [apiErrors, form])

  function handleSubmit(values: ProductFormValues) {
    onSubmit({
      name: values.name,
      description: values.description ?? null,
      sku: values.sku,
      weight_kg: values.weight_kg,
      dimensions: values.dimensions ?? null,
      unit_price: values.unit_price,
      stock: values.stock,
      supplier: Number(values.supplier_id),
      warehouse: Number(values.warehouse_id),
      is_active: values.is_active,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del producto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="SKU-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Descripción del producto"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weight_kg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso (kg)</FormLabel>
              <FormControl>
                <Input placeholder="1.50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dimensions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dimensiones (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="10x20x5 cm"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio unitario</FormLabel>
              <FormControl>
                <Input placeholder="99.99" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supplier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isErrorSuppliers}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isErrorSuppliers ? 'Error al cargar proveedores' : 'Seleccionar proveedor'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {supplierOptions.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isErrorSuppliers && (
                <p className="text-sm text-destructive">No se pudieron cargar los proveedores.</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="warehouse_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isErrorWarehouses}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isErrorWarehouses ? 'Error al cargar almacenes' : 'Seleccionar almacén'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouseOptions.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name} — {w.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isErrorWarehouses && (
                <p className="text-sm text-destructive">No se pudieron cargar los almacenes.</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'true')}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Form>
  )
}
