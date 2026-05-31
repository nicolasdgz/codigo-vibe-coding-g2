# Schema de Base de Datos — Logística API

## Tablas Django (ya existen, no se crean)

| Tabla | Uso en el proyecto |
|---|---|
| `auth_user` | Acceso al sistema (staff, drivers con portal, admins) |
| `auth_group` | Roles: `admin`, `warehouse_staff`, `driver` |
| `auth_permission` | Permisos granulares por grupo |

---

## Tablas del proyecto

### `customers`

Empresas o personas que generan envíos.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `name` | VARCHAR(255) | nombre empresa o persona |
| `customer_type` | VARCHAR(10) | choices: `company` / `person` |
| `email` | VARCHAR(254), unique | |
| `phone` | VARCHAR(20) | |
| `address` | TEXT | |
| `tax_id` | VARCHAR(50), unique, nullable | NIT / RUT |
| `is_active` | BOOLEAN, default TRUE | |
| `created_at` | DATETIME, auto | |
| `updated_at` | DATETIME, auto | |

---

### `warehouses`

Puntos de partida y almacenamiento de productos.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `name` | VARCHAR(255) | |
| `address` | TEXT | |
| `city` | VARCHAR(100) | |
| `country` | VARCHAR(100) | |
| `latitude` | DECIMAL(9,6), nullable | |
| `longitude` | DECIMAL(9,6), nullable | |
| `capacity` | INTEGER | unidades máximas de almacenamiento |
| `is_active` | BOOLEAN, default TRUE | |
| `created_at` | DATETIME, auto | |
| `updated_at` | DATETIME, auto | |

---

### `suppliers`

Empresas proveedoras de productos tecnológicos.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `name` | VARCHAR(255) | |
| `email` | VARCHAR(254) | |
| `phone` | VARCHAR(20) | |
| `address` | TEXT | |
| `tax_id` | VARCHAR(50), unique | |
| `contact_name` | VARCHAR(255) | persona de contacto |
| `is_active` | BOOLEAN, default TRUE | |
| `created_at` | DATETIME, auto | |
| `updated_at` | DATETIME, auto | |

---

### `products`

Productos tecnológicos que se envían.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `name` | VARCHAR(255) | |
| `description` | TEXT, nullable | |
| `sku` | VARCHAR(100), unique | código de identificación de producto |
| `weight_kg` | DECIMAL(8,2) | peso en kilogramos |
| `dimensions` | VARCHAR(50), nullable | formato: `LxWxH cm` |
| `unit_price` | DECIMAL(10,2) | |
| `stock` | INTEGER, default 0 | |
| `supplier_id` | FK → `suppliers.id` | |
| `warehouse_id` | FK → `warehouses.id` | bodega donde se almacena |
| `is_active` | BOOLEAN, default TRUE | |
| `created_at` | DATETIME, auto | |
| `updated_at` | DATETIME, auto | |

---

### `drivers`

Conductores asignados al transporte.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `user_id` | OneToOne → `auth_user.id` | acceso al portal del conductor |
| `license_number` | VARCHAR(50), unique | número de licencia de conducción |
| `license_expiry` | DATE | fecha de vencimiento de licencia |
| `phone` | VARCHAR(20) | |
| `is_available` | BOOLEAN, default TRUE | disponibilidad para asignación |
| `created_at` | DATETIME, auto | |
| `updated_at` | DATETIME, auto | |

---

### `transport`

Vehículos usados para la entrega de productos.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `plate_number` | VARCHAR(20), unique | placa del vehículo |
| `vehicle_type` | VARCHAR(20) | choices: `truck` / `van` / `motorcycle` / `car` |
| `brand` | VARCHAR(100) | |
| `model` | VARCHAR(100) | |
| `year` | INTEGER | |
| `capacity_kg` | DECIMAL(8,2) | peso máximo de carga en kg |
| `capacity_units` | INTEGER | unidades máximas de carga |
| `driver_id` | FK → `drivers.id`, nullable | conductor actualmente asignado |
| `is_active` | BOOLEAN, default TRUE | |
| `created_at` | DATETIME, auto | |
| `updated_at` | DATETIME, auto | |

---

### `routes`

