import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { buildSupplierColumns } from '@/components/suppliers/SupplierColumns'
import type { Supplier } from '@/types/suppliers'

const mockSupplier: Supplier = {
  id: 1, name: 'Proveedor Test', email: 'prov@test.com', phone: '555-9999',
  address: 'Calle Test 1', tax_id: 'TAX-001', contact_name: 'Juan Pérez',
  is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function renderCell(col: ColumnDef<Supplier>, row: Supplier) {
  const CellFn = (col as any).cell as ((ctx: any) => React.ReactNode) | undefined
  if (!CellFn) return render(<div data-testid="no-cell" />)
  return render(
    <>{CellFn({ row: { getValue: (k: string) => (row as any)[k], original: row } })}</>
  )
}

describe('buildSupplierColumns', () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const columns = buildSupplierColumns({ onEdit, onDelete })

  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 6 columnas', () => {
    expect(columns).toHaveLength(6)
  })

  describe('columna is_active', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'is_active')!

    it('muestra badge "Activo" cuando is_active=true', () => {
      renderCell(col, { ...mockSupplier, is_active: true })
      expect(screen.getByText('Activo')).toBeInTheDocument()
    })

    it('muestra badge "Inactivo" cuando is_active=false', () => {
      renderCell(col, { ...mockSupplier, is_active: false })
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  describe('columna name', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'name')!

    it('renderiza el nombre en span', () => {
      renderCell(col, mockSupplier)
      expect(screen.getByText('Proveedor Test')).toBeInTheDocument()
    })
  })

  describe('columna actions', () => {
    const col = columns.find((c) => (c as any).id === 'actions')!

    it('botón Editar llama a onEdit con id correcto', () => {
      renderCell(col, mockSupplier)
      fireEvent.click(screen.getByRole('button', { name: 'Editar proveedor' }))
      expect(onEdit).toHaveBeenCalledWith(1)
    })

    it('botón Eliminar llama a onDelete con el supplier completo', () => {
      renderCell(col, mockSupplier)
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar proveedor' }))
      expect(onDelete).toHaveBeenCalledWith(mockSupplier)
    })
  })
})
