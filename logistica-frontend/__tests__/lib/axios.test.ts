import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import type { AxiosInstance } from 'axios'

// Tipos para los módulos reimportados en cada test
type AuthModule = typeof import('@/store/auth')

const BASE = 'http://localhost:8000/api/v1'

const mockUser = {
  id: 1, username: 'u', email: '', first_name: '', last_name: '',
  is_superuser: true, is_staff: true, groups: [], permissions: [],
}

let apiClient: AxiosInstance
let authModule: AuthModule

beforeEach(async () => {
  vi.resetModules()
  process.env.NEXT_PUBLIC_API_URL = BASE

  // Importar en orden: axios primero (arrastra @/store/auth internamente),
  // luego store — devuelve la misma instancia ya cacheada
  const axiosMod = await import('@/lib/axios')
  authModule = await import('@/store/auth')

  apiClient = axiosMod.apiClient

  // Estado limpio del store para cada test
  authModule.useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─── Interceptor de REQUEST ───────────────────────────────────────────────────

describe('Request interceptor', () => {
  it('agrega Authorization: Bearer cuando hay accessToken', async () => {
    authModule.useAuthStore.setState({ accessToken: 'my-token' })

    let capturedAuth: string | null = null
    server.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient.get('/ping')
    expect(capturedAuth).toBe('Bearer my-token')
  })

  it('NO agrega Authorization cuando accessToken es null', async () => {
    authModule.useAuthStore.setState({ accessToken: null })

    let capturedAuth: string | null | undefined = undefined
    server.use(
      http.get(`${BASE}/ping`, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient.get('/ping')
    expect(capturedAuth).toBeNull()
  })
})

// ─── Interceptor de RESPONSE — 401 ───────────────────────────────────────────

describe('Response interceptor — 401 con refresh token válido', () => {
  it('llama a /auth/token/refresh/, guarda el nuevo token y reintenta con éxito', async () => {
    authModule.useAuthStore.setState({ accessToken: 'old', refreshToken: 'valid-refresh' })

    let protectedCallCount = 0
    let retryAuthHeader: string | null = null

    server.use(
      http.get(`${BASE}/protected`, ({ request }) => {
        protectedCallCount++
        if (protectedCallCount === 1) return new HttpResponse(null, { status: 401 })
        retryAuthHeader = request.headers.get('authorization')
        return HttpResponse.json({ data: 'ok' })
      }),
      http.post(`${BASE}/auth/token/refresh/`, () =>
        HttpResponse.json({ access: 'new-access-token' })
      )
    )

    const res = await apiClient.get('/protected')

    expect(res.status).toBe(200)
    expect(protectedCallCount).toBe(2)
    expect(retryAuthHeader).toBe('Bearer new-access-token')
    expect(authModule.useAuthStore.getState().accessToken).toBe('new-access-token')
  })
})

describe('Response interceptor — 401 SIN refresh token', () => {
  it('llama a logout y redirige a /login', async () => {
    authModule.useAuthStore.setState({ accessToken: 'old', refreshToken: null })
    const mockLocation = { href: 'http://localhost/' }
    vi.stubGlobal('location', mockLocation)

    server.use(
      http.get(`${BASE}/protected`, () => new HttpResponse(null, { status: 401 }))
    )

    await expect(apiClient.get('/protected')).rejects.toThrow()

    const s = authModule.useAuthStore.getState()
    expect(s.accessToken).toBeNull()
    expect(s.refreshToken).toBeNull()
    expect(s.isAuthenticated).toBe(false)
    expect(mockLocation.href).toBe('/login')
  })
})

describe('Response interceptor — 401 cuyo refresh también falla', () => {
  it('llama a logout, redirige a /login y rechaza la promesa', async () => {
    authModule.useAuthStore.setState({ accessToken: 'old', refreshToken: 'bad-refresh' })
    const mockLocation = { href: 'http://localhost/' }
    vi.stubGlobal('location', mockLocation)

    server.use(
      http.get(`${BASE}/protected`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/token/refresh/`, () => new HttpResponse(null, { status: 401 }))
    )

    await expect(apiClient.get('/protected')).rejects.toThrow()

    const s = authModule.useAuthStore.getState()
    expect(s.accessToken).toBeNull()
    expect(s.isAuthenticated).toBe(false)
    expect(mockLocation.href).toBe('/login')
  })
})

describe('Flag _retry — previene bucle infinito', () => {
  it('la request reintentada no dispara un segundo refresh si también recibe 401', async () => {
    authModule.useAuthStore.setState({ accessToken: 'old', refreshToken: 'valid-refresh' })
    const mockLocation = { href: 'http://localhost/' }
    vi.stubGlobal('location', mockLocation)

    let refreshCallCount = 0

    server.use(
      // El endpoint siempre retorna 401 — incluso en el reintento
      http.get(`${BASE}/endpoint`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/token/refresh/`, () => {
        refreshCallCount++
        return HttpResponse.json({ access: 'new-token' })
      })
    )

    // El primer 401 → refresh → reintento → segundo 401 → _retry=true → reject inmediato
    await expect(apiClient.get('/endpoint')).rejects.toThrow()

    // Refresh se llamó exactamente UNA vez, no en bucle
    expect(refreshCallCount).toBe(1)
  })
})
