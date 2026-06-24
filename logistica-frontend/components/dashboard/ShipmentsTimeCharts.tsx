'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getShipmentList } from '@/services/shipments'
import { ChartCard, ChartSkeleton, ChartTooltip, TICK_STYLE } from './ChartCard'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const THIS_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2]

const BLUE = '#3b82f6'
const BLUE_AREA = 'rgba(59,130,246,0.12)'

export function ShipmentsTimeCharts() {
  const user = useAuthStore((s) => s.user)
  const [year, setYear] = useState(THIS_YEAR)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'charts', 'shipments-all'],
    queryFn: () => getShipmentList({ page_size: 500 }),
    enabled: canAccessModule(user, 'shipments', 'view'),
  })

  const shipments = data?.results ?? []

  const byMonth = MONTHS.map((month, i) => {
    const inMonth = shipments.filter((s) => {
      const d = new Date(s.created_at)
      return d.getFullYear() === year && d.getMonth() === i
    })
    return {
      month,
      envios: inMonth.length,
      ingresos: inMonth
        .filter((s) => s.status === 'delivered')
        .reduce((sum, s) => sum + parseFloat(s.calculated_cost), 0),
    }
  })

  const yearSelect = (
    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
      <SelectTrigger className="h-7 w-24 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {YEAR_OPTIONS.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="flex flex-col gap-4">
      <ChartCard title="Envíos por mes" action={yearSelect}>
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={byMonth} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={TICK_STYLE} />
              <YAxis tick={TICK_STYLE} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="envios"
                name="Envíos"
                stroke={BLUE}
                fill="url(#areaBlue)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: BLUE, stroke: 'var(--color-card)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Ingresos por mes (entregados)">
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMonth} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={TICK_STYLE} />
              <YAxis tick={TICK_STYLE} />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(v) =>
                      `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                    }
                  />
                }
              />
              <Bar dataKey="ingresos" name="Ingresos" fill={BLUE} radius={[4, 4, 0, 0]}>
                {byMonth.map((_, i) => (
                  <Cell key={i} fill={BLUE} style={{ fill: BLUE }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}
