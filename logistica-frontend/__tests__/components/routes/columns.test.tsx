import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { buildRouteColumns } from '@/components/routes/RouteColumns'
import type { Route } from '@/types/routes'

const mockRoute: Route = {
  id: 1, name: 'Ruta Bogotá-Medellín',
  origin_warehouse: { id: 1, name: 'Almacén Central', city: 'Bogotá' },
  transport: { id: 1, plate_number: 'ABC-123', vehicle_type: 'truck', brand: 'Mercedes' },
  status: 'planned', scheduled_date: '2025-12-01', stops: [],
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function renderCell(col: ColumnDef<Route>, row: Route) {
  const CellFn = (col as any).cell as ((ctx: any) => React.ReactNode) | undefined
  if (!CellFn) return render(<div data-testid="no-cell" />)
  return render(
    <>{CellFn({ row: { getValue: (k: string) => (row as any)[k], original: row } })}</>
  )
}

describe('buildRouteColumns', () => {
  const onEdit = vi.fn()
  // routes solo tiene onEdit (sin onDelete)
  const columns = buildRouteColumns({ onEdit })

  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 6 columnas', () => {
    expect(columns).toHaveLength(6)
  })

  describe('columna status', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'status')!

    it('muestra badge "Planificada" para planned', () => {
      renderCell(col, { ...mockRoute, status: 'planned' })
      expect(screen.getByText('Planificada')).toBeInTheDocument()
    })

    it('muestra badge "En curso" para in_progress', () => {
      renderCell(col, { ...mockRoute, status: 'in_progress' })
      expect(screen.getByText('En curso')).toBeInTheDocument()
    })

    it('muestra badge "Completada" para completed', () => {
      renderCell(col, { ...mockRoute, status: 'completed' })
      expect(screen.getByText('Completada')).toBeInTheDocument()
    })

    it('muestra badge "Cancelada" para cancelled', () => {
      renderCell(col, { ...mockRoute, status: 'cancelled' })
      expect(screen.getByText('Cancelada')).toBeInTheDocument()
    })
  })

  describe('columna origin_warehouse', () => {
    const col = columns.find((c) => (c as any).id === 'origin_warehouse')!

    it('muestra nombre y ciudad del almacén', () => {
      renderCell(col, mockRoute)
      expect(screen.getByText('Almacén Central — Bogotá')).toBeInTheDocument()
    })
  })

  describe('columna transport', () => {
    const col = columns.find((c) => (c as any).id === 'transport')!

    it('muestra la matrícula cuando hay transporte', () => {
      renderCell(col, mockRoute)
      expect(screen.getByText('ABC-123')).toBeInTheDocument()
    })

    it('muestra "—" cuando no hay transporte', () => {
      renderCell(col, { ...mockRoute, transport: null })
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('columna actions', () => {
    const col = columns.find((c) => (c as any).id === 'actions')!

    it('botón Editar llama a onEdit con id correcto', () => {
      renderCell(col, mockRoute)
      fireEvent.click(screen.getByRole('button', { name: 'Editar ruta' }))
      expect(onEdit).toHaveBeenCalledWith(1)
    })
  })
})
