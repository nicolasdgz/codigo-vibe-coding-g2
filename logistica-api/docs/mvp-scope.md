# Alcance del MVP — Logística API

## Objetivo

Construir una API REST funcional para gestión logística de envíos de productos tecnológicos, lista para desplegar en Railway.

---

## Módulos incluidos (CRUD completo)

El MVP cubre 8 apps Django. Cada una expone un `ModelViewSet` bajo `/api/v1/`:

| App | Ruta base | Descripción |
|---|---|---|
| `warehouses` | `/api/v1/warehouses/` | Bodegas de almacenamiento y despacho |
| `suppliers` | `/api/v1/suppliers/` | Proveedores de productos |
| `customers` | `/api/v1/customers/` | Clientes que generan envíos |
| `products` | `/api/v1/products/` | Productos tecnológicos |
| `drivers` | `/api/v1/drivers/` | Conductores de transporte |
| `transport` | `/api/v1/transport/` | Vehículos de entrega |
| `routes` | `/api/v1/routes/` | Rutas con paradas secuenciales |
| `shipments` | `/api/v1/shipments/` | Envíos (unidad central de negocio) |

### Operaciones por módulo

Cada módulo incluye:

- `GET /api/v1/<módulo>/` — listar con paginación y filtros
- `POST /api/v1/<módulo>/` — crear
- `GET /api/v1/<módulo>/{id}/` — obtener por ID
- `PUT /api/v1/<módulo>/{id}/` — reemplazar
- `PATCH /api/v1/<módulo>/{id}/` — actualizar parcial
- `DELETE /api/v1/<módulo>/{id}/` — eliminar

### Sub-recursos anidados

- `GET/POST /api/v1/routes/{id}/stops/` — paradas de una ruta
- `GET/POST /api/v1/shipments/{id}/items/` — items de un envío

---

## Autenticación

**JWT stateless** via `djangorestframework-simplejwt`.

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/v1/auth/token/` | POST | Obtener access + refresh token |
| `/api/v1/auth/token/refresh/` | POST | Renovar access token |

- Todos los endpoints de negocio requieren `Authorization: Bearer <token>`
- Tokens configurados con expiración estándar (access: 5 min, refresh: 1 día)

---

## Roles y permisos

Implementados via `auth.Group` de Django:

| Grupo | Permisos |
|---|---|
| `admin` | CRUD completo en todos los módulos |
| `warehouse_staff` | CRUD en warehouses, products, shipments |
| `driver` | Solo lectura en routes y shipments asignados |

---

## Orden de desarrollo

Según dependencias del schema (ver `docs/database-schema.md`):

```
Fase 1 — Setup inicial
  ├── Refactor settings → settings/base.py + development.py + production.py
  ├── Mover apps a carpeta apps/
  ├── Instalar simplejwt, django-filter, drf-spectacular
  └── Configurar /api/v1/ + /api/docs/

Fase 2 — Apps base (sin dependencias externas)
  ├── warehouses
  ├── suppliers
  └── customers

Fase 3 — Apps con dependencias simples
  ├── products (depende de warehouses, suppliers)
  └── drivers  (depende de auth.User)

Fase 4 — Apps compuestas
  ├── transport (depende de drivers)
  └── routes    (depende de transport, warehouses)

Fase 5 — App central
  └── shipments (depende de customers, warehouses, routes, products)
```

---

## Deploy en Railway

### Variables de entorno requeridas en producción

```
SECRET_KEY=<valor-seguro>
DATABASE_URL=postgresql://...
DEBUG=False
ALLOWED_HOSTS=<dominio-railway>.railway.app
```

### Configuración de producción

- Settings: `config/settings/production.py`
- Base de datos: PostgreSQL provisto por Railway
- `psycopg2-binary` ya instalado
- `STATIC_ROOT` configurado para `collectstatic`
- `Procfile` o `railway.json` para el comando de inicio: `gunicorn config.wsgi:application`

### Dependencia adicional para prod

```
gunicorn
```

---

## Fuera del alcance del MVP

| Feature | Motivo |
|---|---|
| Celery / tareas asíncronas | Complejidad innecesaria |
| Caché Redis | Sin carga real aún |
| WebSockets / notificaciones en tiempo real | No requerido |
| Soft-delete global automático | `is_active` es suficiente |
| Multitenancy | Fuera de alcance |
| Pipeline CI/CD | Post-MVP |
| Frontend | API únicamente |

---

## Criterios de "done" del MVP

- [ ] Los 8 módulos responden correctamente a operaciones CRUD
- [ ] Auth JWT funciona (obtener token, usar token, renovar token)
- [ ] Permisos por rol aplicados y verificados
- [ ] Swagger disponible en `/api/docs/`
- [ ] Desplegado en Railway con PostgreSQL
- [ ] Tests básicos de modelo y API por cada módulo
