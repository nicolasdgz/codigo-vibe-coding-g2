'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Route } from '@/types/routes'

const STATUS_LABELS: Record<Route['status'], string> = {
  planned: 'Planificada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const STATUS_VARIANTS: Record<
  Route['status'],
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  planned: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  cancelled: 'destructive',
}

interface RouteColumnsOptions {
  onEdit: (id: number) => void
}

export function buildRouteColumns({ onEdit }: RouteColumnsOptions): ColumnDef<Route>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('name')}</span>
      ),
    },
    {
      id: 'origin_warehouse',
      header: 'Almacén de origen',
      cell: ({ row }) => {
        const warehouse = row.original.origin_warehouse
        return warehouse ? `${warehouse.name} — ${warehouse.city}` : '—'
      },
    },
    {
      id: 'transport',
      header: 'Transporte',
      cell: ({ row }) => {
        const transport = row.original.transport
        return transport ? (
          transport.plate_number
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue<Route['status']>('status')
        return (
          <Badge variant={STATUS_VARIANTS[status]}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'scheduled_date',
      header: 'Fecha programada',
      cell: ({ row }) => {
        const date = row.getValue<string>('scheduled_date')
        return date ?? <span className="text-muted-foreground">—</span>
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const route = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(route.id)}
              aria-label="Editar ruta"
            >
              <PencilIcon />
            </Button>
          </div>
        )
      },
    },
  ]
}
