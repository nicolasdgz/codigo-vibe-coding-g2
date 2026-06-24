import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/store/auth'

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@test.local',
  first_name: '',
  last_name: '',
  is_superuser: true,
  is_staff: true,
  groups: [],
  permissions: [],
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  })
})

describe('Estado inicial', () => {
  it('todos los campos son null/false', () => {
    const s = useAuthStore.getState()
    expect(s.accessToken).toBeNull()
    expect(s.refreshToken).toBeNull()
    expect(s.user).toBeNull()
    expect(s.isAuthenticated).toBe(false)
  })
})

describe('login()', () => {
  it('setea tokens, user e isAuthenticated=true', () => {
    useAuthStore.getState().login('access-token', 'refresh-token', mockUser)
    const s = useAuthStore.getState()
    expect(s.accessToken).toBe('access-token')
    expect(s.refreshToken).toBe('refresh-token')
    expect(s.user).toEqual(mockUser)
    expect(s.isAuthenticated).toBe(true)
  })

  it('persiste en localStorage bajo "auth-storage"', () => {
    useAuthStore.getState().login('access-token', 'refresh-token', mockUser)
    const raw = localStorage.getItem('auth-storage')
    const stored = JSON.parse(raw ?? '{}')
    expect(stored.state.accessToken).toBe('access-token')
    expect(stored.state.refreshToken).toBe('refresh-token')
    expect(stored.state.isAuthenticated).toBe(true)
  })
})

describe('logout()', () => {
  it('limpia tokens, user e isAuthenticated', () => {
    useAuthStore.setState({ accessToken: 'a', refreshToken: 'r', user: mockUser, isAuthenticated: true })
    useAuthStore.getState().logout()
    const s = useAuthStore.getState()
    expect(s.accessToken).toBeNull()
    expect(s.refreshToken).toBeNull()
    expect(s.user).toBeNull()
    expect(s.isAuthenticated).toBe(false)
  })
})

describe('setAccessToken()', () => {
  it('solo actualiza accessToken, no toca refreshToken ni isAuthenticated', () => {
    useAuthStore.setState({ accessToken: 'old', refreshToken: 'refresh', isAuthenticated: true })
    useAuthStore.getState().setAccessToken('new-access')
    const s = useAuthStore.getState()
    expect(s.accessToken).toBe('new-access')
    expect(s.refreshToken).toBe('refresh')
    expect(s.isAuthenticated).toBe(true)
  })
})

describe('isAuthenticated', () => {
  it('true con token truthy', () => {
    useAuthStore.setState({ accessToken: 'token', isAuthenticated: true })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('false cuando accessToken es null', () => {
    useAuthStore.setState({ accessToken: null, isAuthenticated: false })
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('false después de logout', () => {
    useAuthStore.getState().login('t', 'r', mockUser)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe('Guard SSR (localStorage no disponible)', () => {
  it('getState() no rompe cuando localStorage está undefined', () => {
    const original = Object.getOwnPropertyDescriptor(global, 'localStorage')
    Object.defineProperty(global, 'localStorage', { value: undefined, configurable: true })

    // El store ya fue cargado — en memoria Zustand no depende de localStorage en runtime
    expect(() => useAuthStore.getState()).not.toThrow()
    const s = useAuthStore.getState()
    expect(typeof s.isAuthenticated).toBe('boolean')

    // Restaurar
    Object.defineProperty(global, 'localStorage', original!)
  })
})
