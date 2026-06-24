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
import type { TransportWritePayload, DriverSummary } from '@/types/transport'

const transportSchema = z.object({
  plate_number: z.string().min(1, 'La matrícula es obligatoria'),
  vehicle_type: z.enum(['truck', 'van', 'motorcycle', 'car']),
  brand: z.string().min(1, 'La marca es obligatoria'),
  model: z.string().min(1, 'El modelo es obligatorio'),
  year: z
    .number({ error: 'El año debe ser un número' })
    .int('El año debe ser un número entero')
    .min(1900, 'Año inválido')
    .max(new Date().getFullYear() + 1, 'Año inválido'),
  capacity_kg: z.string().min(1, 'La capacidad es obligatoria'),
  capacity_units: z
    .number({ error: 'La capacidad de unidades debe ser un número' })
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo'),
  // driver stored as string in form, parsed on submit; empty string = null
  driver_id: z.string(),
  is_active: z.boolean(),
})

type TransportFormValues = z.infer<typeof transportSchema>

interface TransportFormProps {
  defaultValues?: Partial<TransportWritePayload>
  currentDriver?: DriverSummary | null
  onSubmit: (data: TransportWritePayload) => void
  isSubmitting: boolean
  mode: 'create' | 'edit'
  driverOptions: DriverSummary[]
  isErrorDrivers: boolean
  apiErrors?: Partial<Record<keyof TransportWritePayload, string>>
}

export function TransportForm({
  defaultValues,
  currentDriver,
  onSubmit,
  isSubmitting,
  driverOptions,
  isErrorDrivers,
  apiErrors,
}: TransportFormProps) {
  const form = useForm<TransportFormValues>({
    resolver: zodResolver(transportSchema),
    defaultValues: {
      plate_number: defaultValues?.plate_number ?? '',
      vehicle_type: defaultValues?.vehicle_type ?? 'truck',
      brand: defaultValues?.brand ?? '',
      model: defaultValues?.model ?? '',
      year: defaultValues?.year ?? new Date().getFullYear(),
      capacity_kg: defaultValues?.capacity_kg ?? '',
      capacity_units: defaultValues?.capacity_units ?? 0,
      driver_id:
        defaultValues?.driver != null ? String(defaultValues.driver) : 'none',
      is_active: defaultValues?.is_active ?? true,
    },
  })

  const allDriverOptions = useMemo(() => {
    if (!currentDriver) return driverOptions
    const ids = new Set(driverOptions.map((d) => d.id))
    return ids.has(currentDriver.id) ? driverOptions : [currentDriver, ...driverOptions]
  }, [currentDriver, driverOptions])

  useEffect(() => {
    if (!apiErrors) return
    let firstField: string | undefined
    ;(Object.keys(apiErrors) as Array<keyof TransportWritePayload>).forEach((field) => {
      const msg = apiErrors[field]
      if (!msg) return
      let formField: string
      if (field === 'driver') {
        formField = 'driver_id'
        form.setError('driver_id', { message: msg })
      } else {
        formField = field as string
        form.setError(field as keyof TransportFormValues, { message: msg })
      }
      if (!firstField) firstField = formField
    })
    if (firstField) form.setFocus(firstField as any)
  }, [apiErrors, form])

  function handleSubmit(values: TransportFormValues) {
    onSubmit({
      plate_number: values.plate_number,
      vehicle_type: values.vehicle_type,
      brand: values.brand,
      model: values.model,
      year: values.year,
      capacity_kg: values.capacity_kg,
      capacity_units: values.capacity_units,
      driver: values.driver_id === 'none' ? null : Number(values.driver_id),
      is_active: values.is_active,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4">
        <FormField
          control={form.control}
          name="plate_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <FormControl>
                <Input placeholder="ABC-123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicle_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de vehículo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="truck">Camión</SelectItem>
                  <SelectItem value="van">Furgoneta</SelectItem>
                  <SelectItem value="motorcycle">Moto</SelectItem>
                  <SelectItem value="car">Auto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input placeholder="Mercedes-Benz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Sprinter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Año</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="2024"
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
          name="capacity_kg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (kg)</FormLabel>
              <FormControl>
                <Input placeholder="8000.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity_units"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (unidades)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="100"
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
          name="driver_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conductor</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isErrorDrivers}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isErrorDrivers ? 'Error al cargar' : 'Sin conductor'
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin conductor</SelectItem>
                  {allDriverOptions.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isErrorDrivers && (
                <p className="text-sm text-destructive">
                  No se pudieron cargar los conductores.
                </p>
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
