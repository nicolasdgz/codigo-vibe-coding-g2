'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Warehouse } from '@/types/warehouses'

interface WarehouseColumnsOptions {
  onEdit: (id: number) => void
  onDelete: (warehouse: Warehouse) => void
}

export function buildWarehouseColumns({
  onEdit,
  onDelete,
}: WarehouseColumnsOptions): ColumnDef<Warehouse>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Ciudad',
    },
    {
      accessorKey: 'country',
      header: 'País',
    },
    {
      accessorKey: 'capacity',
      header: 'Capacidad',
      cell: ({ row }) => (
        <span>{(row.getValue<number>('capacity')).toLocaleString()}</span>
      ),
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
        const warehouse = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(warehouse.id)}
              aria-label="Editar almacén"
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(warehouse)}
              aria-label="Eliminar almacén"
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

/** Static column defs without action handlers — useful as placeholder type */
export const warehouseColumns: ColumnDef<Warehouse>[] = buildWarehouseColumns({
  onEdit: () => undefined,
  onDelete: () => undefined,
})
