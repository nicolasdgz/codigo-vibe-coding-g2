# Arquitectura de Desarrollo — Logística API (MVP)

## Principios guía

- **MVP primero:** sin capas innecesarias. ViewSet → Model directo. Sin service layer, sin repository pattern.
- **Escalable:** estructura lista para agregar complejidad sin refactor mayor.
- **Convención sobre configuración:** seguir patrones DRF estándar para que cualquier dev se ubique rápido.

---

## Estructura de carpetas

```
logistica-api/
├── config/
│   ├── settings/
│   │   ├── base.py          ← settings compartidos
│   │   ├── development.py   ← DEBUG, SQLite, CORS abierto
│   │   └── production.py    ← PostgreSQL, ALLOWED_HOSTS, SECRET_KEY desde env
│   ├── urls.py              ← monta /api/v1/ y /admin/
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── customers/
│   ├── shipments/
│   ├── products/
│   ├── transport/
│   ├── drivers/
│   ├── routes/
│   ├── warehouses/
│   └── suppliers/
├── docs/
│   ├── database-schema.md
│   └── architecture.md
├── requirements/
│   ├── base.txt             ← dependencias productivas
│   └── development.txt      ← base.txt + herramientas dev
├── .env
├── manage.py
└── CLAUDE.md
```

### Estructura interna de cada app

```
apps/customers/
├── __init__.py
├── apps.py
├── models.py
├── serializers.py
├── views.py          ← ViewSets
├── urls.py           ← Router local
├── admin.py
├── permissions.py    ← solo si tiene permisos custom
└── tests/
    ├── __init__.py
    ├── test_models.py
    └── test_api.py
```

---

## Stack técnico (MVP)

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Django 6 + DRF 3.17 | ya instalado |
| Auth | `djangorestframework-simplejwt` | JWT stateless |
| Filtros | `django-filter` | filtrado por campos en querystring |
| Env vars | `python-decouple` | ya instalado |
| DB dev | SQLite | ya configurado |
| DB prod | PostgreSQL | `psycopg2-binary` ya instalado |
| Docs API | DRF Browsable API + Swagger (`drf-spectacular`) | auto-generado desde ViewSets |

### Dependencias a agregar

```
# requirements/base.txt
djangorestframework-simplejwt
django-filter
drf-spectacular
```

---

## API

### Versionado

Todas las rutas bajo `/api/v1/`:

```
/api/v1/auth/token/           POST  → obtener JWT
/api/v1/auth/token/refresh/   POST  → renovar JWT
/api/v1/customers/
/api/v1/warehouses/
/api/v1/suppliers/
/api/v1/products/
/api/v1/drivers/
/api/v1/transport/
/api/v1/routes/
/api/v1/routes/{id}/stops/
/api/v1/shipments/
/api/v1/shipments/{id}/items/
```

### Patrón de ViewSet

Usar `ModelViewSet` para CRUD estándar. Acciones de negocio como `@action`:

```python
# Ejemplo: cambio de estado de un envío
@action(detail=True, methods=['post'], url_path='status')
def update_status(self, request, pk=None):
    ...
```

### Paginación global

```python
# config/settings/base.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework_simplejwt.authentication.JWTAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
}
```

---

## Autenticación y roles

- **JWT** via `simplejwt` — stateless, sin sesiones de servidor
- **Roles** via `auth.Group`:

| Grupo | Acceso |
|---|---|
| `admin` | CRUD completo en todos los módulos |
| `warehouse_staff` | CRUD en warehouses, products, shipments |
| `driver` | Lectura de rutas y envíos asignados |

- Permisos por ViewSet usando `permission_classes` o `get_permissions()` según acción

---

## Orden de desarrollo (fases MVP)

Las apps tienen dependencias entre sí. Desarrollar en este orden para evitar bloqueos:

```
Fase 1 — Setup
  ├── Refactor settings → settings/base.py + development.py
  ├── Mover app products → apps/products (y demás)
  ├── Instalar y configurar simplejwt, django-filter, drf-spectacular
  └── Montar /api/v1/ en config/urls.py

Fase 2 — Apps sin dependencias (base del schema)
  ├── warehouses
  ├── suppliers
  └── customers

Fase 3 — Apps con dependencias simples
  ├── products  (depende de: warehouses, suppliers)
  └── drivers   (depende de: auth.User)

Fase 4 — Apps con dependencias compuestas
  ├── transport (depende de: drivers)
  └── routes    (depende de: transport, warehouses)
       └── route_stops (modelo anidado en routes)

Fase 5 — App central
  └── shipments (depende de: customers, warehouses, routes, products)
       └── shipment_items (modelo anidado en shipments)

Fase 6 — Calidad
  ├── Tests por app
  ├── Validaciones de negocio (stock, capacidad, estados)
  └── Swagger /api/docs/
```

---

## Convenciones

### Modelos

- Todos heredan de modelo base abstracto con `created_at` / `updated_at`:

```python
# apps/core/models.py  (crear este archivo)
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

- `choices` como clase interna o constantes en el modelo, no strings sueltos

### Serializers

- Serializer de lectura (anidado) separado del de escritura (IDs) cuando aplica
- Validaciones de negocio en `validate_<field>()` o `validate()`

### URLs

- Cada app registra su propio `router` en `urls.py`
- `config/urls.py` incluye todos vía `include()`

### Responses de error

Usar excepciones DRF nativas (`ValidationError`, `PermissionDenied`, `NotFound`) — DRF las convierte a JSON automáticamente.

---

## Lo que NO entra en el MVP

| Feature | Motivo |
|---|---|
| Celery / tareas async | Complejidad innecesaria en MVP |
| Caché (Redis) | Sin carga real aún |
| WebSockets | No requerido |
| Soft-delete global | `is_active` es suficiente por ahora |
| Multitenancy | Fuera de alcance |
| CI/CD pipeline | Post-MVP |
