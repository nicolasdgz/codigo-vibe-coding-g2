import { test, expect } from './fixtures'

// Path absoluto con baseURL parcial se resuelve al origen (sin /api/v1).
// Usar URL completa igual que auth.setup.ts.
const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'
const WH = `${API_BASE}/warehouses/`

function payload(tag: string) {
  const ts = Date.now()
  return {
    name: `Almacén E2E ${tag}-${ts}`,
    address: 'Av. Siempre Viva 742',
    city: 'Buenos Aires',
    country: 'Argentina',
    capacity: 500,
    is_active: true,
  }
}

test.describe('Warehouses CRUD', () => {
  // ─── 1: Lista ─────────────────────────────────────────────────────────────

  test('lista: tabla renderiza fila con dato sembrado vía API', async ({ page, api }) => {
    const wh = payload('list')
    const id = await api.seed(WH, wh)

    try {
      await page.goto('/warehouses')
      await expect(page.locator('tr', { hasText: wh.name })).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove(WH, id)
    }
  })

  // ─── 2: Crear ─────────────────────────────────────────────────────────────

  test('crear: formulario válido → registro aparece en lista', async ({ page, api }) => {
    const wh = payload('create')
    let createdId: number | undefined

    try {
      await page.goto('/warehouses')
      await page.getByRole('button', { name: 'Nuevo almacén' }).click()
      await expect(page.getByRole('dialog').getByText('Nuevo almacén')).toBeVisible()

      await page.getByLabel('Nombre').fill(wh.name)
      await page.getByLabel('Dirección').fill(wh.address)
      await page.getByLabel('Ciudad').fill(wh.city)
      await page.getByLabel('País').fill(wh.country)
      await page.getByLabel('Capacidad').fill(String(wh.capacity))

      await page.getByRole('button', { name: 'Guardar' }).click()
      // Sheet cierra en onSuccess
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 })

      // Registro aparece en tabla
      await expect(page.locator('tr', { hasText: wh.name })).toBeVisible({ timeout: 10_000 })

      // Obtener ID para cleanup via API
      const res = await api.get(`${WH}?search=${encodeURIComponent(wh.name)}`)
      const data = (await res.json()) as { results: Array<{ id: number }> }
      createdId = data.results[0]?.id
    } finally {
      if (createdId) await api.remove(WH, createdId)
    }
  })

  // ─── 3: Validación ────────────────────────────────────────────────────────

  test('validación: form vacío muestra errores Zod, Sheet permanece abierto', async ({ page }) => {
    await page.goto('/warehouses')
    await page.getByRole('button', { name: 'Nuevo almacén' }).click()
    await expect(page.getByRole('dialog').getByText('Nuevo almacén')).toBeVisible()

    await page.getByRole('button', { name: 'Guardar' }).click()

    await expect(page.getByText('El nombre es obligatorio')).toBeVisible()
    await expect(page.getByText('La dirección es obligatoria')).toBeVisible()
    await expect(page.getByText('La ciudad es obligatoria')).toBeVisible()
    await expect(page.getByText('El país es obligatorio')).toBeVisible()
    // Sheet no se cierra
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  // ─── 4: Editar ────────────────────────────────────────────────────────────

  test('editar: cambiar nombre → verificar cambio en lista', async ({ page, api }) => {
    const wh = payload('edit')
    const id = await api.seed(WH, wh)
    const newName = `${wh.name} EDITADO`

    try {
      await page.goto('/warehouses')

      // Click edit → navega a /warehouses/{id}
      await page.locator('tr', { hasText: wh.name })
        .getByRole('button', { name: 'Editar almacén' }).click()
      await expect(page).toHaveURL(new RegExp(`/warehouses/${id}$`), { timeout: 8_000 })
      await expect(page.getByRole('heading', { name: 'Editar almacén' })).toBeVisible()

      const nameInput = page.getByLabel('Nombre')
      await nameInput.clear()
      await nameInput.fill(newName)

      await page.getByRole('button', { name: 'Guardar' }).click()
      // Esperar a que la mutación complete (botón deja de estar deshabilitado)
      await expect(page.getByRole('button', { name: 'Guardar' })).not.toBeDisabled({ timeout: 8_000 })

      // Volver a lista y verificar nombre actualizado
      await page.goto('/warehouses')
      await expect(page.locator('tr', { hasText: newName })).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove(WH, id)
    }
  })

  // ─── 5: Eliminar ──────────────────────────────────────────────────────────

  test('eliminar: sembrar vía API, eliminar en UI con AlertDialog, desaparece de lista', async ({ page, api }) => {
    const wh = payload('delete')
    const id = await api.seed(WH, wh)
    let deleted = false

    try {
      await page.goto('/warehouses')
      await expect(page.locator('tr', { hasText: wh.name })).toBeVisible({ timeout: 10_000 })

      await page.locator('tr', { hasText: wh.name })
        .getByRole('button', { name: 'Eliminar almacén' }).click()

      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()

      await expect(page.locator('tr', { hasText: wh.name })).not.toBeVisible({ timeout: 10_000 })
      deleted = true
    } finally {
      if (!deleted) await api.remove(WH, id).catch(() => {})
    }
  })

  // ─── 6: Búsqueda ──────────────────────────────────────────────────────────

  test('búsqueda: filtrar por texto muestra solo registros coincidentes', async ({ page, api }) => {
    const ts = Date.now()
    const alpha = { ...payload(''), name: `WH Alpha ${ts}` }
    const beta  = { ...payload(''), name: `WH Beta ${ts}` }
    const gamma = { ...payload(''), name: `WH Gamma ${ts}` }

    const ids = await Promise.all([
      api.seed(WH, alpha),
      api.seed(WH, beta),
      api.seed(WH, gamma),
    ])

    try {
      await page.goto('/warehouses')

      // Esperar respuesta de la query filtrada (DebouncedInput tiene delay)
      const responseP = page.waitForResponse(
        (res) => res.url().includes('/warehouses/') && res.status() === 200
      )
      await page.getByPlaceholder('Buscar...').first().fill(`Alpha ${ts}`)
      await responseP

      await expect(page.locator('tr', { hasText: alpha.name })).toBeVisible({ timeout: 10_000 })
      await expect(page.locator('tr', { hasText: beta.name })).not.toBeVisible()
      await expect(page.locator('tr', { hasText: gamma.name })).not.toBeVisible()
    } finally {
      await Promise.all(ids.map((id) => api.remove(WH, id)))
    }
  })
})
