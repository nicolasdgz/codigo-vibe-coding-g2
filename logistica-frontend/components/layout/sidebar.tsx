'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  X,
  LayoutDashboard,
  Users,
  Warehouse,
  Truck,
  Package,
  UserCheck,
  Car,
  Route,
  PackageSearch,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { canAccessModule, type ModuleKey } from '@/lib/permissions'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  exact?: boolean
  permission?: ModuleKey
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const baseNavGroups: NavGroup[] = [
  {
    label: 'General',
    items: [
      { label: 'Dashboard',   href: '/dashboard',  icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Infraestructura',
    items: [
      { label: 'Bodegas',     href: '/warehouses', icon: Warehouse, permission: 'warehouses' },
      { label: 'Proveedores', href: '/suppliers',  icon: Truck,     permission: 'suppliers'  },
      { label: 'Clientes',    href: '/customers',  icon: Users,     permission: 'customers'  },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { label: 'Transporte',  href: '/transport',  icon: Car,       permission: 'transport'  },
      { label: 'Conductores', href: '/drivers',    icon: UserCheck, permission: 'drivers'    },
      { label: 'Rutas',       href: '/routes',     icon: Route,     permission: 'routes'     },
    ],
  },
  {
    label: 'Logística',
    items: [
      { label: 'Productos',   href: '/products',   icon: Package,      permission: 'products'  },
      { label: 'Envíos',      href: '/shipments',  icon: PackageSearch, permission: 'shipments' },
    ],
  },
]

const adminNavGroup: NavGroup = {
  label: 'Administración',
  items: [
    { label: 'Usuarios', href: '/users', icon: ShieldCheck },
    { label: 'Roles',    href: '/roles', icon: Users },
  ],
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const filteredBase = baseNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        !item.permission || canAccessModule(user, item.permission, 'view')
      ),
    }))
    .filter((group) => group.items.length > 0)

  const navGroups = user?.is_superuser
    ? [...filteredBase, adminNavGroup]
    : filteredBase

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card px-3 py-4',
        // Mobile: fixed overlay drawer
        'fixed inset-y-0 left-0 z-40 w-64',
        'transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static in normal flex flow
        'lg:relative lg:inset-y-auto lg:left-auto lg:z-auto',
        'lg:w-56 lg:shrink-0 lg:translate-x-0',
      )}
    >
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <Truck className="size-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight">Logística</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 lg:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X className="size-4" />
        </Button>
      </div>

      <nav className="flex flex-col gap-4">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => {
              const { label, href, icon: Icon } = item
              const exact = 'exact' in item ? item.exact : false
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Button
                  key={href}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start gap-2',
                    isActive && 'bg-primary/10 text-primary font-medium'
                  )}
                  asChild
                  onClick={onClose}
                >
                  <Link href={href}>
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                </Button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
