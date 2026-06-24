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
import type { Group, UserWritePayload, UserUpdatePayload } from '@/types/users'

const createSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  is_staff: z.boolean(),
  groups: z.array(z.number()),
})

const editSchema = z.object({
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  is_active: z.boolean(),
  is_staff: z.boolean(),
  groups: z.array(z.number()),
})

type CreateFormValues = z.infer<typeof createSchema>
type EditFormValues = z.infer<typeof editSchema>

interface UserFormCreateProps {
  mode: 'create'
  groups: Group[]
  onSubmit: (data: UserWritePayload) => void
  isSubmitting: boolean
  apiErrors?: Partial<Record<string, string>>
}

interface UserFormEditProps {
  mode: 'edit'
  groups: Group[]
  defaultValues: UserUpdatePayload & { email?: string; is_active?: boolean }
  currentGroupNames: string[]
  onSubmit: (data: UserUpdatePayload) => void
  isSubmitting: boolean
  apiErrors?: Partial<Record<string, string>>
}

type UserFormProps = UserFormCreateProps | UserFormEditProps

export function UserForm(props: UserFormProps) {
  if (props.mode === 'create') {
    return <CreateForm {...props} />
  }
  return <EditForm {...props} />
}

function CreateForm({ groups, onSubmit, isSubmitting, apiErrors }: UserFormCreateProps) {
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: '', password: '', email: '', is_staff: false, groups: [] },
  })

  useEffect(() => {
    if (!apiErrors) return
    let firstField: string | undefined
    Object.entries(apiErrors).forEach(([field, msg]) => {
      if (msg) {
        form.setError(field as keyof CreateFormValues, { message: msg })
        if (!firstField) firstField = field
      }
    })
    if (firstField) form.setFocus(firstField as any)
  }, [apiErrors, form])

  function handleSubmit(values: CreateFormValues) {
    onSubmit({
      username: values.username,
      password: values.password,
      email: values.email || undefined,
      is_staff: values.is_staff,
      groups: values.groups,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input placeholder="nombre_usuario" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...field} />
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
              <FormLabel>Email (opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_staff"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === 'true')}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="false">Usuario</SelectItem>
                  <SelectItem value="true">Staff</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <GroupsCheckboxField groups={groups} form={form} />

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? 'Creando...' : 'Crear usuario'}
        </Button>
      </form>
    </Form>
  )
}

function EditForm({ groups, defaultValues, currentGroupNames, onSubmit, isSubmitting, apiErrors }: UserFormEditProps) {
  const initialGroupIds = groups
    .filter((g) => currentGroupNames.includes(g.name))
    .map((g) => g.id)

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      email: defaultValues.email ?? '',
      is_active: defaultValues.is_active ?? true,
      is_staff: defaultValues.is_staff ?? false,
      groups: initialGroupIds,
    },
  })

  useEffect(() => {
    if (!apiErrors) return
    let firstField: string | undefined
    Object.entries(apiErrors).forEach(([field, msg]) => {
      if (msg) {
        form.setError(field as keyof EditFormValues, { message: msg })
        if (!firstField) firstField = field
      }
    })
    if (firstField) form.setFocus(firstField as any)
  }, [apiErrors, form])

  function handleSubmit(values: EditFormValues) {
    onSubmit({
      email: values.email || undefined,
      is_active: values.is_active,
      is_staff: values.is_staff,
      groups: values.groups,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_staff"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === 'true')}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="false">Usuario</SelectItem>
                  <SelectItem value="true">Staff</SelectItem>
                </SelectContent>
              </Select>
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
                onValueChange={(v) => field.onChange(v === 'true')}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
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

        <GroupsCheckboxField groups={groups} form={form} />

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </Form>
  )
}

function GroupsCheckboxField({
  groups,
  form,
}: {
  groups: Group[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: ReturnType<typeof useForm<any>>
}) {
  const selectedIds: number[] = form.watch('groups') ?? []

  function toggle(id: number) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((g) => g !== id)
      : [...selectedIds, id]
    form.setValue('groups', next, { shouldValidate: true })
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium leading-none">Roles</span>
      <div className="flex flex-col gap-2">
        {groups.map((group) => (
          <label
            key={group.id}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-primary"
              checked={selectedIds.includes(group.id)}
              onChange={() => toggle(group.id)}
            />
            <span className="text-sm">{group.name}</span>
          </label>
        ))}
        {groups.length === 0 && (
          <span className="text-sm text-muted-foreground">No hay roles disponibles</span>
        )}
      </div>
    </div>
  )
}
