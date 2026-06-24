'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { getProducts } from '@/services/products'
import { ChartCard, ChartSkeleton, ChartEmpty, ChartTooltip, TICK_STYLE } from './ChartCard'
import { useAuthStore } from '@/store/auth'
import { canAccessModule } from '@/lib/permissions'

const GREEN = '#10b981'

export function StockByWarehouseChart() {
  const user = useAuthStore((s) => s.user)
  const [onlyActive, setOnlyActive] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'charts', 'products-all', onlyActive],
    queryFn: () => getProducts({ page_size: 500, ...(onlyActive ? { is_active: true } : {}) }),
    enabled: canAccessModule(user, 'products', 'view'),
  })

  const warehouseMap = new Map<string, number>()
  for (const product of data?.results ?? []) {
    const name = product.warehouse.name
    warehouseMap.set(name, (warehouseMap.get(name) ?? 0) + product.stock)
  }

  const chartData = Array.from(warehouseMap.entries())
    .map(([name, stock]) => ({ name, stock }))
    .sort((a, b) => b.stock - a.stock)

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
    <ChartCard title="Stock por almacén" action={toggle}>
      {isLoading ? (
        <ChartSkeleton />
      ) : chartData.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 44)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis type="number" tick={TICK_STYLE} />
            <YAxis
              dataKey="name"
              type="category"
              tick={TICK_STYLE}
              width={100}
            />
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(v) => v.toLocaleString('es-AR')}
                />
              }
            />
            <Bar dataKey="stock" fill={GREEN} radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={GREEN} style={{ fill: GREEN }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
