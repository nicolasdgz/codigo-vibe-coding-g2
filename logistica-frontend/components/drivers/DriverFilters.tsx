'use client'

import { DebouncedInput } from '@/components/ui/debounced-input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DriverListParams } from '@/types/drivers'

interface DriverFiltersProps {
  filters: DriverListParams
  onChange: (filters: DriverListParams) => void
  layout?: 'row' | 'col'
}

export function DriverFilters({ filters, onChange, layout = 'row' }: DriverFiltersProps) {
  const col = layout === 'col'

  function handleAvailableChange(value: string) {
    onChange({ ...filters, is_available: value === 'all' ? undefined : value === 'true', page: 1 })
  }
  function handleOrderingChange(value: string) {
    onChange({ ...filters, ordering: value || undefined, page: 1 })
  }

  const availableValue = filters.is_available === undefined ? 'all' : String(filters.is_available)

  const orderingOptions = (
    <>
      <SelectItem value="license_expiry">Vencimiento A-Z</SelectItem>
      <SelectItem value="-license_expiry">Vencimiento Z-A</SelectItem>
      <SelectItem value="license_number">Licencia A-Z</SelectItem>
      <SelectItem value="-license_number">Licencia Z-A</SelectItem>
      <SelectItem value="-created_at">Más recientes</SelectItem>
      <SelectItem value="created_at">Más antiguos</SelectItem>
    </>
  )

  if (col) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <DebouncedInput
            placeholder="Nombre, licencia..."
            value={filters.search ?? ''}
            onChange={(value) => onChange({ ...filters, search: value || undefined, page: 1 })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Disponibilidad</Label>
          <Select value={availableValue} onValueChange={handleAvailableChange}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Disponibilidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Disponible</SelectItem>
              <SelectItem value="false">No disponible</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Ordenar por</Label>
          <Select value={filters.ordering ?? ''} onValueChange={handleOrderingChange}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
            <SelectContent>{orderingOptions}</SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DebouncedInput
        placeholder="Buscar..."
        value={filters.search ?? ''}
        onChange={(value) => onChange({ ...filters, search: value || undefined, page: 1 })}
        className="w-48"
      />
      <Select value={availableValue} onValueChange={handleAvailableChange}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Disponibilidad" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Disponible</SelectItem>
          <SelectItem value="false">No disponible</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.ordering ?? ''} onValueChange={handleOrderingChange}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
        <SelectContent>{orderingOptions}</SelectContent>
      </Select>
    </div>
  )
}
