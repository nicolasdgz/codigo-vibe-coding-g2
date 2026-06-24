'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Menu, User } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Clientes',
  '/warehouses': 'Bodegas',
  '/suppliers': 'Proveedores',
  '/products': 'Productos',
  '/drivers': 'Conductores',
  '/transport': 'Transporte',
  '/routes': 'Rutas',
  '/shipments': 'Envíos',
  '/profile': 'Perfil',
  '/users': 'Usuarios',
  '/roles': 'Roles',
}

function getPageTitle(pathname: string): string {
  const exact = pageTitles[pathname]
  if (exact) return exact
  const parent = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key))
  return parent ? pageTitles[parent] : 'Dashboard'
}

function getInitials(username: string): string {
  const parts = username.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return username.slice(0, 2).toUpperCase()
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    document.cookie = 'logged-in=; path=/; max-age=0'
    router.push('/login')
  }

  const initials = user ? getInitials(user.username) : '?'

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu className="size-4" />
        </Button>
        <h1 className="text-sm font-semibold">{getPageTitle(pathname)}</h1>
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-8 px-2 rounded-full hover:ring-2 hover:ring-ring hover:ring-offset-1 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menú de usuario"
            >
              <Avatar className="size-7">
                <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium leading-none max-w-32 truncate">
                {user.email || user.username}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5 py-0.5">
                <span className="text-sm font-semibold leading-tight">{user.username}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push('/profile')}
              className="cursor-pointer gap-2"
            >
              <User className="size-4 text-muted-foreground" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}
