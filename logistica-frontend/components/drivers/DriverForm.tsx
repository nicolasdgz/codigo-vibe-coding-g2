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
import type { DriverWritePayload, UserSummary } from '@/types/drivers'
import { DatePicker } from '@/components/ui/date-picker'

const driverSchema = z.object({
  user: z.number().int().positive('El ID de usuario debe ser un número positivo'),
  license_number: z.string().min(1, 'El número de licencia es obligatorio'),
  license_expiry: z.string().min(1, 'La fecha de vencimiento es obligatoria'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
  is_available: z.boolean(),
})

const driverEditSchema = z.object({
  license_number: z.string().min(1, 'El número de licencia es obligatorio'),
  license_expiry: z.string().min(1, 'La fecha de vencimiento es obligatoria'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
  is_available: z.boolean(),
})

type DriverCreateFormValues = z.infer<typeof driverSchema>
type DriverEditFormValues = z.infer<typeof driverEditSchema>

interface DriverFormProps {
  defaultValues?: Partial<DriverWritePayload>
  currentUser?: UserSummary
  onSubmit: (data: DriverWritePayload) => void
  isSubmitting: boolean
  mode: 'create' | 'edit'
  apiErrors?: Partial<Record<keyof DriverWritePayload, string>>
}

export function DriverForm({
  defaultValues,
  currentUser,
  onSubmit,
  isSubmitting,
  mode,
  apiErrors,
}: DriverFormProps) {
  const createForm = useForm<DriverCreateFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      user: defaultValues?.user ?? ('' as unknown as number),
      license_number: defaultValues?.license_number ?? '',
      license_expiry: defaultValues?.license_expiry ?? '',
      phone: defaultValues?.phone ?? '',
      is_available: defaultValues?.is_available ?? true,
    },
  })

  const editForm = useForm<DriverEditFormValues>({
    resolver: zodResolver(driverEditSchema),
    defaultValues: {
      license_number: defaultValues?.license_number ?? '',
      license_expiry: defaultValues?.license_expiry ?? '',
      phone: defaultValues?.phone ?? '',
      is_available: defaultValues?.is_available ?? true,
    },
  })

  const form = mode === 'create' ? createForm : editForm

  useEffect(() => {
    if (!apiErrors) return
    let firstField: string | undefined
    ;(Object.keys(apiErrors) as Array<keyof DriverWritePayload>).forEach((field) => {
      const msg = apiErrors[field]
      if (msg) {
        if (mode === 'create') {
          createForm.setError(field as keyof DriverCreateFormValues, { message: msg })
          if (!firstField) firstField = field as string
        } else if (field !== 'user') {
          editForm.setError(field as keyof DriverEditFormValues, { message: msg })
          if (!firstField) firstField = field as string
        }
      }
    })
    if (firstField) form.setFocus(firstField as any)
  }, [apiErrors, createForm, editForm, form, mode])

  function handleCreateSubmit(values: DriverCreateFormValues) {
    onSubmit({
      user: values.user,
      license_number: values.license_number,
      license_expiry: values.license_expiry,
      phone: values.phone,
      is_available: values.is_available,
    })
  }

  function handleEditSubmit(values: DriverEditFormValues) {
    onSubmit({
      user: currentUser?.id ?? 0,
      license_number: values.license_number,
      license_expiry: values.license_expiry,
      phone: values.phone,
      is_available: values.is_available,
    })
  }

  if (mode === 'create') {
    return (
      <Form {...createForm}>
        <form
          onSubmit={createForm.handleSubmit(handleCreateSubmit)}
          className="flex flex-col gap-4 p-4"
        >
          <FormField
            control={createForm.control}
            name="user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User ID</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="ID del usuario existente"
                    {...field}
                    value={field.value === 0 ? '' : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createForm.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de licencia</FormLabel>
                <FormControl>
                  <Input placeholder="Número de licencia de conducir" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createForm.control}
            name="license_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimiento de licencia</FormLabel>
                <DatePicker value={field.value} onChange={field.onChange} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createForm.control}
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
            control={createForm.control}
            name="is_available"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disponibilidad</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'true')}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar disponibilidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Disponible</SelectItem>
                    <SelectItem value="false">No disponible</SelectItem>
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

  // Edit mode
  const fullName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username
    : ''

  return (
    <Form {...editForm}>
      <form
        onSubmit={editForm.handleSubmit(handleEditSubmit)}
        className="flex flex-col gap-4 p-4"
      >
        {currentUser && (
          <div className="rounded-lg border bg-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Usuario vinculado</p>
            <p className="text-sm font-medium">{currentUser.username}</p>
            {fullName && <p className="text-sm text-muted-foreground">{fullName}</p>}
          </div>
        )}

        <FormField
          control={editForm.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de licencia</FormLabel>
              <FormControl>
                <Input placeholder="Número de licencia de conducir" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="license_expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vencimiento de licencia</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
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
          control={editForm.control}
          name="is_available"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disponibilidad</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === 'true')}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar disponibilidad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">Disponible</SelectItem>
                  <SelectItem value="false">No disponible</SelectItem>
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
