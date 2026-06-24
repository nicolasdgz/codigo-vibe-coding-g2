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
import type { WarehouseWritePayload } from '@/types/warehouses'

const warehouseSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  address: z.string().min(1, 'La dirección es obligatoria'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  country: z.string().min(1, 'El país es obligatorio'),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  capacity: z.coerce.number().int().min(0, 'La capacidad debe ser mayor o igual a 0'),
  is_active: z.boolean(),
})

type WarehouseFormValues = z.infer<typeof warehouseSchema>

interface WarehouseFormProps {
  defaultValues?: Partial<WarehouseWritePayload>
  onSubmit: (data: WarehouseWritePayload) => void
  isSubmitting: boolean
  apiErrors?: Partial<Record<keyof WarehouseWritePayload, string>>
}

export function WarehouseForm({ defaultValues, onSubmit, isSubmitting, apiErrors }: WarehouseFormProps) {
  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      country: defaultValues?.country ?? '',
      latitude: defaultValues?.latitude ?? null,
      longitude: defaultValues?.longitude ?? null,
      capacity: defaultValues?.capacity ?? 0,
      is_active: defaultValues?.is_active ?? true,
    },
  })

  useEffect(() => {
    if (!apiErrors) return
    let firstField: string | undefined
    ;(Object.keys(apiErrors) as Array<keyof WarehouseWritePayload>).forEach((field) => {
      const msg = apiErrors[field]
      if (msg) {
        form.setError(field, { message: msg })
        if (!firstField) firstField = field as string
      }
    })
    if (firstField) form.setFocus(firstField as any)
  }, [apiErrors, form])

  function handleSubmit(values: WarehouseFormValues) {
    onSubmit({
      name: values.name,
      address: values.address,
      city: values.city,
      country: values.country,
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
      capacity: values.capacity,
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
                <Input placeholder="Nombre del almacén" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Calle y número" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <FormControl>
                <Input placeholder="Ciudad" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <Input placeholder="País" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitud (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: 4.729886"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitud (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: -74.046543"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad</FormLabel>
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
