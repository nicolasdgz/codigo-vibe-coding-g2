import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { buildTransportColumns } from '@/components/transport/TransportColumns'
import type { Transport } from '@/types/transport'

const mockTransport: Transport = {
  id: 1, plate_number: 'ABC-123', vehicle_type: 'truck',
  brand: 'Mercedes', model: 'Sprinter', year: 2022,
  capacity_kg: '8000.00', capacity_units: 100,
  driver: { id: 1, license_number: 'LIC-001', name: 'Carlos García', is_available: true },
  is_active: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function renderCell(col: ColumnDef<Transport>, row: Transport) {
  const CellFn = (col as any).cell as ((ctx: any) => React.ReactNode) | undefined
  if (!CellFn) return render(<div data-testid="no-cell" />)
  return render(
    <>{CellFn({ row: { getValue: (k: string) => (row as any)[k], original: row } })}</>
  )
}

describe('buildTransportColumns', () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const columns = buildTransportColumns({ onEdit, onDelete })

  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 9 columnas', () => {
    expect(columns).toHaveLength(9)
  })

  describe('columna vehicle_type', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'vehicle_type')!

    it('muestra "Camión" para truck', () => {
      renderCell(col, { ...mockTransport, vehicle_type: 'truck' })
      expect(screen.getByText('Camión')).toBeInTheDocument()
    })

    it('muestra "Furgoneta" para van', () => {
      renderCell(col, { ...mockTransport, vehicle_type: 'van' })
      expect(screen.getByText('Furgoneta')).toBeInTheDocument()
    })

    it('muestra "Moto" para motorcycle', () => {
      renderCell(col, { ...mockTransport, vehicle_type: 'motorcycle' })
      expect(screen.getByText('Moto')).toBeInTheDocument()
    })

    it('muestra "Auto" para car', () => {
      renderCell(col, { ...mockTransport, vehicle_type: 'car' })
      expect(screen.getByText('Auto')).toBeInTheDocument()
    })
  })

  describe('columna capacity_kg', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'capacity_kg')!

    it('muestra el valor con " kg" al final', () => {
      renderCell(col, mockTransport)
      expect(screen.getByText('8000.00 kg')).toBeInTheDocument()
    })
  })

  describe('columna driver_name', () => {
    const col = columns.find((c) => (c as any).id === 'driver_name')!

    it('muestra el nombre del conductor cuando existe', () => {
      renderCell(col, mockTransport)
      expect(screen.getByText('Carlos García')).toBeInTheDocument()
    })

    it('muestra "—" cuando no hay conductor', () => {
      renderCell(col, { ...mockTransport, driver: null })
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('columna is_active', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'is_active')!

    it('muestra badge "Activo" cuando is_active=true', () => {
      renderCell(col, { ...mockTransport, is_active: true })
      expect(screen.getByText('Activo')).toBeInTheDocument()
    })

    it('muestra badge "Inactivo" cuando is_active=false', () => {
      renderCell(col, { ...mockTransport, is_active: false })
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  describe('columna actions', () => {
    const col = columns.find((c) => (c as any).id === 'actions')!

    it('botón Editar llama a onEdit con id correcto', () => {
      renderCell(col, mockTransport)
      fireEvent.click(screen.getByRole('button', { name: 'Editar vehículo' }))
      expect(onEdit).toHaveBeenCalledWith(1)
    })

    it('botón Eliminar llama a onDelete con el transport completo', () => {
      renderCell(col, mockTransport)
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar vehículo' }))
      expect(onDelete).toHaveBeenCalledWith(mockTransport)
    })
  })
})
