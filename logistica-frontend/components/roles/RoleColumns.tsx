'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Group } from '@/types/users'

interface RoleColumnsOptions {
  onEdit: (group: Group) => void
  onDelete: (group: Group) => void
}

export function buildRoleColumns({ onEdit, onDelete }: RoleColumnsOptions): ColumnDef<Group>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('name')}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const group = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(group)}
              aria-label="Editar rol"
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(group)}
              aria-label="Eliminar rol"
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

export const roleBadgeVariant = (name: string) => {
  if (name === 'admin') return 'default' as const
  return 'secondary' as const
}

export function RoleBadge({ name }: { name: string }) {
  return <Badge variant={roleBadgeVariant(name)}>{name}</Badge>
}
