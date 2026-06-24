'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { getTransportList } from '@/services/transport'
import { ChartCard, ChartSkeleton, ChartEmpty, ChartTooltip, LEGEND_STYLE } from './ChartCard'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  truck:      { label: 'Camión',    color: '#3b82f6' },
  van:        { label: 'Furgoneta', color: '#a855f7' },
  motorcycle: { label: 'Moto',      color: '#f97316' },
  car:        { label: 'Auto',      color: '#10b981' },
}

export function VehiclesTypeChart() {
  const user = useAuthStore((s) => s.user)
  const [onlyActive, setOnlyActive] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'charts', 'transport-all', onlyActive],
    queryFn: () => getTransportList({ page_size: 500, ...(onlyActive ? { is_active: true } : {}) }),
    enabled: canAccessModule(user, 'transport', 'view'),
  })

  const chartData = Object.entries(TYPE_CONFIG)
    .map(([type, cfg]) => ({
      name: cfg.label,
      value: (data?.results ?? []).filter((t) => t.vehicle_type === type).length,
      color: cfg.color,
    }))
    .filter((d) => d.value > 0)

  const toggle = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setOnlyActive((v) => !v)}
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      {onlyActive ? 'Ver todos' : 'Solo activos'}
    </Button>
  )

  return (
    <ChartCard title="Vehículos por tipo" action={toggle}>
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
