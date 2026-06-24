'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Transport } from '@/types/transport'

const VEHICLE_TYPE_LABELS: Record<Transport['vehicle_type'], string> = {
  truck: 'Camión',
  van: 'Furgoneta',
  motorcycle: 'Moto',
  car: 'Auto',
}

interface TransportColumnsOptions {
  onEdit: (id: number) => void
  onDelete: (t: Transport) => void
}

export function buildTransportColumns({
  onEdit,
  onDelete,
}: TransportColumnsOptions): ColumnDef<Transport>[] {
  return [
    {
      accessorKey: 'plate_number',
      header: 'Matrícula',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('plate_number')}</span>
      ),
    },
    {
      accessorKey: 'vehicle_type',
      header: 'Tipo',
      cell: ({ row }) => {
        const vt = row.getValue<Transport['vehicle_type']>('vehicle_type')
        return VEHICLE_TYPE_LABELS[vt] ?? vt
      },
    },
    {
      accessorKey: 'brand',
      header: 'Marca',
    },
    {
      accessorKey: 'model',
      header: 'Modelo',
    },
    {
      accessorKey: 'year',
      header: 'Año',
    },
    {
      accessorKey: 'capacity_kg',
      header: 'Capacidad (kg)',
      cell: ({ row }) => {
        const val = row.getValue<string>('capacity_kg')
        return <span>{val} kg</span>
      },
    },
    {
      id: 'driver_name',
      header: 'Conductor',
      cell: ({ row }) => {
        const driver = row.original.driver
        return driver ? driver.name : <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Activo',
      cell: ({ row }) => {
        const isActive = row.getValue<boolean>('is_active')
        return (
          <Badge variant={isActive ? 'default' : 'outline'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const transport = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(transport.id)}
              aria-label="Editar vehículo"
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(transport)}
              aria-label="Eliminar vehículo"
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          </div>
        )
      },
    },
  ]
}
