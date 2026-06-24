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
import type {
  ShipmentListParams,
  CustomerSummary,
  WarehouseSummary,
  RouteSummary,
} from '@/types/shipments'

interface ShipmentFiltersProps {
  filters: ShipmentListParams
  onChange: (filters: ShipmentListParams) => void
  customerOptions: CustomerSummary[]
  warehouseOptions: WarehouseSummary[]
  routeOptions: RouteSummary[]
  isErrorCustomers: boolean
  isErrorWarehouses: boolean
  isErrorRoutes: boolean
  layout?: 'row' | 'col'
}

export function ShipmentFilters({
  filters,
  onChange,
  customerOptions,
  warehouseOptions,
  routeOptions,
  isErrorCustomers,
  isErrorWarehouses,
  isErrorRoutes,
  layout = 'row',
}: ShipmentFiltersProps) {
  const col = layout === 'col'

  function handleStatusChange(value: string) {
    onChange({ ...filters, status: value === 'all' ? undefined : (value as ShipmentListParams['status']), page: 1 })
  }
  function handleCustomerChange(value: string) {
    onChange({ ...filters, customer: value === 'all' ? undefined : Number(value), page: 1 })
  }
  function handleWarehouseChange(value: string) {
    onChange({ ...filters, origin_warehouse: value === 'all' ? undefined : Number(value), page: 1 })
  }
  function handleRouteChange(value: string) {
    onChange({ ...filters, route: value === 'all' ? undefined : Number(value), page: 1 })
  }

  const statusValue = filters.status ?? 'all'
  const customerValue = filters.customer === undefined ? 'all' : String(filters.customer)
  const warehouseValue = filters.origin_warehouse === undefined ? 'all' : String(filters.origin_warehouse)
  const routeValue = filters.route === undefined ? 'all' : String(filters.route)

  const statusOptions = (
    <>
      <SelectItem value="all">Todos los estados</SelectItem>
      <SelectItem value="pending">Pendiente</SelectItem>
      <SelectItem value="in_transit">En tránsito</SelectItem>
      <SelectItem value="delivered">Entregado</SelectItem>
      <SelectItem value="cancelled">Cancelado</SelectItem>
      <SelectItem value="returned">Devuelto</SelectItem>
    </>
  )

  const orderingOptions = (
    <>
      <SelectItem value="-created_at">Más recientes</SelectItem>
      <SelectItem value="created_at">Más antiguos</SelectItem>
      <SelectItem value="estimated_delivery">Entrega asc.</SelectItem>
      <SelectItem value="-estimated_delivery">Entrega desc.</SelectItem>
      <SelectItem value="total_weight_kg">Peso asc.</SelectItem>
      <SelectItem value="-total_weight_kg">Peso desc.</SelectItem>
    </>
  )

  if (col) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <DebouncedInput
            placeholder="Tracking, destino..."
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
          <Label>Cliente</Label>
          <Select value={customerValue} onValueChange={handleCustomerChange} disabled={isErrorCustomers}>
            <SelectTrigger className="w-full" aria-invalid={isErrorCustomers}>
              <SelectValue placeholder={isErrorCustomers ? 'Error al cargar' : 'Cliente'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {customerOptions.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
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
        <div className="flex flex-col gap-1.5">
          <Label>Ruta</Label>
          <Select value={routeValue} onValueChange={handleRouteChange} disabled={isErrorRoutes}>
            <SelectTrigger className="w-full" aria-invalid={isErrorRoutes}>
              <SelectValue placeholder={isErrorRoutes ? 'Error al cargar' : 'Ruta'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las rutas</SelectItem>
              {routeOptions.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Ordenar por</Label>
          <Select value={filters.ordering ?? ''} onValueChange={(v) => onChange({ ...filters, ordering: v || undefined, page: 1 })}>
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
      <Select value={statusValue} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>{statusOptions}</SelectContent>
      </Select>
      <Select value={customerValue} onValueChange={handleCustomerChange} disabled={isErrorCustomers}>
        <SelectTrigger className="w-44" aria-invalid={isErrorCustomers}>
          <SelectValue placeholder={isErrorCustomers ? 'Error al cargar' : 'Cliente'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los clientes</SelectItem>
          {customerOptions.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
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
      <Select value={routeValue} onValueChange={handleRouteChange} disabled={isErrorRoutes}>
        <SelectTrigger className="w-44" aria-invalid={isErrorRoutes}>
          <SelectValue placeholder={isErrorRoutes ? 'Error al cargar' : 'Ruta'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las rutas</SelectItem>
          {routeOptions.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.ordering ?? ''} onValueChange={(v) => onChange({ ...filters, ordering: v || undefined, page: 1 })}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
        <SelectContent>{orderingOptions}</SelectContent>
      </Select>
    </div>
  )
}
