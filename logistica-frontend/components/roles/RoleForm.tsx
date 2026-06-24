'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ChevronDown, ChevronRight, Search } from 'lucide-react'
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
import type { GroupDetail, GroupWritePayload, Permission } from '@/types/users'

const roleSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  permissions: z.array(z.number()),
})

type RoleFormValues = z.infer<typeof roleSchema>

interface RoleFormProps {
  defaultValues?: GroupDetail
  permissions: Permission[]
  onSubmit: (data: GroupWritePayload) => void
  isSubmitting: boolean
  apiErrors?: Partial<Record<string, string>>
}

export function RoleForm({ defaultValues, permissions, onSubmit, isSubmitting, apiErrors }: RoleFormProps) {
  const [search, setSearch] = useState('')
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set())

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      permissions: defaultValues?.permissions.map((p) => p.id) ?? [],
    },
  })

  const selectedIds: number[] = form.watch('permissions') ?? []

  const grouped = useMemo(() => {
    const filtered = search
      ? permissions.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.codename.toLowerCase().includes(search.toLowerCase()) ||
            p.app_label.toLowerCase().includes(search.toLowerCase())
        )
      : permissions

    return filtered.reduce<Record<string, Permission[]>>((acc, perm) => {
      if (!acc[perm.app_label]) acc[perm.app_label] = []
      acc[perm.app_label].push(perm)
      return acc
    }, {})
  }, [permissions, search])

  function toggleApp(app: string) {
    setExpandedApps((prev) => {
      const next = new Set(prev)
      if (next.has(app)) next.delete(app)
      else next.add(app)
      return next
    })
  }

  function togglePermission(id: number) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((p) => p !== id)
      : [...selectedIds, id]
    form.setValue('permissions', next, { shouldValidate: true })
  }

  function toggleAllInApp(app: string) {
    const appIds = (grouped[app] ?? []).map((p) => p.id)
    const allSelected = appIds.every((id) => selectedIds.includes(id))
    const next = allSelected
      ? selectedIds.filter((id) => !appIds.includes(id))
      : [...new Set([...selectedIds, ...appIds])]
    form.setValue('permissions', next, { shouldValidate: true })
  }

  function handleSubmit(values: RoleFormValues) {
    onSubmit({ name: values.name, permissions: values.permissions })
  }

  const appLabels = Object.keys(grouped).sort()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 p-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del rol</FormLabel>
              <FormControl>
                <Input placeholder="ej: warehouse_staff" {...field} />
              </FormControl>
              <FormMessage />
              {apiErrors?.name && (
                <p className="text-sm text-destructive">{apiErrors.name}</p>
              )}
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Permisos
              {selectedIds.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({selectedIds.length} seleccionados)
                </span>
              )}
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => form.setValue('permissions', [])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar permiso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
            {appLabels.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                Sin resultados
              </p>
            )}
            {appLabels.map((app) => {
              const appPerms = grouped[app]
              const isExpanded = expandedApps.has(app)
              const selectedInApp = appPerms.filter((p) => selectedIds.includes(p.id)).length
              const allSelected = selectedInApp === appPerms.length

              return (
                <div key={app}>
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer select-none">
                    <button
                      type="button"
                      className="flex items-center gap-2 flex-1 text-left"
                      onClick={() => toggleApp(app)}
                    >
                      {isExpanded
                        ? <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                        : <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />}
                      <span className="text-sm font-medium">{app}</span>
                      {selectedInApp > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {selectedInApp}/{appPerms.length}
                        </span>
                      )}
                    </button>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="size-3.5 accent-primary"
                        checked={allSelected}
                        onChange={() => toggleAllInApp(app)}
                      />
                      <span className="text-xs text-muted-foreground">Todo</span>
                    </label>
                  </div>

                  {isExpanded && (
                    <div className="pl-7 pr-3 pb-1 flex flex-col gap-0.5 bg-muted/20">
                      {appPerms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-2 py-1 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            className="size-3.5 accent-primary shrink-0"
                            checked={selectedIds.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                          />
                          <span className="text-xs">{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting
            ? 'Guardando...'
            : defaultValues
            ? 'Guardar cambios'
            : 'Crear rol'}
        </Button>
      </form>
    </Form>
  )
}
