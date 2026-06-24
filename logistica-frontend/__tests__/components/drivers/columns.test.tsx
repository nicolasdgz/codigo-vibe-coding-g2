import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { buildDriverColumns } from '@/components/drivers/DriverColumns'
import type { Driver } from '@/types/drivers'

const mockDriver: Driver = {
  id: 1,
  user: { id: 10, username: 'driver1', email: 'd@test.com', first_name: 'Carlos', last_name: 'García' },
  license_number: 'LIC-001', license_expiry: '2026-12-31',
  phone: '555-2222', is_available: true,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function renderCell(col: ColumnDef<Driver>, row: Driver) {
  const CellFn = (col as any).cell as ((ctx: any) => React.ReactNode) | undefined
  if (!CellFn) return render(<div data-testid="no-cell" />)
  return render(
    <>{CellFn({ row: { getValue: (k: string) => (row as any)[k], original: row } })}</>
  )
}

describe('buildDriverColumns', () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const columns = buildDriverColumns({ onEdit, onDelete })

  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 6 columnas', () => {
    expect(columns).toHaveLength(6)
  })

  describe('columna full_name', () => {
    const col = columns.find((c) => (c as any).id === 'full_name')!

    it('muestra nombre completo cuando tiene first_name y last_name', () => {
      renderCell(col, mockDriver)
      expect(screen.getByText('Carlos García')).toBeInTheDocument()
    })

    it('usa username cuando first_name y last_name están vacíos', () => {
      const driverNoName = {
        ...mockDriver,
        user: { ...mockDriver.user, first_name: '', last_name: '' },
      }
      renderCell(col, driverNoName)
      expect(screen.getByText('driver1')).toBeInTheDocument()
    })
  })

  describe('columna is_available', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'is_available')!

    it('muestra badge "Disponible" cuando is_available=true', () => {
      renderCell(col, { ...mockDriver, is_available: true })
      expect(screen.getByText('Disponible')).toBeInTheDocument()
    })

    it('muestra badge "No disponible" cuando is_available=false', () => {
      renderCell(col, { ...mockDriver, is_available: false })
      expect(screen.getByText('No disponible')).toBeInTheDocument()
    })
  })

  describe('columna actions', () => {
    const col = columns.find((c) => (c as any).id === 'actions')!

    it('botón Editar llama a onEdit con id correcto', () => {
      renderCell(col, mockDriver)
      fireEvent.click(screen.getByRole('button', { name: 'Editar conductor' }))
      expect(onEdit).toHaveBeenCalledWith(1)
    })

    it('botón Eliminar llama a onDelete con el driver completo', () => {
      renderCell(col, mockDriver)
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar conductor' }))
      expect(onDelete).toHaveBeenCalledWith(mockDriver)
    })
  })
})
