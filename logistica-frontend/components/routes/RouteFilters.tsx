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
import type { RouteListParams, TransportSummary, WarehouseSummary } from '@/types/routes'

interface RouteFiltersProps {
  filters: RouteListParams
  onChange: (filters: RouteListParams) => void
  transportOptions: TransportSummary[]
  warehouseOptions: WarehouseSummary[]
  isErrorTransport: boolean
  isErrorWarehouses: boolean
  layout?: 'row' | 'col'
}

export function RouteFilters({
  filters,
  onChange,
  transportOptions,
  warehouseOptions,
  isErrorTransport,
  isErrorWarehouses,
  layout = 'row',
}: RouteFiltersProps) {
  const col = layout === 'col'

  function handleStatusChange(value: string) {
    onChange({ ...filters, status: value === 'all' ? undefined : (value as RouteListParams['status']), page: 1 })
  }
  function handleTransportChange(value: string) {
    onChange({ ...filters, transport: value === 'all' ? undefined : Number(value), page: 1 })
  }
  function handleWarehouseChange(value: string) {
    onChange({ ...filters, origin_warehouse: value === 'all' ? undefined : Number(value), page: 1 })
  }

  const statusValue = filters.status ?? 'all'
  const transportValue = filters.transport === undefined ? 'all' : String(filters.transport)
  const warehouseValue = filters.origin_warehouse === undefined ? 'all' : String(filters.origin_warehouse)

  const statusOptions = (
    <>
      <SelectItem value="all">Todos los estados</SelectItem>
      <SelectItem value="planned">Planificada</SelectItem>
      <SelectItem value="in_progress">En curso</SelectItem>
      <SelectItem value="completed">Completada</SelectItem>
      <SelectItem value="cancelled">Cancelada</SelectItem>
    </>
  )

  if (col) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <DebouncedInput
            placeholder="Nombre de ruta..."
            value={filters.search ?? ''}
            onChange={(value) => onChange({ ...filters, search: value || undefined, page: 1 })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Estado</Label>
          <Select value={statusValue} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>{statusOptions}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Transporte</Label>
          <Select value={transportValue} onValueChange={handleTransportChange} disabled={isErrorTransport}>
            <SelectTrigger className="w-full" aria-invalid={isErrorTransport}>
              <SelectValue placeholder={isErrorTransport ? 'Error al cargar' : 'Transporte'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los transportes</SelectItem>
              {transportOptions.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.plate_number}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Almacén de origen</Label>
          <Select value={warehouseValue} onValueChange={handleWarehouseChange} disabled={isErrorWarehouses}>
            <SelectTrigger className="w-full" aria-invalid={isErrorWarehouses}>
              <SelectValue placeholder={isErrorWarehouses ? 'Error al cargar' : 'Almacén de origen'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los almacenes</SelectItem>
              {warehouseOptions.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>)}
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
      <Select value={statusValue} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>{statusOptions}</SelectContent>
      </Select>
      <Select value={transportValue} onValueChange={handleTransportChange} disabled={isErrorTransport}>
        <SelectTrigger className="w-44" aria-invalid={isErrorTransport}>
          <SelectValue placeholder={isErrorTransport ? 'Error al cargar' : 'Transporte'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los transportes</SelectItem>
          {transportOptions.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.plate_number}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={warehouseValue} onValueChange={handleWarehouseChange} disabled={isErrorWarehouses}>
        <SelectTrigger className="w-48" aria-invalid={isErrorWarehouses}>
          <SelectValue placeholder={isErrorWarehouses ? 'Error al cargar' : 'Almacén de origen'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los almacenes</SelectItem>
          {warehouseOptions.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
