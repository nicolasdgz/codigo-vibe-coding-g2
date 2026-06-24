'use client'

import type { ReactNode } from 'react'

// Axis tick style — var() resolves directly since --color-* maps to oklch values
export const TICK_STYLE = {
  fontSize: 11,
  fill: 'var(--color-muted-foreground)',
} as const

export const LEGEND_STYLE = {
  fontSize: '12px',
  color: 'var(--color-foreground)',
} as const

// Custom tooltip — uses Tailwind classes (generated CSS, no var() parsing issues)
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    fill?: string
    stroke?: string
    color?: string
    payload?: Record<string, unknown>
  }>
  label?: string
  valueFormatter?: (value: number, name: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg text-xs min-w-[140px]">
      {label && (
        <p className="mb-1.5 font-medium text-muted-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const swatchColor = entry.fill ?? entry.stroke ?? entry.color ?? '#888'
          const displayValue = valueFormatter
            ? valueFormatter(entry.value, entry.name)
            : entry.value.toLocaleString('es-AR')
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: swatchColor }}
                />
                <span className="text-muted-foreground truncate">{entry.name}</span>
              </div>
              <span className="font-semibold text-popover-foreground tabular-nums shrink-0">
                {displayValue}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ChartCard({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  )
}

export function ChartSkeleton() {
  return <div className="h-56 animate-pulse rounded-md bg-muted" />
}

export function ChartEmpty() {
  return (
    <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
      Sin datos
    </div>
  )
}
