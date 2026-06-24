# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **WARNING (from AGENTS.md):** This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Agent Workflow (SDD — Spec-Driven Development)

**When the user says "start module X", "build module X", or "implement module X" → always delegate to the `orchester` agent. Never write module code directly.**

The build cycle for every module:
1. **Spect** — writes `docs/specs/{module}.md` (never skipped)
2. **Human approval** — human reviews spec before any code is written (never skipped)
3. **Implement** — builds all types, services, hooks, components, pages
4. **Validator** — verifies code against spec, marks tasks `[x]`, reports failures

**Rules:**
- Work one module at a time
- Follow the build order in `docs/mvp.md`
- Never implement a module without an approved spec at `docs/specs/{module}.md`
- Available agents: `orchester`, `spect`, `implement`, `validator` (`.claude/agents/`)

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| UI | React 19.2.4 |
| Language | TypeScript 5 (strict) |
| Styles | Tailwind CSS 4 via PostCSS |
| HTTP Client | Axios (`lib/axios.ts`) |
| Server State | TanStack Query v5 (`@tanstack/react-query`) |
| Table UI | TanStack Table v8 (`@tanstack/react-table`) |
| Client State | Zustand v5 (`store/auth.ts`) |
| Components | shadcn/ui (Tailwind 4 compatible) |
| Linting | ESLint 9 (eslint-config-next) |

## Commands

```bash
npm run dev      # Start dev server → localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

## Next.js 16 Critical Differences

- **Route guard file:** `proxy.ts` at project root (NOT `middleware.ts` — deprecated in v16)
- **Export name:** `proxy` (default or named), not `middleware`
- **Proxy docs:** `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
- **Auth guide:** `node_modules/next/dist/docs/01-app/02-guides/authentication.md`

## Architecture

App Router layout — all routes live under `app/`. No `src/` directory.

```
app/
├── (auth)/login/    # Public — login page
├── (dashboard)/     # Protected — all module pages + shared layout
├── providers.tsx    # QueryClientProvider wrapper ('use client')
├── layout.tsx       # Root layout — Geist fonts, Providers, Tailwind globals
└── globals.css      # @import "tailwindcss" + CSS custom properties + shadcn vars
```

**Path alias:** `@/*` maps to the **project root** (not `./src`).

**Tailwind CSS 4 key differences from v3:**
- Config is CSS-first: no `tailwind.config.js`. Customize via `@theme` in `globals.css`.
- Import is `@import "tailwindcss"` not `@tailwind base/components/utilities`.

## Folder Conventions

| Folder | Purpose |
|---|---|
| `app/(auth)/` | Unauthenticated pages (login) |
| `app/(dashboard)/` | All authenticated module pages |
| `components/ui/` | shadcn auto-generated — do not edit manually |
| `components/layout/` | Sidebar, Header |
| `components/{module}/` | Per-module React components |
| `hooks/{module}/` | TanStack Query hooks per module |
| `services/{module}.ts` | Axios API call functions per module |
| `store/auth.ts` | Zustand auth store (JWT tokens + user) |
| `lib/axios.ts` | Axios instance with Bearer interceptor + refresh logic |
| `lib/query-client.ts` | TanStack Query client singleton |
| `lib/utils.ts` | shadcn `cn()` utility — do not edit |
| `types/{module}.ts` | TypeScript interfaces matching backend shapes |
| `docs/specs/` | Agent-generated spec files per module |
| `docs/mvp.md` | Master module list and build order |
| `.claude/agents/` | Agent definition files |
| `proxy.ts` | Route guard (Next.js 16) |

## Key Patterns

**Dual serializer (all FK fields):**
- GET responses return nested objects: `{ supplier: { id, name } }`
- POST/PATCH bodies send integer IDs: `{ supplier: 1 }`
- TypeScript types must have separate Read and Write variants

**TanStack Query key convention:**
- List: `['{module}', 'list', params]`
- Single: `['{module}', id]`
- Nested: `['{module}', id, '{nested}']`

**Zustand outside React:**
- Use `useAuthStore.getState()` in Axios interceptors, not the hook

## Backend API

Backend at `E:\dev\codigo-vibecoding-g2\logistica-api` (Django 6 + DRF).

**Base URL:** `http://localhost:8000/api/v1/`  
**Auth:** JWT — `POST /auth/token/` → `Authorization: Bearer {access_token}`  
**Swagger:** `http://localhost:8000/api/docs/`

Full API docs: [`docs/`](./docs/README.md)

### Modules

| Module | Path | Permission |
|---|---|---|
| Customers | `/api/v1/customers/` | admin |
| Warehouses | `/api/v1/warehouses/` | admin, warehouse_staff |
| Suppliers | `/api/v1/suppliers/` | admin |
| Products | `/api/v1/products/` | admin, warehouse_staff |
| Drivers | `/api/v1/drivers/` | admin |
| Transport | `/api/v1/transport/` | admin |
| Routes | `/api/v1/routes/` + `/routes/{id}/stops/` | admin |
| Shipments | `/api/v1/shipments/` + `/shipments/{id}/items/` | admin |

### Key API Patterns

- All lists paginated: `{ count, next, previous, results[] }` — page size 20
- Filtering: `?field=value`, search: `?search=term`, ordering: `?ordering=field`
- `Shipment.tracking_number` auto-generated (`TRK-XXXXXXXXXX`)
- `Shipment.total_weight_kg` auto-calculated from items

### Data Relation Map

```
Supplier ──< Product >── Warehouse
                │
Customer ──< Shipment >── ShipmentItem >── Product
                │
             Route ──< RouteStop
                │
           Transport
                │
             Driver ──── auth.User
```

## Not Yet Configured

- No testing framework
- No `app/api/` routes — all API calls go to external Django backend
