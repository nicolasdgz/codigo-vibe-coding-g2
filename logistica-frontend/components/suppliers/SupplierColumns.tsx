'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Supplier } from '@/types/suppliers'

interface SupplierColumnsOptions {
  onEdit: (id: number) => void
  onDelete: (supplier: Supplier) => void
}

export function buildSupplierColumns({
  onEdit,
  onDelete,
}: SupplierColumnsOptions): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'contact_name',
      header: 'Contacto',
    },
    {
      accessorKey: 'tax_id',
      header: 'Tax ID',
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
        const supplier = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(supplier.id)}
              aria-label="Editar proveedor"
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(supplier)}
              aria-label="Eliminar proveedor"
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
export const supplierColumns: ColumnDef<Supplier>[] = buildSupplierColumns({
  onEdit: () => undefined,
  onDelete: () => undefined,
})
