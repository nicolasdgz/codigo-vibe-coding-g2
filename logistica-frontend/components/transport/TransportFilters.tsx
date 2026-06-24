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
import type { TransportListParams, DriverSummary } from '@/types/transport'

interface TransportFiltersProps {
  filters: TransportListParams
  onChange: (filters: TransportListParams) => void
  driverOptions: DriverSummary[]
  isErrorDrivers: boolean
  layout?: 'row' | 'col'
}

export function TransportFilters({
  filters,
  onChange,
  driverOptions,
  isErrorDrivers,
  layout = 'row',
}: TransportFiltersProps) {
  const col = layout === 'col'

  function handleVehicleTypeChange(value: string) {
    onChange({ ...filters, vehicle_type: value === 'all' ? undefined : (value as TransportListParams['vehicle_type']), page: 1 })
  }
  function handleActiveChange(value: string) {
    onChange({ ...filters, is_active: value === 'all' ? undefined : value === 'true', page: 1 })
  }
  function handleDriverChange(value: string) {
    onChange({ ...filters, driver: value === 'all' ? undefined : Number(value), page: 1 })
  }

  const vehicleTypeValue = filters.vehicle_type ?? 'all'
  const activeValue = filters.is_active === undefined ? 'all' : String(filters.is_active)
  const driverValue = filters.driver === undefined ? 'all' : String(filters.driver)

  const vehicleTypeOptions = (
    <>
      <SelectItem value="all">Todos los tipos</SelectItem>
      <SelectItem value="truck">Camión</SelectItem>
      <SelectItem value="van">Furgoneta</SelectItem>
      <SelectItem value="motorcycle">Moto</SelectItem>
      <SelectItem value="car">Auto</SelectItem>
    </>
  )

  if (col) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <DebouncedInput
            placeholder="Placa, modelo..."
            value={filters.search ?? ''}
            onChange={(value) => onChange({ ...filters, search: value || undefined, page: 1 })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de vehículo</Label>
            <Select value={vehicleTypeValue} onValueChange={handleVehicleTypeChange}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>{vehicleTypeOptions}</SelectContent>
            </Select>
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
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Conductor</Label>
          <Select value={driverValue} onValueChange={handleDriverChange} disabled={isErrorDrivers}>
            <SelectTrigger className="w-full" aria-invalid={isErrorDrivers}>
              <SelectValue placeholder={isErrorDrivers ? 'Error al cargar' : 'Conductor'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los conductores</SelectItem>
              {driverOptions.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
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
      <Select value={vehicleTypeValue} onValueChange={handleVehicleTypeChange}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
        <SelectContent>{vehicleTypeOptions}</SelectContent>
      </Select>
      <Select value={activeValue} onValueChange={handleActiveChange}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="true">Activo</SelectItem>
          <SelectItem value="false">Inactivo</SelectItem>
        </SelectContent>
      </Select>
      <Select value={driverValue} onValueChange={handleDriverChange} disabled={isErrorDrivers}>
        <SelectTrigger className="w-44" aria-invalid={isErrorDrivers}>
          <SelectValue placeholder={isErrorDrivers ? 'Error al cargar' : 'Conductor'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los conductores</SelectItem>
          {driverOptions.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
