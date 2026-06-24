'use client'

import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getRouteList } from '@/services/routes'
import { ChartCard, ChartSkeleton, ChartEmpty, ChartTooltip, LEGEND_STYLE } from './ChartCard'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planned:     { label: 'Planificada', color: '#3b82f6' },
  in_progress: { label: 'En curso',    color: '#f59e0b' },
  completed:   { label: 'Completada',  color: '#10b981' },
  cancelled:   { label: 'Cancelada',   color: '#ef4444' },
}

export function RoutesStatusChart() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'charts', 'routes-all'],
    queryFn: () => getRouteList({ page_size: 500 }),
    enabled: canAccessModule(user, 'routes', 'view'),
  })

  const chartData = Object.entries(STATUS_CONFIG)
    .map(([status, cfg]) => ({
      name: cfg.label,
      value: (data?.results ?? []).filter((r) => r.status === status).length,
      color: cfg.color,
    }))
    .filter((d) => d.value > 0)

  return (
    <ChartCard title="Estado de rutas">
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
