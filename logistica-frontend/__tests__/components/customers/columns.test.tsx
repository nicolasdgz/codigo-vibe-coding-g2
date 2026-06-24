import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { buildCustomerColumns } from '@/components/customers/CustomerColumns'
import type { Customer } from '@/types/customers'

const mockCustomer: Customer = {
  id: 1, name: 'ACME Corp', customer_type: 'company',
  email: 'acme@test.com', phone: '555-1234', address: 'Av. Test 123',
  tax_id: 'ACME-123', is_active: true,
  created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
}

function renderCell(col: ColumnDef<Customer>, row: Customer) {
  const CellFn = (col as any).cell as ((ctx: any) => React.ReactNode) | undefined
  if (!CellFn) return render(<div data-testid="no-cell" />)
  return render(
    <>{CellFn({ row: { getValue: (k: string) => (row as any)[k], original: row } })}</>
  )
}

describe('buildCustomerColumns', () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const columns = buildCustomerColumns({ onEdit, onDelete })

  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 6 columnas', () => {
    expect(columns).toHaveLength(6)
  })

  describe('columna customer_type', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'customer_type')!

    it('muestra badge "Empresa" para company', () => {
      renderCell(col, { ...mockCustomer, customer_type: 'company' })
      expect(screen.getByText('Empresa')).toBeInTheDocument()
    })

    it('muestra badge "Persona" para person', () => {
      renderCell(col, { ...mockCustomer, customer_type: 'person' })
      expect(screen.getByText('Persona')).toBeInTheDocument()
    })
  })

  describe('columna is_active', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'is_active')!

    it('muestra badge "Activo" cuando is_active=true', () => {
      renderCell(col, { ...mockCustomer, is_active: true })
      expect(screen.getByText('Activo')).toBeInTheDocument()
    })

    it('muestra badge "Inactivo" cuando is_active=false', () => {
      renderCell(col, { ...mockCustomer, is_active: false })
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  describe('columna name', () => {
    const col = columns.find((c) => (c as any).accessorKey === 'name')!

    it('renderiza el nombre en span', () => {
      renderCell(col, mockCustomer)
      expect(screen.getByText('ACME Corp')).toBeInTheDocument()
    })
  })

  describe('columna actions', () => {
    const col = columns.find((c) => (c as any).id === 'actions')!

    it('botón Editar llama a onEdit con id correcto', () => {
      renderCell(col, mockCustomer)
      fireEvent.click(screen.getByRole('button', { name: 'Editar cliente' }))
      expect(onEdit).toHaveBeenCalledWith(1)
    })

    it('botón Eliminar llama a onDelete con el customer completo', () => {
      renderCell(col, mockCustomer)
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar cliente' }))
      expect(onDelete).toHaveBeenCalledWith(mockCustomer)
    })
  })
})
