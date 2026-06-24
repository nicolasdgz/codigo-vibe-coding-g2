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
import type { CustomerListParams } from '@/types/customers'

interface CustomerFiltersProps {
  filters: CustomerListParams
  onChange: (filters: CustomerListParams) => void
  layout?: 'row' | 'col'
}

export function CustomerFilters({ filters, onChange, layout = 'row' }: CustomerFiltersProps) {
  const col = layout === 'col'

  function handleTypeChange(value: string) {
    onChange({
      ...filters,
      customer_type: value === 'all' ? undefined : (value as 'company' | 'person'),
      page: 1,
    })
  }

  function handleActiveChange(value: string) {
    onChange({
      ...filters,
      is_active: value === 'all' ? undefined : value === 'true',
      page: 1,
    })
  }

  const activeValue = filters.is_active === undefined ? 'all' : String(filters.is_active)
  const typeValue = filters.customer_type ?? 'all'

  if (col) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <DebouncedInput
            placeholder="Nombre, email, teléfono..."
            value={filters.search ?? ''}
            onChange={(value) => onChange({ ...filters, search: value || undefined, page: 1 })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tipo de cliente</Label>
          <Select value={typeValue} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="company">Empresa</SelectItem>
              <SelectItem value="person">Persona</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Estado</Label>
          <Select value={activeValue} onValueChange={handleActiveChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Ordenar por</Label>
          <Select
            value={filters.ordering ?? ''}
            onValueChange={(v) => onChange({ ...filters, ordering: v || undefined, page: 1 })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre A-Z</SelectItem>
              <SelectItem value="-name">Nombre Z-A</SelectItem>
              <SelectItem value="-created_at">Más recientes</SelectItem>
              <SelectItem value="created_at">Más antiguos</SelectItem>
            </SelectContent>
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
      <Select value={typeValue} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="company">Empresa</SelectItem>
          <SelectItem value="person">Persona</SelectItem>
        </SelectContent>
      </Select>
      <Select value={activeValue} onValueChange={handleActiveChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Activo</SelectItem>
          <SelectItem value="false">Inactivo</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.ordering ?? ''}
        onValueChange={(v) => onChange({ ...filters, ordering: v || undefined, page: 1 })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Nombre A-Z</SelectItem>
          <SelectItem value="-name">Nombre Z-A</SelectItem>
          <SelectItem value="-created_at">Más recientes</SelectItem>
          <SelectItem value="created_at">Más antiguos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
