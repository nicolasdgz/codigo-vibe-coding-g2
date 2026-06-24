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
import type { SupplierListParams } from '@/types/suppliers'

interface SupplierFiltersProps {
  filters: SupplierListParams
  onChange: (filters: SupplierListParams) => void
  layout?: 'row' | 'col'
}

export function SupplierFilters({ filters, onChange, layout = 'row' }: SupplierFiltersProps) {
  const col = layout === 'col'

  function handleActiveChange(value: string) {
    onChange({ ...filters, is_active: value === 'all' ? undefined : value === 'true', page: 1 })
  }
  function handleOrderingChange(value: string) {
    onChange({ ...filters, ordering: value || undefined, page: 1 })
  }

  const activeValue = filters.is_active === undefined ? 'all' : String(filters.is_active)

  const orderingOptions = (
    <>
      <SelectItem value="name">Nombre A-Z</SelectItem>
      <SelectItem value="-name">Nombre Z-A</SelectItem>
      <SelectItem value="contact_name">Contacto A-Z</SelectItem>
      <SelectItem value="-contact_name">Contacto Z-A</SelectItem>
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
            placeholder="Nombre, contacto..."
            value={filters.search ?? ''}
            onChange={(value) => onChange({ ...filters, search: value || undefined, page: 1 })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Estado</Label>
          <Select value={activeValue} onValueChange={handleActiveChange}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
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
      <Select value={activeValue} onValueChange={handleActiveChange}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Activo</SelectItem>
          <SelectItem value="false">Inactivo</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.ordering ?? ''} onValueChange={handleOrderingChange}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
        <SelectContent>{orderingOptions}</SelectContent>
      </Select>
    </div>
  )
}
