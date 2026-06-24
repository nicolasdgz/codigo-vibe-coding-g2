import { test, expect } from '@playwright/test'

const username = process.env.E2E_USERNAME ?? 'testuser'
const password = process.env.E2E_PASSWORD ?? 'testpass123'
const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'

// ─── 1 & 2: Login — sin storageState ────────────────────────────────────────

test.describe('Flujo de login', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('credenciales válidas → redirige a /dashboard con Sidebar y Navbar', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Usuario').fill(username)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Ingresar' }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
  })

  test('credenciales inválidas → muestra error, no redirige', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Usuario').fill('usuario_invalido_e2e')
    await page.locator('input[name="password"]').fill('contraseña_invalida_e2e')
    await page.getByRole('button', { name: 'Ingresar' }).click()

    await expect(
      page.getByText(/La combinación de credenciales|Error al iniciar sesión/)
    ).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── 3: AuthGuard — sin token/cookie redirige a /login ──────────────────────

test.describe('AuthGuard', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('sin token en localStorage → /dashboard/warehouses redirige a /login', async ({ page }) => {
    await page.goto('/dashboard/warehouses')
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── 4: Logout — con storageState activo (proyecto chromium) ────────────────

test('Logout → limpia sesión y redirige a /login; reintentar /dashboard → /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard/)

  // Abrir menú de usuario y cerrar sesión
  await page.getByRole('button', { name: 'Menú de usuario' }).click()
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()

  await expect(page).toHaveURL(/\/login/)

  // Tokens deben estar limpios en localStorage
  const authStorage = await page.evaluate(() => localStorage.getItem('auth-storage'))
  const parsed = authStorage ? (JSON.parse(authStorage) as { state: { accessToken: unknown } }) : null
  expect(parsed?.state?.accessToken ?? null).toBeNull()

  // Reintentar /dashboard → proxy sin cookie redirige a /login
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

// ─── 5: (Avanzado) Refresh automático — access inválido + refresh válido ────

test('access token inválido + refresh válido → request reintentada, usuario no expulsado', async ({
  page,
  request,
}) => {
  // Obtener refresh real vía API directa
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { username, password },
  })
  expect(res.ok(), `Auth API failed (${res.status()}): ${await res.text()}`).toBeTruthy()
  const { refresh, user } = (await res.json()) as { refresh: string; user: unknown }

  // Seed localStorage con access inválido pero refresh real
  await page.goto('/login')
  await page.evaluate(
    ({ refresh, user }) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            accessToken: 'token.invalido.para.forzar.401',
            refreshToken: refresh,
            user,
            isAuthenticated: true,
          },
          version: 0,
        })
      )
    },
    { refresh, user }
  )
  await page.context().addCookies([
    { name: 'logged-in', value: '1', domain: 'localhost', path: '/', sameSite: 'Lax' },
  ])

  // Navegar a página que dispara requests autenticadas
  // Nota: grupo (dashboard) no aparece en URL → /warehouses no /dashboard/warehouses
  await page.goto('/warehouses', { waitUntil: 'domcontentloaded' })

  // Esperar que el refresh 401 complete (éxito o fallo) antes de assertar URL final
  await page.waitForLoadState('networkidle', { timeout: 15_000 })

  // Tras el refresh automático el usuario debe permanecer en /warehouses
  await expect(page).toHaveURL(/\/warehouses/)
  await expect(page.locator('header')).toBeVisible()
})
