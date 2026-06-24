'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCreateRouteStop } from '@/hooks/routes'

const stopSchema = z.object({
  order: z
    .number({ error: 'El orden debe ser un número' })
    .int('Debe ser un número entero')
    .min(1, 'El orden mínimo es 1'),
  address: z.string().min(1, 'La dirección es obligatoria'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  estimated_arrival: z.string().optional(),
})

type StopFormValues = z.infer<typeof stopSchema>

interface RouteStopFormProps {
  routeId: number
  onSuccess: () => void
}

export function RouteStopForm({ routeId, onSuccess }: RouteStopFormProps) {
  const createStop = useCreateRouteStop()

  const form = useForm<StopFormValues>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      order: 1,
      address: '',
      city: '',
      estimated_arrival: '',
    },
  })

  function handleSubmit(values: StopFormValues) {
    createStop.mutate(
      {
        routeId,
        payload: {
          order: values.order,
          address: values.address,
          city: values.city,
          estimated_arrival: values.estimated_arrival || null,
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
        <p className="text-sm font-medium">Agregar parada</p>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden</FormLabel>
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

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Buenos Aires" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Av. Corrientes 1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimated_arrival"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Llegada estimada (opcional)</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createStop.isPending} size="sm">
          {createStop.isPending ? 'Agregando...' : 'Agregar parada'}
        </Button>
      </form>
    </Form>
  )
}
