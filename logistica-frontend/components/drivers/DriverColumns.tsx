'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Driver } from '@/types/drivers'

interface DriverColumnsOptions {
  onEdit: (id: number) => void
  onDelete: (driver: Driver) => void
}

function getFullName(driver: Driver): string {
  const full = `${driver.user.first_name} ${driver.user.last_name}`.trim()
  return full || driver.user.username
}

export function buildDriverColumns({
  onEdit,
  onDelete,
}: DriverColumnsOptions): ColumnDef<Driver>[] {
  return [
    {
      id: 'full_name',
      header: 'Nombre completo',
      cell: ({ row }) => (
        <span className="font-medium">{getFullName(row.original)}</span>
      ),
    },
    {
      accessorKey: 'license_number',
      header: 'Número de licencia',
    },
    {
      accessorKey: 'license_expiry',
      header: 'Vencimiento licencia',
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
    },
    {
      accessorKey: 'is_available',
      header: 'Disponible',
      cell: ({ row }) => {
        const isAvailable = row.getValue<boolean>('is_available')
        return (
          <Badge variant={isAvailable ? 'default' : 'outline'}>
            {isAvailable ? 'Disponible' : 'No disponible'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const driver = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(driver.id)}
              aria-label="Editar conductor"
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(driver)}
              aria-label="Eliminar conductor"
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
export const driverColumns: ColumnDef<Driver>[] = buildDriverColumns({
  onEdit: () => undefined,
  onDelete: () => undefined,
})
