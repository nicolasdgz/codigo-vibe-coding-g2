import { type Page } from '@playwright/test'
import { test, expect } from './fixtures'

const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'
const PROD = `${API_BASE}/products/`
const SUPP = `${API_BASE}/suppliers/`
const WH   = `${API_BASE}/warehouses/`

const USERNAME = process.env.E2E_USERNAME ?? 'testuser'
const PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123'

// ─── Shared seed (un supplier + warehouse para toda la suite) ────────────────

let supplierId: number
let warehouseId: number
let supplierName: string
let warehouseName: string
const warehouseCity = 'Buenos Aires'

async function getAuthHeaders(request: Parameters<Parameters<typeof test.beforeAll>[0]>[0]['request']) {
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { username: USERNAME, password: PASSWORD },
  })
  const { access } = (await res.json()) as { access: string }
  return { Authorization: `Bearer ${access}` }
}

// ─── Fill helper (Sheet dialog) ──────────────────────────────────────────────

async function fillProductForm(
  page: Page,
  opts: { name: string; sku: string; weight?: string; price?: string; stock?: number }
) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nombre').fill(opts.name)
  await dialog.getByLabel('SKU').fill(opts.sku)
  await dialog.getByLabel('Peso (kg)').fill(opts.weight ?? '1.50')
  await dialog.getByLabel('Precio unitario').fill(opts.price ?? '99.99')
  await dialog.getByLabel('Stock').fill(String(opts.stock ?? 10))

  // Supplier select (shadcn combobox)
  await dialog.getByLabel('Proveedor').click()
  await page.getByRole('option', { name: supplierName }).click()

  // Warehouse select — options show "name — city"
  await dialog.getByLabel('Almacén').click()
  await page.getByRole('option', { name: `${warehouseName} — ${warehouseCity}` }).click()
}

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('Products CRUD', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ request }) => {
    const ts = Date.now()
    const headers = await getAuthHeaders(request)

    supplierName = `Proveedor E2E Prod-${ts}`
    const suppRes = await request.post(SUPP, {
      data: {
        name: supplierName,
        email: `e2e-prod-${ts}@test.local`,
        phone: '1122334455',
        address: 'Calle Test 123',
        tax_id: `TAX-PROD-${ts}`,
        contact_name: 'Contacto E2E',
        is_active: true,
      },
      headers,
    })
    supplierId = ((await suppRes.json()) as { id: number }).id

    warehouseName = `Almacén E2E Prod-${ts}`
    const whRes = await request.post(WH, {
      data: {
        name: warehouseName,
        address: 'Av. Test 456',
        city: warehouseCity,
        country: 'Argentina',
        capacity: 1000,
        is_active: true,
      },
      headers,
    })
    warehouseId = ((await whRes.json()) as { id: number }).id
  })

  test.afterAll(async ({ request }) => {
    const headers = await getAuthHeaders(request)
    // Warehouse y supplier se eliminan después de que los productos
    // ya fueron limpiados por cada test individual
    await request.delete(`${SUPP}${supplierId}/`, { headers }).catch(() => {})
    await request.delete(`${WH}${warehouseId}/`, { headers }).catch(() => {})
  })

  // ─── 1: Lista ─────────────────────────────────────────────────────────────

  test('lista: tabla renderiza fila con producto sembrado vía API', async ({ page, api }) => {
    const ts = Date.now()
    const prodName = `Producto E2E lista-${ts}`
    const id = await api.seed(PROD, {
      name: prodName,
      sku: `SKU-LIST-${ts}`,
      weight_kg: '1.00',
      unit_price: '50.00',
      stock: 5,
      supplier: supplierId,
      warehouse: warehouseId,
      is_active: true,
    })

    try {
      await page.goto('/products')
      await expect(page.locator('tr', { hasText: prodName })).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove(PROD, id)
    }
  })

  // ─── 2: Crear ─────────────────────────────────────────────────────────────

  test('crear: formulario con selects válidos → registro aparece en lista', async ({ page, api }) => {
    const ts = Date.now()
    const prodName = `Producto E2E crear-${ts}`
    const sku = `SKU-CREATE-${ts}`
    let createdId: number | undefined

    try {
      await page.goto('/products')
      await page.getByRole('button', { name: 'Nuevo producto' }).click()
      await expect(page.getByRole('dialog').getByText('Nuevo producto')).toBeVisible()

      await fillProductForm(page, { name: prodName, sku })

      await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 })
      await expect(page.locator('tr', { hasText: prodName })).toBeVisible({ timeout: 10_000 })

      // Obtener ID para cleanup
      const res = await api.get(`${PROD}?search=${encodeURIComponent(prodName)}`)
      const data = (await res.json()) as { results: Array<{ id: number }> }
      createdId = data.results[0]?.id
    } finally {
      if (createdId) await api.remove(PROD, createdId)
    }
  })

  // ─── 3: Validación ────────────────────────────────────────────────────────

  test('validación: form vacío muestra errores Zod, Sheet permanece abierto', async ({ page }) => {
    await page.goto('/products')
    await page.getByRole('button', { name: 'Nuevo producto' }).click()
    await expect(page.getByRole('dialog').getByText('Nuevo producto')).toBeVisible()

    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('El nombre es obligatorio')).toBeVisible()
    await expect(dialog).toBeVisible()
  })

  // ─── 4: SKU único ─────────────────────────────────────────────────────────

  test('SKU único: segundo producto con mismo SKU muestra error del backend', async ({ page, api }) => {
    const ts = Date.now()
    const dupSku = `SKU-DUP-${ts}`
    let firstId: number | undefined

    try {
      // Primer producto vía API
      firstId = await api.seed(PROD, {
        name: `Producto E2E dup1-${ts}`,
        sku: dupSku,
        weight_kg: '1.00',
        unit_price: '10.00',
        stock: 1,
        supplier: supplierId,
        warehouse: warehouseId,
        is_active: true,
      })

      // Intentar crear segundo con el mismo SKU desde UI
      await page.goto('/products')
      await page.getByRole('button', { name: 'Nuevo producto' }).click()
      await expect(page.getByRole('dialog').getByText('Nuevo producto')).toBeVisible()

      await fillProductForm(page, { name: `Producto E2E dup2-${ts}`, sku: dupSku })

      await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click()

      // Esperar que la mutación termine (botón vuelve a estar habilitado)
      await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Guardar' })
      ).toBeEnabled({ timeout: 8_000 })

      // Sheet permanece abierto y hay un FormMessage de error
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('dialog').locator('p.text-destructive').first()).toBeVisible()
    } finally {
      if (firstId) await api.remove(PROD, firstId)
    }
  })

  // ─── 5: Editar ────────────────────────────────────────────────────────────

  test('editar: cambiar nombre → verificar cambio en lista', async ({ page, api }) => {
    const ts = Date.now()
    const prodName = `Producto E2E editar-${ts}`
    const newName = `${prodName} EDITADO`
    const id = await api.seed(PROD, {
      name: prodName,
      sku: `SKU-EDIT-${ts}`,
      weight_kg: '2.00',
      unit_price: '75.00',
      stock: 3,
      supplier: supplierId,
      warehouse: warehouseId,
      is_active: true,
    })

    try {
      await page.goto('/products')
      await page.locator('tr', { hasText: prodName })
        .getByRole('button', { name: 'Editar producto' }).click()

      await expect(page).toHaveURL(new RegExp(`/products/${id}$`), { timeout: 8_000 })
      await expect(page.getByRole('heading', { name: 'Editar producto' })).toBeVisible()

      const nameInput = page.getByLabel('Nombre')
      await nameInput.clear()
      await nameInput.fill(newName)

      await page.getByRole('button', { name: 'Guardar' }).click()
      await expect(page.getByRole('button', { name: 'Guardar' })).not.toBeDisabled({ timeout: 8_000 })

      await page.goto('/products')
      await expect(page.locator('tr', { hasText: newName })).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove(PROD, id)
    }
  })

  // ─── 6: Eliminar ──────────────────────────────────────────────────────────

  test('eliminar: sembrar vía API, eliminar en UI con Dialog, desaparece de lista', async ({ page, api }) => {
    const ts = Date.now()
    const prodName = `Producto E2E delete-${ts}`
    const id = await api.seed(PROD, {
      name: prodName,
      sku: `SKU-DEL-${ts}`,
      weight_kg: '1.00',
      unit_price: '20.00',
      stock: 2,
      supplier: supplierId,
      warehouse: warehouseId,
      is_active: true,
    })
    let deleted = false

    try {
      await page.goto('/products')
      await expect(page.locator('tr', { hasText: prodName })).toBeVisible({ timeout: 10_000 })

      await page.locator('tr', { hasText: prodName })
        .getByRole('button', { name: 'Eliminar producto' }).click()

      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()

      await expect(page.locator('tr', { hasText: prodName })).not.toBeVisible({ timeout: 10_000 })
      deleted = true
    } finally {
      if (!deleted) await api.remove(PROD, id).catch(() => {})
    }
  })

  // ─── 7: Búsqueda ──────────────────────────────────────────────────────────

  test('búsqueda: filtrar por texto muestra solo registros coincidentes', async ({ page, api }) => {
    const ts = Date.now()
    const prods = [
      { name: `Prod Alpha ${ts}`, sku: `SKU-A-${ts}` },
      { name: `Prod Beta ${ts}`,  sku: `SKU-B-${ts}` },
      { name: `Prod Gamma ${ts}`, sku: `SKU-G-${ts}` },
    ]

    const base = { weight_kg: '1', unit_price: '10', stock: 1, supplier: supplierId, warehouse: warehouseId, is_active: true }

    const ids = await Promise.all(prods.map((p) => api.seed(PROD, { ...base, ...p })))

    try {
      await page.goto('/products')

      const responseP = page.waitForResponse(
        (res) => res.url().includes('/products/') && res.status() === 200
      )
      await page.getByPlaceholder('Buscar...').first().fill(`Alpha ${ts}`)
      await responseP

      await expect(page.locator('tr', { hasText: prods[0].name })).toBeVisible({ timeout: 10_000 })
      await expect(page.locator('tr', { hasText: prods[1].name })).not.toBeVisible()
      await expect(page.locator('tr', { hasText: prods[2].name })).not.toBeVisible()
    } finally {
      await Promise.all(ids.map((id) => api.remove(PROD, id)))
    }
  })
})
