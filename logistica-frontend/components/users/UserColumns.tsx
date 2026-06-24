'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { User } from '@/types/users'

interface UserColumnsOptions {
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export function buildUserColumns({ onEdit, onDelete }: UserColumnsOptions): ColumnDef<User>[] {
  return [
    {
      accessorKey: 'username',
      header: 'Usuario',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('username')}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue<string>('email')
        return email || <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: 'groups',
      header: 'Roles',
      cell: ({ row }) => {
        const groups = row.getValue<string[]>('groups')
        if (!groups.length) return <span className="text-muted-foreground text-xs">Sin roles</span>
        return (
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <Badge key={g} variant="secondary" className="text-xs">
                {g}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_staff',
      header: 'Staff',
      cell: ({ row }) => {
        const isStaff = row.getValue<boolean>('is_staff')
        const isSuperuser = row.original.is_superuser
        if (isSuperuser)
          return <Badge variant="default">Superadmin</Badge>
        return (
          <Badge variant={isStaff ? 'secondary' : 'outline'}>
            {isStaff ? 'Staff' : 'Usuario'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
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
        const user = row.original
        if (user.is_superuser) return null
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(user)}
              aria-label="Editar usuario"
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(user)}
              aria-label="Eliminar usuario"
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
