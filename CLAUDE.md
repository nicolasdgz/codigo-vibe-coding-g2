# Task Manager — Monorepo Guide

## Structure

```
codigo-vibecoding-g2/
├── task-manager-backend/    # Express API (port 3000)
└── task-manager-frontend/   # React SPA (port 5173)
```

## Stack

### Backend (`task-manager-backend/`)
| Layer | Tech |
|---|---|
| Runtime | Node.js (ES modules) |
| Framework | Express.js |
| Database | PostgreSQL via Neon (cloud) |
| ORM | Prisma 7 |
| Auth | In-memory sessions + bcryptjs |
| Validation | express-validator |
| API Docs | Swagger UI at `/api-docs` |

**Models:** `User` (id, email, password) · `Task` (id, title, status, userId)  
**Task statuses:** `pending` · `in-progress` · `done`

### Frontend (`task-manager-frontend/`)
| Layer | Tech |
|---|---|
| Framework | React 19 |
| Bundler | Vite 8 |
| Routing | React Router v7 |
| Styles | TailwindCSS 4 |
| Icons | Lucide React |
| HTTP | Native Fetch API |
| State | Component-level hooks (no global store) |

**Pages:** `Login` · `TaskList` · `TaskDetail`  
**Services:** `src/services/taskService.ts` — all API calls live here

## Communication

Frontend → Backend via REST. Base URL hardcoded in `src/services/taskService.ts:3`:
```
http://localhost:3000
```

| Method | Path | Purpose |
|---|---|---|
| POST | `/users/register` | Register user |
| POST | `/users/login` | Login (returns token) |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create task |
| GET | `/tasks/:id` | Get task |
| PUT | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |

No auth headers sent yet — Login page has a TODO, backend routes are unprotected.

## Dev Setup

> **IMPORTANT — for AI agents:** Never execute `npm run dev` or any dev server command. These must be run manually by the developer. Assume both servers are already running when working on tasks.

Run both manually (two terminals):

```bash
# Terminal 1 — Backend
cd task-manager-backend
npm run dev          # nodemon src/server.js → localhost:3000

# Terminal 2 — Frontend
cd task-manager-frontend
npm run dev          # vite → localhost:5173
```

Backend needs `.env` with `DATABASE_URL` (Neon connection string).

## Feature Development — Task Split

When adding a feature, split work like this:

### Backend owns
- New Prisma schema fields / migrations
- New API endpoints or route handlers
- Business logic (validation, status transitions)
- Auth/session changes
- Swagger doc updates (`src/docs/swagger.json`)

### Frontend owns
- New pages or components
- Calls to new endpoints in `src/services/taskService.ts`
- UI state, forms, error messages
- Routing changes in `App.tsx`

### Typical feature checklist
1. **Schema change?** → `prisma/schema.prisma` → `npm run db:push` (dev) or `db:migrate` (prod)
2. **New endpoint** → add route in `task.routes.js` → controller → service → repository
3. **Frontend call** → add function in `taskService.ts` → wire into page/component
4. **Type sync** → update `src/types/task.ts` to match new backend shape

## Known Issues / TODOs

- `taskService.ts` has hardcoded `localhost:3000` — should use `import.meta.env.VITE_API_URL`
- Auth not integrated: Login page sends no request; task routes have no auth middleware
- In-memory sessions reset on backend restart — not production-safe
- No `.env.example` in backend — new devs need `DATABASE_URL` manually
- No CORS origin restriction — backend accepts any origin

## Key Files

```
task-manager-backend/
├── src/app.js                   # Express app, CORS, route mounting
├── src/server.js                # Entry point, PORT config
├── src/tasks/task.routes.js     # Task endpoints
├── src/users/user.routes.js     # Auth endpoints
├── src/lib/prisma.js            # Prisma client singleton
├── prisma/schema.prisma         # DB models
└── src/docs/swagger.json        # OpenAPI spec

task-manager-frontend/
├── src/main.tsx                 # App entry, BrowserRouter
├── src/App.tsx                  # Route definitions
├── src/services/taskService.ts  # All backend calls
├── src/types/task.ts            # TypeScript interfaces
├── src/pages/                   # Login, TaskList, TaskDetail
└── src/components/              # TaskCard, TaskForm, Dialog
```
