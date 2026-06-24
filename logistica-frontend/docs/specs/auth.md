# Spec: Auth

## Purpose
JWT-based authentication for the logistics admin SPA. Provides a login form, token storage, cookie-based route guard, and logout. All other modules depend on this being in place.

## Screens / Routes

| Route | Type | Description |
|---|---|---|
| `/login` | Client | Login form with username + password |
| `/dashboard` (layout) | Client | Protected shell — sidebar + header |

## Component List

| Component | Type | File | Props |
|---|---|---|---|
| LoginPage | client | `app/(auth)/login/page.tsx` | — |
| DashboardLayout | client | `app/(dashboard)/layout.tsx` | `children` |
| Sidebar | client | `components/layout/sidebar.tsx` | — |
| Header | client | `components/layout/header.tsx` | — |

## TypeScript Types

Already in `store/auth.ts`:
```ts
interface AuthUser { id: number; username: string; email: string }
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login(access: string, refresh: string, user: AuthUser): void
  logout(): void
  setAccessToken(token: string): void
}
```

## API Calls Needed

| Function | Method | Endpoint | Purpose |
|---|---|---|---|
| login form submit | POST | `/auth/token/` | Obtain JWT pair |
| axios interceptor | POST | `/auth/token/refresh/` | Auto-refresh on 401 |

## Acceptance Criteria

- [x] Login page renders at `/login`
- [x] Form validates username and password (both required)
- [x] POST to `/auth/token/` on submit
- [x] On success: tokens stored in Zustand store (persisted to localStorage)
- [x] On success: `logged-in=1` cookie set for proxy route guard
- [x] On success: redirect to `/dashboard`
- [x] On 401 error: display `detail` message from DRF response
- [x] Dashboard layout renders sidebar + header + main content
- [x] Sidebar shows all 9 module navigation links with icons
- [x] Active route highlighted in sidebar
- [x] Header shows current page title and logged-in username
- [x] Logout button clears Zustand store, removes cookie, redirects to `/login`
- [x] DashboardLayout redirects unauthenticated users to `/login`
- [x] `proxy.ts` redirects unauthenticated requests to `/login` (server-side guard)
- [x] `proxy.ts` redirects authenticated users away from `/login` to `/dashboard`
- [x] Root `/` redirects to `/dashboard`
