'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Shipment } from '@/types/shipments'

const STATUS_LABELS: Record<Shipment['status'], string> = {
  pending: 'Pendiente',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  returned: 'Devuelto',
}

const STATUS_VARIANTS: Record<
  Shipment['status'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  in_transit: 'default',
  delivered: 'default',
  cancelled: 'destructive',
  returned: 'outline',
}

const STATUS_CLASSES: Record<Shipment['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_transit: 'bg-blue-100 text-blue-800 border-blue-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: '',
  returned: '',
}

interface ShipmentColumnsOptions {
  onEdit: (id: number) => void
}

export function buildShipmentColumns({
  onEdit,
}: ShipmentColumnsOptions): ColumnDef<Shipment>[] {
  return [
    {
      accessorKey: 'tracking_number',
      header: 'Número de seguimiento',
      cell: ({ row }) => (
        <span className="font-mono font-medium text-sm">
          {row.getValue('tracking_number')}
        </span>
      ),
    },
    {
      id: 'customer',
      header: 'Cliente',
      cell: ({ row }) => {
        const customer = row.original.customer
        return customer ? (
          <span>{customer.name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      id: 'route',
      header: 'Ruta',
      cell: ({ row }) => {
        const route = row.original.route
        return route ? (
          <span>{route.name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue<Shipment['status']>('status')
        const extraClass = STATUS_CLASSES[status]
        if (extraClass) {
          return (
            <Badge variant="outline" className={extraClass}>
              {STATUS_LABELS[status]}
            </Badge>
          )
        }
        return (
          <Badge variant={STATUS_VARIANTS[status]}>
            {STATUS_LABELS[status]}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'estimated_delivery',
      header: 'Entrega estimada',
      cell: ({ row }) => {
        const date = row.getValue<string | null>('estimated_delivery')
        return date ? (
          <span>{date}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'total_weight_kg',
      header: 'Peso total (kg)',
      cell: ({ row }) => (
        <span>{row.getValue('total_weight_kg')} kg</span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const shipment = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(shipment.id)}
              aria-label="Editar envío"
            >
              <PencilIcon />
            </Button>
          </div>
        )
      },
    },
  ]
}

/** Static column defs without action handlers — useful as placeholder type */
export const shipmentColumns: ColumnDef<Shipment>[] = buildShipmentColumns({
  onEdit: () => undefined,
})
