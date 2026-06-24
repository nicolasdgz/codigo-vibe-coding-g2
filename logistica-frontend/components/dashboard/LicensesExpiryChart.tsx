'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getDrivers } from '@/services/drivers'
import { ChartCard, ChartSkeleton, ChartEmpty, ChartTooltip, TICK_STYLE } from './ChartCard'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'

const PERIOD_OPTIONS = [
  { value: '3', label: 'Próximos 3 meses' },
  { value: '6', label: 'Próximos 6 meses' },
  { value: '12', label: 'Próximo año' },
]

const ORANGE = '#f97316'

export function LicensesExpiryChart() {
  const user = useAuthStore((s) => s.user)
  const [months, setMonths] = useState('6')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'charts', 'drivers-all'],
    queryFn: () => getDrivers({ page_size: 500 }),
    enabled: canAccessModule(user, 'drivers', 'view'),
  })

  const periodMonths = parseInt(months)
  const today = new Date()

  const buckets = Array.from({ length: periodMonths }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('es-AR', { month: 'short', year: '2-digit' }),
      vencimientos: 0,
    }
  })

  for (const driver of data?.results ?? []) {
    const monthKey = driver.license_expiry.slice(0, 7)
    const bucket = buckets.find((b) => b.key === monthKey)
    if (bucket) bucket.vencimientos++
  }

  const hasData = buckets.some((b) => b.vencimientos > 0)

  const periodSelect = (
    <Select value={months} onValueChange={setMonths}>
      <SelectTrigger className="h-7 w-40 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <ChartCard title="Licencias por vencer" action={periodSelect}>
      {isLoading ? (
        <ChartSkeleton />
      ) : !hasData ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={buckets} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={TICK_STYLE} />
            <YAxis tick={TICK_STYLE} allowDecimals={false} />
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(v) => [v, 'Vencimientos'].join(' ')}
                />
              }
            />
            <Bar dataKey="vencimientos" fill={ORANGE} radius={[4, 4, 0, 0]}>
              {buckets.map((_, i) => (
                <Cell key={i} fill={ORANGE} style={{ fill: ORANGE }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
