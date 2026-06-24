'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types/products'

interface ProductColumnsOptions {
  onEdit: (id: number) => void
  onDelete: (product: Product) => void
}

export function buildProductColumns({
  onEdit,
  onDelete,
}: ProductColumnsOptions): ColumnDef<Product>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
    },
    {
      accessorKey: 'unit_price',
      header: 'Precio unitario',
      cell: ({ row }) => {
        const price = row.getValue<string>('unit_price')
        return <span>${price}</span>
      },
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
    },
    {
      id: 'supplier_name',
      header: 'Proveedor',
      cell: ({ row }) => row.original.supplier.name,
    },
    {
      id: 'warehouse_name',
      header: 'Almacén',
      cell: ({ row }) => row.original.warehouse.name,
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
        const product = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(product.id)}
              aria-label="Editar producto"
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(product)}
              aria-label="Eliminar producto"
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
