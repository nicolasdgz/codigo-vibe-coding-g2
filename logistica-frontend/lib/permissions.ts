export const MODULES = {
  customers: {
    view:   'customers.view_customer',
    add:    'customers.add_customer',
    change: 'customers.change_customer',
    delete: 'customers.delete_customer',
  },
  warehouses: {
    view:   'warehouses.view_warehouse',
    add:    'warehouses.add_warehouse',
    change: 'warehouses.change_warehouse',
    delete: 'warehouses.delete_warehouse',
  },
  suppliers: {
    view:   'suppliers.view_supplier',
    add:    'suppliers.add_supplier',
    change: 'suppliers.change_supplier',
    delete: 'suppliers.delete_supplier',
  },
  products: {
    view:   'products.view_product',
    add:    'products.add_product',
    change: 'products.change_product',
    delete: 'products.delete_product',
  },
  drivers: {
    view:   'drivers.view_driver',
    add:    'drivers.add_driver',
    change: 'drivers.change_driver',
    delete: 'drivers.delete_driver',
  },
  transport: {
    view:   'transport.view_transport',
    add:    'transport.add_transport',
    change: 'transport.change_transport',
    delete: 'transport.delete_transport',
  },
  routes: {
    view:   'routes.view_route',
    add:    'routes.add_route',
    change: 'routes.change_route',
    delete: 'routes.delete_route',
  },
  shipments: {
    view:   'shipments.view_shipment',
    add:    'shipments.add_shipment',
    change: 'shipments.change_shipment',
    delete: 'shipments.delete_shipment',
  },
} as const

export type ModuleKey = keyof typeof MODULES
export type ModuleAction = 'view' | 'add' | 'change' | 'delete'

type PermUser = { is_superuser: boolean; permissions: string[] } | null

export function canAccessModule(
  user: PermUser,
  module: ModuleKey,
  action: ModuleAction = 'view'
): boolean {
  if (!user) return false
  if (user.is_superuser) return true
  return (user.permissions ?? []).includes(MODULES[module][action])
}
