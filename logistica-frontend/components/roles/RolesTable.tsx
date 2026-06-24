'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableEmptyState } from '@/components/ui/table-empty-state'
import { buildRoleColumns } from './RoleColumns'
import type { Group } from '@/types/users'

interface RolesTableProps {
  data: Group[]
  total: number
  page: number
  onPageChange: (page: number) => void
  isLoading: boolean
  onEdit: (group: Group) => void
  onDelete: (group: Group) => void
}

const PAGE_SIZE = 20

export function RolesTable({
  data,
  total,
  page,
  onPageChange,
  isLoading,
  onEdit,
  onDelete,
}: RolesTableProps) {
  const columns = buildRoleColumns({ onEdit, onDelete })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableEmptyState
                colSpan={columns.length}
                hasActiveFilters={false}
                entityName="roles"
              />
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{`Mostrando página ${page} de ${totalPages} — ${total} total`}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={!hasPrev}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={!hasNext}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
