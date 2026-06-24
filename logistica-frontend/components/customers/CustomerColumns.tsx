'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Customer } from '@/types/customers'

interface CustomerColumnsOptions {
  onEdit: (id: number) => void
  onDelete: (customer: Customer) => void
}

export function buildCustomerColumns({
  onEdit,
  onDelete,
}: CustomerColumnsOptions): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'customer_type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue<Customer['customer_type']>('customer_type')
        return (
          <Badge variant={type === 'company' ? 'default' : 'secondary'}>
            {type === 'company' ? 'Empresa' : 'Persona'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
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
        const customer = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(customer.id)}
              aria-label="Editar cliente"
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(customer)}
              aria-label="Eliminar cliente"
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
export const customerColumns: ColumnDef<Customer>[] = buildCustomerColumns({
  onEdit: () => undefined,
  onDelete: () => undefined,
})
