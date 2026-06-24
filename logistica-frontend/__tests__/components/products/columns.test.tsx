import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { buildProductColumns } from '@/components/products/ProductColumns'
import type { Product } from '@/types/products'

const mockProduct: Product = {
  id: 1, name: 'Producto Test', description: 'Descripción', sku: 'SKU-001',
  weight_kg: '2.50', dimensions: '10x10x10', unit_price: '99.99', stock: 50,
  supplier: { id: 1, name: 'Proveedor A' },
  warehouse: { id: 1, name: 'Almacén Central', city: 'Bogotá' },
  is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function renderCell(col: ColumnDef<Product>, row: Product) {
  const CellFn = (col as any).cell as ((ctx: any) => React.ReactNode) | undefined
  if (!CellFn) return render(<div data-testid="no-cell" />)
  return render(
    <>{CellFn({ row: { getValue: (k: string) => (row as any)[k], original: row } })}</>
  )
}

describe('buildProductColumns', () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const columns = buildProductColumns({ onEdit, onDelete })

  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 8 columnas', () => {
    expect(columns).toHaveLength(8)
  })

  describe('columna unit_price', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'unit_price')!

    it('muestra precio con signo $', () => {
      renderCell(col, mockProduct)
      expect(screen.getByText('$99.99')).toBeInTheDocument()
    })
  })

  describe('columna supplier_name', () => {
    const col = columns.find((c) => (c as any).id === 'supplier_name')!

    it('muestra el nombre del proveedor', () => {
      renderCell(col, mockProduct)
      expect(screen.getByText('Proveedor A')).toBeInTheDocument()
    })
  })

  describe('columna warehouse_name', () => {
    const col = columns.find((c) => (c as any).id === 'warehouse_name')!

    it('muestra el nombre del almacén', () => {
      renderCell(col, mockProduct)
      expect(screen.getByText('Almacén Central')).toBeInTheDocument()
    })
  })

  describe('columna is_active', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'is_active')!

    it('muestra badge "Activo" cuando is_active=true', () => {
      renderCell(col, { ...mockProduct, is_active: true })
      expect(screen.getByText('Activo')).toBeInTheDocument()
    })

    it('muestra badge "Inactivo" cuando is_active=false', () => {
      renderCell(col, { ...mockProduct, is_active: false })
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  describe('columna actions', () => {
    const col = columns.find((c) => (c as any).id === 'actions')!

    it('botón Editar llama a onEdit con id correcto', () => {
      renderCell(col, mockProduct)
      fireEvent.click(screen.getByRole('button', { name: 'Editar producto' }))
      expect(onEdit).toHaveBeenCalledWith(1)
    })

    it('botón Eliminar llama a onDelete con el product completo', () => {
      renderCell(col, mockProduct)
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar producto' }))
      expect(onDelete).toHaveBeenCalledWith(mockProduct)
    })
  })
})
