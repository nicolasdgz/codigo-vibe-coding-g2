import { type Page, type APIRequestContext } from '@playwright/test'
import { test, expect } from './fixtures'

const API_BASE  = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'
const DRIVERS   = `${API_BASE}/drivers/`
const AUTH_USERS = `${API_BASE}/auth/users/`

const USERNAME = process.env.E2E_USERNAME ?? 'testuser'
const PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123'

// ─── Shared seed (un auth.User para toda la suite) ───────────────────────────
// Driver no tiene FK a transport — el prompt asumía eso incorrectamente.
// Sí requiere un auth.User pre-existente (campo "User ID" en el form).

let mainUserId: number
let mainUsername: string

async function getAuthHeaders(request: APIRequestContext) {
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { username: USERNAME, password: PASSWORD },
  })
  const { access } = (await res.json()) as { access: string }
  return { Authorization: `Bearer ${access}` }
}

// ─── DatePicker helper ───────────────────────────────────────────────────────
// DatePicker no reenvía el id de FormControl → getByLabel no funciona.
// El trigger muestra el placeholder "Seleccionar fecha" hasta que se elige una fecha.
// Navega al mes siguiente para garantizar fecha futura.

async function pickNextMonth15(page: Page) {
  // Navegar al mes siguiente en el calendario abierto
  await page.locator('.rdp-button_next').click()
  // Click día 15 (botones del calendario tienen data-day attribute)
  await page.locator('button[data-day]').filter({ hasText: /^15$/ }).first().click()
}

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('Drivers CRUD', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ request }) => {
    const ts = Date.now()
    const headers = await getAuthHeaders(request)

    mainUsername = `drv-e2e-${ts}`
    const userRes = await request.post(AUTH_USERS, {
      data: {
        username: mainUsername,
        password: 'Testpass123!',
        email: `drv-e2e-${ts}@test.local`,
      },
      headers,
    })
    mainUserId = ((await userRes.json()) as { id: number }).id
  })

  test.afterAll(async ({ request }) => {
    const headers = await getAuthHeaders(request)
    // Los tests individuales limpian sus propios drivers vía api.remove.
    // Aquí solo eliminamos el usuario compartido.
    await request.delete(`${AUTH_USERS}${mainUserId}/`, { headers }).catch(() => {})
  })

  // ─── 1: Lista ─────────────────────────────────────────────────────────────

  test('lista: tabla renderiza fila con campos derivados del user (username)', async ({ page, api }) => {
    const ts = Date.now()
    const licenseNum = `LIC-LIST-${ts}`
    const id = await api.seed(DRIVERS, {
      user: mainUserId,
      license_number: licenseNum,
      license_expiry: '2027-12-31',
      phone: '1122334455',
      is_available: true,
    })

    try {
      await page.goto('/drivers')
      const row = page.locator('tr', { hasText: licenseNum })
      await expect(row).toBeVisible({ timeout: 10_000 })
      // Columna full_name muestra username cuando no hay first/last name
      await expect(row).toContainText(mainUsername)
    } finally {
      await api.remove(DRIVERS, id)
    }
  })

  // ─── 2: Crear ─────────────────────────────────────────────────────────────

  test('crear: User ID + DatePicker + campos → conductor aparece en lista', async ({ page, api }) => {
    const ts = Date.now()
    const licenseNum = `LIC-CREATE-${ts}`
    let createdId: number | undefined

    try {
      await page.goto('/drivers')
      await page.getByRole('button', { name: 'Nuevo conductor' }).click()
      await expect(page.getByRole('dialog').getByText('Nuevo conductor')).toBeVisible()

      const dialog = page.getByRole('dialog')

      await dialog.getByLabel('User ID').fill(String(mainUserId))
      await dialog.getByLabel('Número de licencia').fill(licenseNum)
      await dialog.getByLabel('Teléfono').fill('9988776655')

      // DatePicker: trigger muestra "Seleccionar fecha"
      await dialog.getByRole('button').filter({ hasText: 'Seleccionar fecha' }).click()
      await pickNextMonth15(page)

      // Disponibilidad default = Disponible — no modificar

      await dialog.getByRole('button', { name: 'Guardar' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 })
      await expect(page.locator('tr', { hasText: licenseNum })).toBeVisible({ timeout: 10_000 })

      // Obtener ID para cleanup
      const res = await api.get(`${DRIVERS}?search=${encodeURIComponent(licenseNum)}`)
      const data = (await res.json()) as { results: Array<{ id: number }> }
      createdId = data.results[0]?.id
    } finally {
      if (createdId) await api.remove(DRIVERS, createdId)
    }
  })

  // ─── 3: Validación ────────────────────────────────────────────────────────

  test('validación: form vacío muestra errores Zod, Sheet permanece abierto', async ({ page }) => {
    await page.goto('/drivers')
    await page.getByRole('button', { name: 'Nuevo conductor' }).click()
    await expect(page.getByRole('dialog').getByText('Nuevo conductor')).toBeVisible()

    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('El número de licencia es obligatorio')).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  // ─── 4: Editar ────────────────────────────────────────────────────────────

  test('editar: cambiar teléfono → verificar cambio en lista', async ({ page, api }) => {
    const ts = Date.now()
    const licenseNum = `LIC-EDIT-${ts}`
    const newPhone = '9999999999'
    const id = await api.seed(DRIVERS, {
      user: mainUserId,
      license_number: licenseNum,
      license_expiry: '2027-12-31',
      phone: '1111111111',
      is_available: true,
    })

    try {
      await page.goto('/drivers')
      await page.locator('tr', { hasText: licenseNum })
        .getByRole('button', { name: 'Editar conductor' }).click()

      await expect(page).toHaveURL(new RegExp(`/drivers/${id}$`), { timeout: 8_000 })
      await expect(page.getByRole('heading', { name: 'Editar conductor' })).toBeVisible()

      const phoneInput = page.getByLabel('Teléfono')
      await phoneInput.clear()
      await phoneInput.fill(newPhone)

      await page.getByRole('button', { name: 'Guardar' }).click()
      await expect(page.getByRole('button', { name: 'Guardar' })).not.toBeDisabled({ timeout: 8_000 })

      await page.goto('/drivers')
      await expect(page.locator('tr', { hasText: newPhone })).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove(DRIVERS, id)
    }
  })

  // ─── 5: Eliminar ──────────────────────────────────────────────────────────

  test('eliminar: sembrar vía API, eliminar en UI con Dialog, desaparece de lista', async ({ page, api }) => {
    const ts = Date.now()
    const licenseNum = `LIC-DEL-${ts}`
    const id = await api.seed(DRIVERS, {
      user: mainUserId,
      license_number: licenseNum,
      license_expiry: '2027-12-31',
      phone: '5544332211',
      is_available: true,
    })
    let deleted = false

    try {
      await page.goto('/drivers')
      await expect(page.locator('tr', { hasText: licenseNum })).toBeVisible({ timeout: 10_000 })

      await page.locator('tr', { hasText: licenseNum })
        .getByRole('button', { name: 'Eliminar conductor' }).click()

      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()

      await expect(page.locator('tr', { hasText: licenseNum })).not.toBeVisible({ timeout: 10_000 })
      deleted = true
    } finally {
      if (!deleted) await api.remove(DRIVERS, id).catch(() => {})
    }
  })

  // ─── 6: Búsqueda ──────────────────────────────────────────────────────────
  // Busca por número de licencia (el search del backend acepta name/license).
  // Requiere 3 usuarios extra — cada driver exige un user único.

  test('búsqueda: filtrar por licencia muestra solo conductor coincidente', async ({ page, api, request }) => {
    const ts = Date.now()
    const headers = await getAuthHeaders(request)

    const tags = ['alpha', 'beta', 'gamma'] as const
    const extraUserIds: number[] = []

    for (const tag of tags) {
      const res = await request.post(AUTH_USERS, {
        data: {
          username: `drv-srch-${tag}-${ts}`,
          password: 'Testpass123!',
          email: `drv-srch-${tag}-${ts}@test.local`,
        },
        headers,
      })
      extraUserIds.push(((await res.json()) as { id: number }).id)
    }

    const licenses = tags.map((t) => `LIC-SRCH-${t.toUpperCase()}-${ts}`)
    const driverIds: number[] = []

    for (let i = 0; i < 3; i++) {
      const id = await api.seed(DRIVERS, {
        user: extraUserIds[i],
        license_number: licenses[i],
        license_expiry: '2027-12-31',
        phone: '1000000000',
        is_available: true,
      })
      driverIds.push(id)
    }

    try {
      await page.goto('/drivers')

      const responseP = page.waitForResponse(
        (res) => res.url().includes('/drivers/') && res.status() === 200
      )
      // Buscar por la licencia del driver alpha
      await page.getByPlaceholder('Buscar...').first().fill(`SRCH-ALPHA-${ts}`)
      await responseP

      await expect(page.locator('tr', { hasText: licenses[0] })).toBeVisible({ timeout: 10_000 })
      await expect(page.locator('tr', { hasText: licenses[1] })).not.toBeVisible()
      await expect(page.locator('tr', { hasText: licenses[2] })).not.toBeVisible()
    } finally {
      // Drivers primero (FK constraint), luego users
      await Promise.all(driverIds.map((id) => api.remove(DRIVERS, id).catch(() => {})))
      for (const uid of extraUserIds) {
        await request.delete(`${AUTH_USERS}${uid}/`, { headers }).catch(() => {})
      }
    }
  })
})
