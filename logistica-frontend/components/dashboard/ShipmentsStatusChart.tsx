'use client'

import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getShipmentList } from '@/services/shipments'
import { ChartCard, ChartSkeleton, ChartEmpty, ChartTooltip, LEGEND_STYLE } from './ChartCard'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: '#f59e0b' },
  in_transit: { label: 'En tránsito', color: '#3b82f6' },
  delivered:  { label: 'Entregado',   color: '#10b981' },
  cancelled:  { label: 'Cancelado',   color: '#ef4444' },
  returned:   { label: 'Devuelto',    color: '#6b7280' },
}

export function ShipmentsStatusChart() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'charts', 'shipments-all'],
    queryFn: () => getShipmentList({ page_size: 500 }),
    enabled: canAccessModule(user, 'shipments', 'view'),
  })

  const chartData = Object.entries(STATUS_CONFIG)
    .map(([status, cfg]) => ({
      name: cfg.label,
      value: (data?.results ?? []).filter((s) => s.status === status).length,
      color: cfg.color,
    }))
    .filter((d) => d.value > 0)

  return (
    <ChartCard title="Envíos por estado">
      {isLoading ? (
        <ChartSkeleton />
      ) : chartData.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              cursor="pointer"
            >
              {chartData.map((entry, i) => (
                // fill prop → tooltip payload color; style → visual override (beats CSS currentColor)
                <Cell key={i} fill={entry.color} style={{ fill: entry.color }} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={LEGEND_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
