import { test, expect } from '@playwright/test'

const username = process.env.E2E_USERNAME ?? 'testuser'
const password = process.env.E2E_PASSWORD ?? 'testpass123'

test.describe('Login', () => {
  test('credenciales válidas redirigen a /dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Usuario').fill(username)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('credenciales inválidas muestran error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Usuario').fill('usuario_invalido_e2e')
    await page.locator('input[name="password"]').fill('contraseña_invalida_e2e')
    await page.getByRole('button', { name: 'Ingresar' }).click()
    // Mensaje exacto que retorna SimpleJWT en español
    await expect(page.getByText('La combinación de credenciales no tiene una cuenta activa')).toBeVisible()
  })
})
