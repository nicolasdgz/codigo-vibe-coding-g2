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
import type { WarehouseListParams } from '@/types/warehouses'

interface WarehouseFiltersProps {
  filters: WarehouseListParams
  onChange: (filters: WarehouseListParams) => void
  layout?: 'row' | 'col'
}

export function WarehouseFilters({ filters, onChange, layout = 'row' }: WarehouseFiltersProps) {
  const col = layout === 'col'

  function handleActiveChange(value: string) {
    onChange({ ...filters, is_active: value === 'all' ? undefined : value === 'true', page: 1 })
  }
  function handleOrderingChange(value: string) {
    onChange({ ...filters, ordering: value || undefined, page: 1 })
  }

  const activeValue = filters.is_active === undefined ? 'all' : String(filters.is_active)

  const orderingSelect = (
    <Select value={filters.ordering ?? ''} onValueChange={handleOrderingChange}>
      <SelectTrigger className={col ? 'w-full' : 'w-44'}>
        <SelectValue placeholder="Ordenar por" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="name">Nombre A-Z</SelectItem>
        <SelectItem value="-name">Nombre Z-A</SelectItem>
        <SelectItem value="city">Ciudad A-Z</SelectItem>
        <SelectItem value="-city">Ciudad Z-A</SelectItem>
        <SelectItem value="-created_at">Más recientes</SelectItem>
        <SelectItem value="created_at">Más antiguos</SelectItem>
      </SelectContent>
    </Select>
  )

  if (col) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <DebouncedInput
            placeholder="Nombre, dirección..."
            value={filters.search ?? ''}
            onChange={(value) => onChange({ ...filters, search: value || undefined, page: 1 })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Ciudad</Label>
            <DebouncedInput
              placeholder="Ciudad"
              value={filters.city ?? ''}
              onChange={(value) => onChange({ ...filters, city: value || undefined, page: 1 })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>País</Label>
            <DebouncedInput
              placeholder="País"
              value={filters.country ?? ''}
              onChange={(value) => onChange({ ...filters, country: value || undefined, page: 1 })}
            />
          </div>
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
          {orderingSelect}
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
      <DebouncedInput
        placeholder="Ciudad"
        value={filters.city ?? ''}
        onChange={(value) => onChange({ ...filters, city: value || undefined, page: 1 })}
        className="w-36"
      />
      <DebouncedInput
        placeholder="País"
        value={filters.country ?? ''}
        onChange={(value) => onChange({ ...filters, country: value || undefined, page: 1 })}
        className="w-36"
      />
      <Select value={activeValue} onValueChange={handleActiveChange}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Activo</SelectItem>
          <SelectItem value="false">Inactivo</SelectItem>
        </SelectContent>
      </Select>
      {orderingSelect}
    </div>
  )
}
