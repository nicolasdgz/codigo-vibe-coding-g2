'use client'

import { useState } from 'react'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RouteStopForm } from './RouteStopForm'
import { useDeleteRouteStop, usePatchRouteStop } from '@/hooks/routes'
import type { RouteStop } from '@/types/routes'

interface RouteStopListProps {
  routeId: number
  stops: RouteStop[]
  isLoading: boolean
}

export function RouteStopList({ routeId, stops, isLoading }: RouteStopListProps) {
  const deleteStop = useDeleteRouteStop()
  const patchStop = usePatchRouteStop()
  const [arrivalInputs, setArrivalInputs] = useState<Record<number, string>>({})

  const sorted = [...stops].sort((a, b) => a.order - b.order)

  function handleDeleteStop(stopId: number) {
    deleteStop.mutate({ routeId, stopId })
  }

  function handleArrivalChange(stopId: number, value: string) {
    setArrivalInputs((prev) => ({ ...prev, [stopId]: value }))
  }

  function handleMarkArrived(stopId: number) {
    const value = arrivalInputs[stopId] ?? ''
    patchStop.mutate({
      routeId,
      stopId,
      payload: { actual_arrival: value || null },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Paradas</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay paradas registradas para esta ruta.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((stop) => (
            <div
              key={stop.id}
              className="flex flex-wrap items-start gap-3 rounded-lg border p-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                    #{stop.order}
                  </span>
                  <span className="font-medium">{stop.address}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="text-sm text-muted-foreground">{stop.city}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>
                    Estimada:{' '}
                    {stop.estimated_arrival
                      ? new Date(stop.estimated_arrival).toLocaleString('es-AR')
                      : '—'}
                  </span>
                  <span>
                    Real:{' '}
                    {stop.actual_arrival
                      ? new Date(stop.actual_arrival).toLocaleString('es-AR')
                      : '—'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    className="h-8 w-56 text-sm"
                    value={arrivalInputs[stop.id] ?? stop.actual_arrival?.slice(0, 16) ?? ''}
                    onChange={(e) => handleArrivalChange(stop.id, e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkArrived(stop.id)}
                    disabled={patchStop.isPending}
                  >
                    Guardar llegada
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDeleteStop(stop.id)}
                disabled={deleteStop.isPending}
                aria-label="Eliminar parada"
                className="text-destructive hover:text-destructive"
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>
      )}

      <RouteStopForm routeId={routeId} onSuccess={() => {}} />
    </div>
  )
}
