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
import type { SupplierWritePayload } from '@/types/suppliers'

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().min(1, 'El email es obligatorio').email('Debe ser un email válido'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
  address: z.string().min(1, 'La dirección es obligatoria'),
  tax_id: z.string().min(1, 'El RUC es obligatorio'),
  contact_name: z.string().min(1, 'El nombre de contacto es obligatorio'),
  is_active: z.boolean(),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

interface SupplierFormProps {
  defaultValues?: Partial<SupplierWritePayload>
  onSubmit: (data: SupplierWritePayload) => void
  isSubmitting: boolean
  apiErrors?: Partial<Record<keyof SupplierWritePayload, string>>
}

export function SupplierForm({ defaultValues, onSubmit, isSubmitting, apiErrors }: SupplierFormProps) {
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
      tax_id: defaultValues?.tax_id ?? '',
      contact_name: defaultValues?.contact_name ?? '',
      is_active: defaultValues?.is_active ?? true,
    },
  })

  useEffect(() => {
    if (!apiErrors) return
    let firstField: string | undefined
    ;(Object.keys(apiErrors) as Array<keyof SupplierWritePayload>).forEach((field) => {
      const msg = apiErrors[field]
      if (msg) {
        form.setError(field, { message: msg })
        if (!firstField) firstField = field as string
      }
    })
    if (firstField) form.setFocus(firstField as any)
  }, [apiErrors, form])

  function handleSubmit(values: SupplierFormValues) {
    onSubmit({
      name: values.name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      tax_id: values.tax_id,
      contact_name: values.contact_name,
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
                <Input placeholder="Nombre del proveedor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@proveedor.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+54 11 1234-5678" {...field} />
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
          name="tax_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RUC</FormLabel>
              <FormControl>
                <Input placeholder="20123456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de contacto</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del representante" {...field} />
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
