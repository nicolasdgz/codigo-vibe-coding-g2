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
import { DatePicker } from '@/components/ui/date-picker'
import type {
  ShipmentWritePayload,
  CustomerSummary,
  WarehouseSummary,
  RouteSummary,
} from '@/types/shipments'

const shipmentSchema = z.object({
  customer_id: z.string(),
  origin_warehouse_id: z.string().min(1, 'El almacén de origen es obligatorio'),
  destination_address: z.string().min(1, 'La dirección de destino es obligatoria'),
  destination_city: z.string().min(1, 'La ciudad de destino es obligatoria'),
  destination_country: z.string().min(1, 'El país de destino es obligatorio'),
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled', 'returned']),
  route_id: z.string(),
  estimated_delivery: z.string().optional(),
  calculated_cost: z.string().min(1, 'El costo calculado es obligatorio'),
  notes: z.string().optional(),
})

type ShipmentFormValues = z.infer<typeof shipmentSchema>

interface ShipmentFormProps {
  defaultValues?: Partial<ShipmentWritePayload>
  currentCustomer?: CustomerSummary | null
  currentOriginWarehouse?: WarehouseSummary | null
  currentRoute?: RouteSummary | null
  onSubmit: (data: ShipmentWritePayload) => void
  isSubmitting: boolean
  mode: 'create' | 'edit'
  customerOptions: CustomerSummary[]
  warehouseOptions: WarehouseSummary[]
  routeOptions: RouteSummary[]
  isErrorCustomers: boolean
  isErrorWarehouses: boolean
  isErrorRoutes: boolean
  apiErrors?: Record<string, string[]>
}

export function ShipmentForm({
  defaultValues,
  currentCustomer,
  currentOriginWarehouse,
  currentRoute,
  onSubmit,
  isSubmitting,
  customerOptions,
  warehouseOptions,
  routeOptions,
  isErrorCustomers,
  isErrorWarehouses,
  isErrorRoutes,
  apiErrors,
}: ShipmentFormProps) {
  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      customer_id:
        defaultValues?.customer != null ? String(defaultValues.customer) : 'none',
      origin_warehouse_id:
        defaultValues?.origin_warehouse != null
          ? String(defaultValues.origin_warehouse)
          : '',
      destination_address: defaultValues?.destination_address ?? '',
      destination_city: defaultValues?.destination_city ?? '',
      destination_country: defaultValues?.destination_country ?? '',
      status: defaultValues?.status ?? 'pending',
      route_id:
        defaultValues?.route != null ? String(defaultValues.route) : 'none',
      estimated_delivery: defaultValues?.estimated_delivery ?? '',
      calculated_cost: defaultValues?.calculated_cost ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  const allCustomerOptions = useMemo(() => {
    if (!currentCustomer) return customerOptions
    const ids = new Set(customerOptions.map((c) => c.id))
    return ids.has(currentCustomer.id) ? customerOptions : [currentCustomer, ...customerOptions]
  }, [currentCustomer, customerOptions])

  const allWarehouseOptions = useMemo(() => {
    if (!currentOriginWarehouse) return warehouseOptions
    const ids = new Set(warehouseOptions.map((w) => w.id))
    return ids.has(currentOriginWarehouse.id) ? warehouseOptions : [currentOriginWarehouse, ...warehouseOptions]
  }, [currentOriginWarehouse, warehouseOptions])

  const allRouteOptions = useMemo(() => {
    if (!currentRoute) return routeOptions
    const ids = new Set(routeOptions.map((r) => r.id))
    return ids.has(currentRoute.id) ? routeOptions : [currentRoute, ...routeOptions]
  }, [currentRoute, routeOptions])

  useEffect(() => {
    if (!apiErrors) return
    const fieldMap: Record<string, keyof ShipmentFormValues> = {
      customer: 'customer_id',
      origin_warehouse: 'origin_warehouse_id',
      route: 'route_id',
    }
    let firstField: string | undefined
    Object.entries(apiErrors).forEach(([field, messages]) => {
      const formField = (fieldMap[field] ?? field) as keyof ShipmentFormValues
      const msg = Array.isArray(messages) ? messages[0] : messages
      if (msg) {
        form.setError(formField, { message: msg })
        if (!firstField) firstField = formField as string
      }
    })
    if (firstField) form.setFocus(firstField as any)
  }, [apiErrors, form])

  function handleSubmit(values: ShipmentFormValues) {
    onSubmit({
      customer: values.customer_id === 'none' ? null : Number(values.customer_id),
      origin_warehouse: Number(values.origin_warehouse_id),
      destination_address: values.destination_address,
      destination_city: values.destination_city,
      destination_country: values.destination_country,
      status: values.status,
      route: values.route_id === 'none' ? null : Number(values.route_id),
      estimated_delivery: values.estimated_delivery || null,
      calculated_cost: values.calculated_cost,
      notes: values.notes || null,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4">
        {/* Customer */}
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isErrorCustomers}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isErrorCustomers ? 'Error al cargar' : 'Sin cliente'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {allCustomerOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isErrorCustomers && (
                <p className="text-sm text-destructive">
                  No se pudieron cargar los clientes.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Origin Warehouse */}
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

        {/* Destination Address */}
        <FormField
          control={form.control}
          name="destination_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección de destino</FormLabel>
              <FormControl>
                <Input placeholder="Av. Corrientes 1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Destination City */}
        <FormField
          control={form.control}
          name="destination_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad de destino</FormLabel>
              <FormControl>
                <Input placeholder="Buenos Aires" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Destination Country */}
        <FormField
          control={form.control}
          name="destination_country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País de destino</FormLabel>
              <FormControl>
                <Input placeholder="Argentina" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
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
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_transit">En tránsito</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="returned">Devuelto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Route */}
        <FormField
          control={form.control}
          name="route_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruta</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isErrorRoutes}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isErrorRoutes ? 'Error al cargar' : 'Sin ruta'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin ruta</SelectItem>
                  {allRouteOptions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isErrorRoutes && (
                <p className="text-sm text-destructive">
                  No se pudieron cargar las rutas.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estimated Delivery */}
        <FormField
          control={form.control}
          name="estimated_delivery"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entrega estimada (opcional)</FormLabel>
              <DatePicker value={field.value ?? ''} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Calculated Cost */}
        <FormField
          control={form.control}
          name="calculated_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costo calculado</FormLabel>
              <p className="text-xs text-muted-foreground -mt-1">
                Ingresá el costo total del envío en la moneda local. El peso total se calcula automáticamente desde los ítems.
              </p>
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

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <textarea
                  placeholder="Observaciones sobre el envío..."
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                />
              </FormControl>
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
