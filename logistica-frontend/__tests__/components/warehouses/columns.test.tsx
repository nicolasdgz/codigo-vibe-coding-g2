import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { buildWarehouseColumns } from '@/components/warehouses/WarehouseColumns'
import type { Warehouse } from '@/types/warehouses'

const mockWarehouse: Warehouse = {
  id: 1, name: 'Almacén Central', address: 'Calle 1 #100',
  city: 'Bogotá', country: 'Colombia', latitude: '4.73', longitude: '-74.05',
  capacity: 5000, is_active: true,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function renderCell(col: ColumnDef<Warehouse>, row: Warehouse) {
  const CellFn = (col as any).cell as ((ctx: any) => React.ReactNode) | undefined
  if (!CellFn) return render(<div data-testid="no-cell" />)
  return render(
    <>{CellFn({ row: { getValue: (k: string) => (row as any)[k], original: row } })}</>
  )
}

describe('buildWarehouseColumns', () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const columns = buildWarehouseColumns({ onEdit, onDelete })

  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 6 columnas', () => {
    expect(columns).toHaveLength(6)
  })

  describe('columna is_active', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'is_active')!

    it('muestra badge "Activo" cuando is_active=true', () => {
      renderCell(col, { ...mockWarehouse, is_active: true })
      expect(screen.getByText('Activo')).toBeInTheDocument()
    })

    it('muestra badge "Inactivo" cuando is_active=false', () => {
      renderCell(col, { ...mockWarehouse, is_active: false })
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  describe('columna name', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'name')!

    it('renderiza el nombre en span', () => {
      renderCell(col, mockWarehouse)
      expect(screen.getByText('Almacén Central')).toBeInTheDocument()
    })
  })

  describe('columna capacity', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'capacity')!

    it('renderiza la capacidad como número formateado', () => {
      renderCell(col, mockWarehouse)
      expect(screen.getByText(/5[,.]?000/)).toBeInTheDocument()
    })
  })

  describe('columna actions', () => {
    const col = columns.find((c) => (c as any).id === 'actions')!

    it('botón Editar llama a onEdit con id correcto', () => {
      renderCell(col, mockWarehouse)
      fireEvent.click(screen.getByRole('button', { name: 'Editar almacén' }))
      expect(onEdit).toHaveBeenCalledWith(1)
    })

    it('botón Eliminar llama a onDelete con el warehouse completo', () => {
      renderCell(col, mockWarehouse)
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar almacén' }))
      expect(onDelete).toHaveBeenCalledWith(mockWarehouse)
    })
  })
})