Rutas de entrega asignadas a un transporte.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `name` | VARCHAR(255) | |
| `origin_warehouse_id` | FK → `warehouses.id` | bodega de inicio de la ruta |
| `transport_id` | FK → `transport.id` | |
| `status` | VARCHAR(20) | choices: `planned` / `in_progress` / `completed` / `cancelled` |
| `scheduled_date` | DATE | fecha programada de ejecución |
| `created_at` | DATETIME, auto | |
| `updated_at` | DATETIME, auto | |

---

### `route_stops`

Paradas secuenciales dentro de una ruta.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `route_id` | FK → `routes.id` | |
| `order` | INTEGER | posición en la secuencia de paradas |
| `address` | TEXT | |
| `city` | VARCHAR(100) | |
| `estimated_arrival` | DATETIME, nullable | hora estimada de llegada |
| `actual_arrival` | DATETIME, nullable | hora real de llegada |

---

### `shipments`

Unidad central de negocio. Representa un envío de productos a un cliente.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `tracking_number` | VARCHAR(50), unique | generado automáticamente al crear |
| `customer_id` | FK → `customers.id` | |
| `origin_warehouse_id` | FK → `warehouses.id` | bodega de despacho |
| `destination_address` | TEXT | |
| `destination_city` | VARCHAR(100) | |
| `destination_country` | VARCHAR(100) | |
| `status` | VARCHAR(20) | choices: `pending` / `in_transit` / `delivered` / `cancelled` / `returned` |
| `route_id` | FK → `routes.id`, nullable | asignado al momento del despacho |
| `estimated_delivery` | DATE, nullable | |
| `actual_delivery` | DATETIME, nullable | |
| `total_weight_kg` | DECIMAL(8,2) | calculado a partir de los items |
| `calculated_cost` | DECIMAL(10,2) | costo calculado del envío |
| `notes` | TEXT, nullable | observaciones |
| `created_by_id` | FK → `auth_user.id` | usuario que registró el envío |
| `created_at` | DATETIME, auto | |
| `updated_at` | DATETIME, auto | |

---

### `shipment_items`

Productos incluidos dentro de un envío.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | PK, auto | |
| `shipment_id` | FK → `shipments.id` | |
| `product_id` | FK → `products.id` | |
| `quantity` | INTEGER | |
| `unit_price` | DECIMAL(10,2) | precio al momento del envío (snapshot) |
| `subtotal` | DECIMAL(10,2) | `quantity × unit_price` |

---

## Relaciones entre tablas

```
auth_user ──────────────────────────────────┐
    │ (1:1)                                 │ (1:N created_by)
    ▼                                       ▼
drivers                                 shipments ◄──── customers (1:N)
    │ (1:N)                             ▲       │
    ▼                                   │       │ (1:N)
transport ──► routes ───────────────────┘       ▼
                │ (1:N)                   shipment_items
                ▼                               │ (N:1)
           route_stops                          ▼
                                            products
warehouses ◄──────────────── products          │ (N:1)
    │ (1:N origin)              (N:1)          ▼
    ▼                                      suppliers
shipments / routes
```

### Resumen

| Relación | Tipo | Descripción |
|---|---|---|
| `Customer` → `Shipment` | 1:N | un cliente genera muchos envíos |
| `Warehouse` → `Shipment` (origin) | 1:N | una bodega despacha muchos envíos |
| `Warehouse` → `Product` | 1:N | una bodega almacena muchos productos |
| `Supplier` → `Product` | 1:N | un proveedor suministra muchos productos |
| `Shipment` → `ShipmentItem` | 1:N | un envío contiene varios productos |
| `Product` → `ShipmentItem` | 1:N | un producto aparece en varios envíos |
| `Route` → `Shipment` | 1:N | una ruta agrupa varios envíos |
| `Route` → `RouteStop` | 1:N | una ruta tiene varias paradas |
| `Transport` → `Route` | 1:N | un transporte ejecuta varias rutas |
| `Driver` → `Transport` | 1:N | un conductor puede manejar distintos vehículos |
| `auth.User` → `Driver` | 1:1 | cada conductor tiene un usuario del sistema |
| `auth.User` → `Shipment` (created_by) | 1:N | un usuario registra muchos envíos |
