import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { buildShipmentColumns } from '@/components/shipments/ShipmentColumns'
import type { Shipment } from '@/types/shipments'

const mockShipment: Shipment = {
  id: 1, tracking_number: 'TRK-0001234567',
  customer: { id: 1, name: 'Cliente Test', email: 'cli@test.com', customer_type: 'company' },
  origin_warehouse: { id: 1, name: 'Almacén Central', city: 'Bogotá' },
  destination_address: 'Av. Corrientes 1234', destination_city: 'Buenos Aires',
  destination_country: 'Argentina', status: 'pending',
  route: { id: 1, name: 'Ruta Test', status: 'planned' },
  estimated_delivery: '2025-12-31', actual_delivery: null,
  total_weight_kg: '10.00', calculated_cost: '50000.00', notes: null,
  created_by: { id: 1, username: 'admin', email: 'admin@test.com' },
  items: [], created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function renderCell(col: ColumnDef<Shipment>, row: Shipment) {
  const CellFn = (col as any).cell as ((ctx: any) => React.ReactNode) | undefined
  if (!CellFn) return render(<div data-testid="no-cell" />)
  return render(
    <>{CellFn({ row: { getValue: (k: string) => (row as any)[k], original: row } })}</>
  )
}

describe('buildShipmentColumns', () => {
  const onEdit = vi.fn()
  // shipments solo tiene onEdit (sin onDelete)
  const columns = buildShipmentColumns({ onEdit })

  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 7 columnas', () => {
    expect(columns).toHaveLength(7)
  })

  describe('columna tracking_number', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'tracking_number')!

    it('renderiza el número de seguimiento en span mono', () => {
      renderCell(col, mockShipment)
      expect(screen.getByText('TRK-0001234567')).toBeInTheDocument()
    })
  })

  describe('columna customer', () => {
    const col = columns.find((c) => (c as any).id === 'customer')!

    it('muestra el nombre del cliente cuando existe', () => {
      renderCell(col, mockShipment)
      expect(screen.getByText('Cliente Test')).toBeInTheDocument()
    })

    it('muestra "—" cuando customer es null', () => {
      renderCell(col, { ...mockShipment, customer: null })
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('columna status', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'status')!

    it('muestra "Pendiente" para pending', () => {
      renderCell(col, { ...mockShipment, status: 'pending' })
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
    })

    it('muestra "En tránsito" para in_transit', () => {
      renderCell(col, { ...mockShipment, status: 'in_transit' })
      expect(screen.getByText('En tránsito')).toBeInTheDocument()
    })

    it('muestra "Entregado" para delivered', () => {
      renderCell(col, { ...mockShipment, status: 'delivered' })
      expect(screen.getByText('Entregado')).toBeInTheDocument()
    })

    it('muestra "Cancelado" para cancelled', () => {
      renderCell(col, { ...mockShipment, status: 'cancelled' })
      expect(screen.getByText('Cancelado')).toBeInTheDocument()
    })
  })

  describe('columna total_weight_kg', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'total_weight_kg')!

    it('muestra el peso con " kg"', () => {
      renderCell(col, mockShipment)
      expect(screen.getByText('10.00 kg')).toBeInTheDocument()
    })
  })

  describe('columna estimated_delivery', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'estimated_delivery')!

    it('muestra la fecha cuando existe', () => {
      renderCell(col, { ...mockShipment, estimated_delivery: '2025-12-31' })
      expect(screen.getByText('2025-12-31')).toBeInTheDocument()
    })

    it('muestra "—" cuando estimated_delivery es null', () => {
      renderCell(col, { ...mockShipment, estimated_delivery: null })
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('columna actions', () => {
    const col = columns.find((c) => (c as any).id === 'actions')!

    it('botón Editar llama a onEdit con id correcto', () => {
      renderCell(col, mockShipment)
      fireEvent.click(screen.getByRole('button', { name: 'Editar envío' }))
      expect(onEdit).toHaveBeenCalledWith(1)
    })
  })
})
