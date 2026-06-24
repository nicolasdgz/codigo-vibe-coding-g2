'use client'

import { useQuery } from '@tanstack/react-query'
import { PackageIcon, UsersIcon, TruckIcon, TrendingUpIcon } from 'lucide-react'
import type { ElementType } from 'react'
import { getShipmentList } from '@/services/shipments'
import { getDrivers } from '@/services/drivers'
import { getTransportList } from '@/services/transport'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isLoading,
  iconBg,
  iconColor,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: ElementType
  isLoading?: boolean
  iconBg?: string
  iconColor?: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{title}</p>
        <div className={`rounded-md p-1.5 shrink-0 ${iconBg ?? 'bg-primary/10'}`}>
          <Icon className={`size-4 ${iconColor ?? 'text-primary'}`} />
        </div>
      </div>
      {isLoading ? (
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <p className="text-2xl lg:text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      )}
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

export function KpiCards() {
  const user = useAuthStore((s) => s.user)
  const currentYearMonth = new Date().toISOString().slice(0, 7)

  const { data: dPending, isLoading: l1 } = useQuery({
    queryKey: ['dashboard', 'kpi', 'shipments-pending'],
    queryFn: () => getShipmentList({ status: 'pending', page_size: 1 }),
    enabled: canAccessModule(user, 'shipments', 'view'),
  })
  const { data: dInTransit, isLoading: l2 } = useQuery({
    queryKey: ['dashboard', 'kpi', 'shipments-intransit'],
    queryFn: () => getShipmentList({ status: 'in_transit', page_size: 1 }),
    enabled: canAccessModule(user, 'shipments', 'view'),
  })
  const { data: dDriversAvail, isLoading: l3 } = useQuery({
    queryKey: ['dashboard', 'kpi', 'drivers-available'],
    queryFn: () => getDrivers({ is_available: true, page_size: 1 }),
    enabled: canAccessModule(user, 'drivers', 'view'),
  })
  const { data: dDriversTotal } = useQuery({
    queryKey: ['dashboard', 'kpi', 'drivers-total'],
    queryFn: () => getDrivers({ page_size: 1 }),
    enabled: canAccessModule(user, 'drivers', 'view'),
  })
  const { data: dTransportActive, isLoading: l4 } = useQuery({
    queryKey: ['dashboard', 'kpi', 'transport-active'],
    queryFn: () => getTransportList({ is_active: true, page_size: 1 }),
    enabled: canAccessModule(user, 'transport', 'view'),
  })
  const { data: dTransportTotal } = useQuery({
    queryKey: ['dashboard', 'kpi', 'transport-total'],
    queryFn: () => getTransportList({ page_size: 1 }),
    enabled: canAccessModule(user, 'transport', 'view'),
  })
  const { data: dDelivered, isLoading: l5 } = useQuery({
    queryKey: ['dashboard', 'kpi', 'revenue', currentYearMonth],
    queryFn: () => getShipmentList({ status: 'delivered', page_size: 500 }),
    enabled: canAccessModule(user, 'shipments', 'view'),
  })

  const activeShipments = (dPending?.count ?? 0) + (dInTransit?.count ?? 0)

  const revenue = (dDelivered?.results ?? [])
    .filter((s) => s.created_at.startsWith(currentYearMonth))
    .reduce((sum, s) => sum + parseFloat(s.calculated_cost), 0)

  const monthLabel = new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        title="Envíos activos"
        value={activeShipments}
        subtitle="Pendientes + en tránsito"
        icon={PackageIcon}
        isLoading={l1 || l2}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-500"
      />
      <KpiCard
        title="Conductores disponibles"
        value={`${dDriversAvail?.count ?? 0} / ${dDriversTotal?.count ?? 0}`}
        subtitle="Disponibles / total"
        icon={UsersIcon}
        isLoading={l3}
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-500"
      />
      <KpiCard
        title="Vehículos activos"
        value={`${dTransportActive?.count ?? 0} / ${dTransportTotal?.count ?? 0}`}
        subtitle="Activos / total"
        icon={TruckIcon}
        isLoading={l4}
        iconBg="bg-violet-500/10"
        iconColor="text-violet-500"
      />
      <KpiCard
        title="Ingresos del mes"
        value={`$${revenue.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        subtitle={monthLabel}
        icon={TrendingUpIcon}
        isLoading={l5}
        iconBg="bg-amber-500/10"
        iconColor="text-amber-500"
      />
    </div>
  )
}
