'use client'

import { useEffect, useMemo } from 'react'
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
import type {
  RouteWritePayload,
  TransportSummary,
  WarehouseSummary,
} from '@/types/routes'
import { DatePicker } from '@/components/ui/date-picker'

const routeSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  origin_warehouse_id: z.string().min(1, 'El almacén de origen es obligatorio'),
  transport_id: z.string(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
  scheduled_date: z.string().min(1, 'La fecha programada es obligatoria'),
})

type RouteFormValues = z.infer<typeof routeSchema>

interface RouteFormProps {
  defaultValues?: Partial<RouteWritePayload>
  currentTransport?: TransportSummary | null
  currentOriginWarehouse?: WarehouseSummary
  onSubmit: (data: RouteWritePayload) => void
  isSubmitting: boolean
  mode: 'create' | 'edit'
  transportOptions: TransportSummary[]
  warehouseOptions: WarehouseSummary[]
  isErrorTransport: boolean
  isErrorWarehouses: boolean
  apiErrors?: Partial<Record<keyof RouteWritePayload, string>>
}

export function RouteForm({
  defaultValues,
  currentTransport,
  currentOriginWarehouse,
  onSubmit,
  isSubmitting,
  transportOptions,
  warehouseOptions,
  isErrorTransport,
  isErrorWarehouses,
  apiErrors,
}: RouteFormProps) {
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      origin_warehouse_id:
        defaultValues?.origin_warehouse != null
          ? String(defaultValues.origin_warehouse)
          : '',
      transport_id:
        defaultValues?.transport != null ? String(defaultValues.transport) : 'none',
      status: defaultValues?.status ?? 'planned',
      scheduled_date: defaultValues?.scheduled_date ?? '',
    },
  })


  const allTransportOptions = useMemo(() => {
    if (!currentTransport) return transportOptions
    const ids = new Set(transportOptions.map((t) => t.id))
    return ids.has(currentTransport.id) ? transportOptions : [currentTransport, ...transportOptions]
  }, [currentTransport, transportOptions])

  const allWarehouseOptions = useMemo(() => {
    if (!currentOriginWarehouse) return warehouseOptions
    const ids = new Set(warehouseOptions.map((w) => w.id))
    return ids.has(currentOriginWarehouse.id) ? warehouseOptions : [currentOriginWarehouse, ...warehouseOptions]
  }, [currentOriginWarehouse, warehouseOptions])

  useEffect(() => {
    if (!apiErrors) return
    let firstField: string | undefined
    ;(Object.keys(apiErrors) as Array<keyof RouteWritePayload>).forEach((field) => {
      const msg = apiErrors[field]
      if (!msg) return
      let formField: string
      if (field === 'origin_warehouse') {
        formField = 'origin_warehouse_id'
        form.setError('origin_warehouse_id', { message: msg })
      } else if (field === 'transport') {
        formField = 'transport_id'
        form.setError('transport_id', { message: msg })
      } else {
        formField = field as string
        form.setError(field as keyof RouteFormValues, { message: msg })
      }
      if (!firstField) firstField = formField
    })
    if (firstField) form.setFocus(firstField as any)
  }, [apiErrors, form])

  function handleSubmit(values: RouteFormValues) {
    onSubmit({
      name: values.name,
      origin_warehouse: Number(values.origin_warehouse_id),
      transport: values.transport_id === 'none' ? null : Number(values.transport_id),
      status: values.status,
      scheduled_date: values.scheduled_date,
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
                <Input placeholder="Ruta Norte..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="origin_warehouse_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén de origen</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isErrorWarehouses}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isErrorWarehouses ? 'Error al cargar' : 'Seleccionar almacén'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allWarehouseOptions.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name} — {w.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isErrorWarehouses && (
                <p className="text-sm text-destructive">
                  No se pudieron cargar los almacenes.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="transport_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transporte</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isErrorTransport}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isErrorTransport ? 'Error al cargar' : 'Sin asignar'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {allTransportOptions.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.plate_number} — {t.brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isErrorTransport && (
                <p className="text-sm text-destructive">
                  No se pudieron cargar los transportes.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="planned">Planificada</SelectItem>
                  <SelectItem value="in_progress">En curso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha programada</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} />
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
