'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useMe, useUpdateMe } from '@/hooks/users'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres').or(z.literal('')).optional(),
  confirmPassword: z.string().optional(),
}).refine(
  (d) => !d.password || d.password === d.confirmPassword,
  { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] }
)

type ProfileFormValues = z.infer<typeof profileSchema>

function getInitials(user: { first_name?: string; last_name?: string; username: string }): string {
  if (user.first_name && user.last_name) {
    return (user.first_name[0] + user.last_name[0]).toUpperCase()
  }
  if (user.first_name) return user.first_name.slice(0, 2).toUpperCase()
  return user.username.slice(0, 2).toUpperCase()
}

function getDisplayName(user: { first_name?: string; last_name?: string; username: string }): string {
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return full || user.username
}

function roleLabel(user: { is_superuser: boolean; is_staff: boolean }): string {
  if (user.is_superuser) return 'Superadmin'
  if (user.is_staff) return 'Staff'
  return 'Usuario'
}

function decodeJwt(token: string): { exp?: number; iat?: number } {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
}

function formatTokenExpiry(exp?: number): string {
  if (!exp) return '—'
  const expiresAt = new Date(exp * 1000)
  const remainingMs = expiresAt.getTime() - Date.now()
  if (remainingMs <= 0) return 'Expirado'
  const mins = Math.floor(remainingMs / 60000)
  if (mins < 60) return `${mins} min (vence a las ${expiresAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })})`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${mins % 60}min`
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium break-all">{value || '—'}</span>
    </div>
  )
}

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data: profile, isLoading } = useMe()
  const updateMe = useUpdateMe()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const user = profile ?? storeUser

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirmPassword: '' },
    values: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      email: profile?.email ?? '',
      password: '',
      confirmPassword: '',
    },
  })

  if (!user) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <p className="text-sm text-muted-foreground">No hay sesión activa.</p>
      </div>
    )
  }

  const tokenPayload = accessToken ? decodeJwt(accessToken) : {}
  const displayName = getDisplayName(user)
  const initials = getInitials(user)

  function handleSubmit(values: ProfileFormValues) {
    const payload: Record<string, string> = {}
    if (values.first_name !== undefined && values.first_name !== (profile?.first_name ?? '')) payload.first_name = values.first_name
    if (values.last_name !== undefined && values.last_name !== (profile?.last_name ?? '')) payload.last_name = values.last_name
    if (values.email && values.email !== profile?.email) payload.email = values.email
    if (values.password) payload.password = values.password
    if (Object.keys(payload).length === 0) return

    setSuccessMsg(null)
    updateMe.mutate(payload, {
      onSuccess: () => {
        setSuccessMsg('Perfil actualizado correctamente.')
        form.setValue('password', '')
        form.setValue('confirmPassword', '')
      },
      onError: (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          const data = err.response.data as Record<string, string | string[]>
          Object.entries(data).forEach(([field, msg]) => {
            const message = Array.isArray(msg) ? msg[0] : msg
            form.setError(field as keyof ProfileFormValues, { message })
          })
        }
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted-foreground">Información de tu cuenta</p>
      </div>

      {/* Avatar + nombre */}
      <div className="flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
        <Avatar className="size-16 shrink-0">
          <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-lg font-semibold leading-tight">{displayName}</h2>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email || '—'}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {'is_superuser' in user && (
              <Badge variant="secondary" className="text-xs">
                {roleLabel(user as { is_superuser: boolean; is_staff: boolean })}
              </Badge>
            )}
            {'groups' in user &&
              (user as { groups: string[] }).groups.map((g) => (
                <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
              ))}
          </div>
        </div>
      </div>

      {/* Detalles readonly */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-3">
          <h3 className="text-sm font-semibold">Detalles de la cuenta</h3>
        </div>
        <div className="divide-y px-6">
          <InfoRow label="Usuario" value={user.username} />
          <InfoRow label="Nombres" value={'first_name' in user ? (user as { first_name: string }).first_name : ''} />
          <InfoRow label="Apellidos" value={'last_name' in user ? (user as { last_name: string }).last_name : ''} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="ID de usuario" value={String(user.id)} />
          {'is_active' in user && (
            <InfoRow label="Estado" value={(user as { is_active: boolean }).is_active ? 'Activo' : 'Inactivo'} />
          )}
          {'date_joined' in user && (user as { date_joined?: string }).date_joined && (
            <InfoRow
              label="Cuenta creada"
              value={new Date((user as { date_joined: string }).date_joined).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            />
          )}
        </div>
      </div>

      {/* Form de edición */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-3">
          <h3 className="text-sm font-semibold">Editar información</h3>
        </div>
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombres</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl>
                        <Input placeholder="Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 8 caracteres"
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                        />
                        <button type="button" onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Repetí la contraseña"
                          autoComplete="new-password"
                          className="pr-10"
                          {...field}
                        />
                        <button type="button" onClick={() => setShowConfirm((v) => !v)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                          {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {successMsg && (
                <p className="text-sm text-emerald-600 font-medium">{successMsg}</p>
              )}

              <Button type="submit" disabled={updateMe.isPending} className="self-start">
                {updateMe.isPending && <Loader2 className="size-4 animate-spin" />}
                {updateMe.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Sesión y token */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-3">
          <h3 className="text-sm font-semibold">Sesión activa</h3>
        </div>
        <div className="divide-y px-6">
          <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="w-40 shrink-0 text-sm text-muted-foreground">Estado</span>
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full shrink-0 ${isLoading ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
              <span className="text-sm font-medium">
                {isLoading ? 'Verificando...' : 'Activa'}
              </span>
            </div>
          </div>
          <InfoRow
            label="Tiempo del token"
            value={formatTokenExpiry(tokenPayload.exp)}
          />
          {tokenPayload.iat && (
            <InfoRow
              label="Emitido a las"
              value={new Date(tokenPayload.iat * 1000).toLocaleTimeString('es-AR', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
