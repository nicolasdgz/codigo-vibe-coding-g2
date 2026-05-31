# CLAUDE.md

Este archivo provee guía a Claude Code (claude.ai/code) para trabajar en este repositorio.

## Documentación de referencia

- **Schema de base de datos:** [`docs/database-schema.md`](docs/database-schema.md) — leer siempre antes de trabajar en modelos, migraciones, queries o relaciones entre tablas
- **Arquitectura del proyecto:** [`docs/architecture.md`](docs/architecture.md) — estructura de carpetas, stack, orden de desarrollo, convenciones y decisiones de diseño

## Contexto del proyecto

API REST para gestión logística de envíos de productos tecnológicos. Construida con Django REST Framework siguiendo buenas prácticas (serializers, viewsets, permisos, paginación, validaciones).

### Módulos

| App Django | Descripción |
|---|---|
| `customers` | Empresas o personas que generan envíos |
| `shipments` | Unidad central de negocio — origen, destino, estado, fecha de entrega, costo calculado |
| `products` | Productos tecnológicos que se envían |
| `transport` | Medio de transporte para entrega de productos |
| `drivers` | Conductores asignados al transporte |
| `routes` | Secuencia de paradas del transporte |
| `warehouses` | Puntos de partida y almacenamiento de productos |
| `suppliers` | Empresas proveedoras de productos |

---

## Metodología de desarrollo — SDD

Este proyecto usa **Spec Driven Development (SDD)**. El flujo obligatorio para desarrollar cualquier módulo es:

```
Spec → Implement → Validate → (corregir si hay errores) → módulo completo
```

**Para cualquier tarea de desarrollo de un módulo, invocar siempre el agente Orquestador:**

```
/orchestrator
```

El Orquestador coordina al equipo completo (Spec → Implement → Validator) en el orden correcto. No desarrolles módulos sin pasar por este flujo.

### Agentes disponibles (`.claude/agents/`)

| Agente | Rol |
|---|---|
| `orchestrator` | Coordina el flujo SDD. No escribe código |
| `spec` | Crea `spec/<módulo>.md` con tareas exactas |
| `implement` | Lee el spec y escribe código Django |
| `validator` | Verifica código vs spec y schema. No escribe código |

---

## Skills activos

- **django-skills** (`saaspegasus/django-skills`): usar siempre para tareas Django — modelos, migraciones, vistas, serializers, admin, tests, ORM, permisos, settings

## Reglas del proyecto

- **Documentación y comunicación:** siempre en español (comentarios en docs, respuestas, mensajes de análisis)
- **Código:** siempre en inglés — nombres de variables, funciones, clases, carpetas, tablas, columnas, rutas, ramas de git, todo artefacto de desarrollo
- **Entorno virtual:** activar `.venv` antes de ejecutar cualquier comando dentro del proyecto
- **Servidor de desarrollo:** `python manage.py runserver` nunca se ejecuta de forma automática — siempre lo corre el desarrollador manualmente
- **Antes de cualquier tarea de desarrollo:** leer [`docs/architecture.md`](docs/architecture.md) y [`docs/database-schema.md`](docs/database-schema.md) para respetar estructura, convenciones y relaciones definidas

## Stack

- **Framework:** Django 6.0.5 + Django REST Framework 3.17.1
- **Base de datos:** SQLite (dev) — psycopg2-binary instalado para migrar a PostgreSQL
- **Config de entorno:** python-decouple (`python-decouple==3.8`)
- **Entorno virtual:** `.venv/` en la raíz del proyecto

## Comandos

```bash
# Activar entorno virtual (Windows)
.venv\Scripts\activate

# Servidor de desarrollo (puerto 8000)
python manage.py runserver

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Tests
python manage.py test
python manage.py test products          # app específica

# Shell interactivo
python manage.py shell
```

## Configuración de entorno

No existe `.env.example` aún. Variables mínimas al cambiar de SQLite:

```
SECRET_KEY=
DATABASE_URL=
DEBUG=False
ALLOWED_HOSTS=
```

Lectura con `python-decouple`:
```python
from decouple import config
SECRET_KEY = config('SECRET_KEY')
```
