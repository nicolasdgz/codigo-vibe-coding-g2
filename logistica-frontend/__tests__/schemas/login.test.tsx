import { describe, expect, it, vi, beforeAll } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithQuery } from '@/test/utils/renderWithQuery'
import LoginPage from '@/app/(auth)/login/page'

const BASE = 'http://localhost:8000/api/v1'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  })),
}))

beforeAll(() => {
  process.env.NEXT_PUBLIC_API_URL = BASE
})

describe('Login form — validación de schema Zod', () => {
  it('username vacío falla con "Usuario requerido"', async () => {
    const user = userEvent.setup()
    renderWithQuery(<LoginPage />)

    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Usuario requerido')).toBeInTheDocument()
  })

  it('password vacío falla con "Contraseña requerida"', async () => {
    const user = userEvent.setup()
    renderWithQuery(<LoginPage />)

    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Contraseña requerida')).toBeInTheDocument()
  })

  it('ambos campos vacíos muestran ambos errores simultáneamente', async () => {
    const user = userEvent.setup()
    renderWithQuery(<LoginPage />)

    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Usuario requerido')).toBeInTheDocument()
    expect(await screen.findByText('Contraseña requerida')).toBeInTheDocument()
  })

  it('ambos campos con valores válidos no muestran errores de validación', async () => {
    // Mock del backend para que el submit no quede colgado
    server.use(
      http.post(`${BASE}/auth/login/`, () =>
        HttpResponse.json({
          access: 'tok', refresh: 'ref',
          user: { id: 1, username: 'u', email: '', first_name: '', last_name: '',
                  is_superuser: false, is_staff: false, groups: [], permissions: [] },
        })
      )
    )

    const user = userEvent.setup()
    renderWithQuery(<LoginPage />)

    await user.type(screen.getByPlaceholderText('admin'), 'testuser')
    await user.type(screen.getByPlaceholderText('••••••••'), 'testpass123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.queryByText('Usuario requerido')).not.toBeInTheDocument()
      expect(screen.queryByText('Contraseña requerida')).not.toBeInTheDocument()
    })
  })
})
