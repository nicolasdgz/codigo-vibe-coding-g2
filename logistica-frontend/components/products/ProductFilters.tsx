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
import type { ProductListParams, SupplierSummary, WarehouseSummary } from '@/types/products'

interface ProductFiltersProps {
  filters: ProductListParams
  onChange: (filters: ProductListParams) => void
  supplierOptions: SupplierSummary[]
  warehouseOptions: WarehouseSummary[]
  isLoadingSuppliers?: boolean
  isLoadingWarehouses?: boolean
  isErrorSuppliers?: boolean
  isErrorWarehouses?: boolean
  layout?: 'row' | 'col'
}

export function ProductFilters({
  filters,
  onChange,
  supplierOptions,
  warehouseOptions,
  isLoadingSuppliers = false,
  isLoadingWarehouses = false,
  isErrorSuppliers = false,
  isErrorWarehouses = false,
  layout = 'row',
}: ProductFiltersProps) {
  const col = layout === 'col'

  function handleSupplierChange(value: string) {
    onChange({ ...filters, supplier: value === 'all' ? undefined : Number(value), page: 1 })
  }
  function handleWarehouseChange(value: string) {
    onChange({ ...filters, warehouse: value === 'all' ? undefined : Number(value), page: 1 })
  }
  function handleActiveChange(value: string) {
    onChange({ ...filters, is_active: value === 'all' ? undefined : value === 'true', page: 1 })
  }
  function handleOrderingChange(value: string) {
    onChange({ ...filters, ordering: value || undefined, page: 1 })
  }

  const activeValue = filters.is_active === undefined ? 'all' : String(filters.is_active)
  const supplierValue = filters.supplier === undefined ? 'all' : String(filters.supplier)
  const warehouseValue = filters.warehouse === undefined ? 'all' : String(filters.warehouse)

  const orderingOptions = (
    <>
      <SelectItem value="name">Nombre A-Z</SelectItem>
      <SelectItem value="-name">Nombre Z-A</SelectItem>
      <SelectItem value="sku">SKU A-Z</SelectItem>
      <SelectItem value="-sku">SKU Z-A</SelectItem>
      <SelectItem value="unit_price">Precio asc.</SelectItem>
      <SelectItem value="-unit_price">Precio desc.</SelectItem>
      <SelectItem value="stock">Stock asc.</SelectItem>
      <SelectItem value="-stock">Stock desc.</SelectItem>
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
            placeholder="Nombre, SKU..."
            value={filters.search ?? ''}
            onChange={(value) => onChange({ ...filters, search: value || undefined, page: 1 })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Proveedor</Label>
          <Select value={supplierValue} onValueChange={handleSupplierChange} disabled={isLoadingSuppliers || isErrorSuppliers}>
            <SelectTrigger className="w-full" aria-invalid={isErrorSuppliers}>
              <SelectValue placeholder={isErrorSuppliers ? 'Error al cargar' : 'Proveedor'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {supplierOptions.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Almacén</Label>
          <Select value={warehouseValue} onValueChange={handleWarehouseChange} disabled={isLoadingWarehouses || isErrorWarehouses}>
            <SelectTrigger className="w-full" aria-invalid={isErrorWarehouses}>
              <SelectValue placeholder={isErrorWarehouses ? 'Error al cargar' : 'Almacén'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los almacenes</SelectItem>
              {warehouseOptions.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>)}
            </SelectContent>
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
      <Select value={supplierValue} onValueChange={handleSupplierChange} disabled={isLoadingSuppliers || isErrorSuppliers}>
        <SelectTrigger className="w-44" aria-invalid={isErrorSuppliers}>
          <SelectValue placeholder={isErrorSuppliers ? 'Error al cargar' : 'Proveedor'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los proveedores</SelectItem>
          {supplierOptions.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={warehouseValue} onValueChange={handleWarehouseChange} disabled={isLoadingWarehouses || isErrorWarehouses}>
        <SelectTrigger className="w-44" aria-invalid={isErrorWarehouses}>
          <SelectValue placeholder={isErrorWarehouses ? 'Error al cargar' : 'Almacén'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los almacenes</SelectItem>
          {warehouseOptions.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name} — {w.city}</SelectItem>)}
        </SelectContent>
      </Select>
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
