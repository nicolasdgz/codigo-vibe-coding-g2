import { type APIRequestContext } from '@playwright/test'
import { test, expect } from './fixtures'

const API_BASE   = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'
const SHIPMENTS  = `${API_BASE}/shipments/`
const PRODUCTS   = `${API_BASE}/products/`
const SUPP       = `${API_BASE}/suppliers/`
const WH         = `${API_BASE}/warehouses/`
const CUSTOMERS  = `${API_BASE}/customers/`

const USERNAME = process.env.E2E_USERNAME ?? 'testuser'
const PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123'

// ─── Shared seeds ─────────────────────────────────────────────────────────────
// Shipment.customer es REQUIRED en el backend (no permite null).
// ShipmentItems requieren product → supplier + warehouse.
// Shipment requiere origin_warehouse (misma que el product).

let warehouseId:   number
let warehouseName: string
const warehouseCity = 'Buenos Aires'
let supplierId:    number
let productId:     number
let productName:   string
let productSku:    string
let customerId:    number
let customerName:  string

async function getAuthHeaders(request: APIRequestContext) {
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { username: USERNAME, password: PASSWORD },
  })
  const { access } = (await res.json()) as { access: string }
  return { Authorization: `Bearer ${access}` }
}

function shipmentPayload() {
  return {
    customer: customerId,
    origin_warehouse: warehouseId,
    destination_address: 'Av. E2E Shipments 100',
    destination_city: 'Córdoba',
    destination_country: 'Argentina',
    status: 'pending',
    route: null,
    estimated_delivery: null,
    calculated_cost: '1000.00',
    notes: null,
  }
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('Shipments', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ request }) => {
    const ts = Date.now()
    const headers = await getAuthHeaders(request)

    // 1. Customer (requerido por el backend para todo Shipment)
    customerName = `Cliente E2E Ship-${ts}`
    const custRes = await request.post(CUSTOMERS, {
      data: {
        name: customerName,
        customer_type: 'company',
        email: `e2e-ship-cust-${ts}@test.local`,
        phone: '1100000000',
        address: 'Av. E2E 1',
        tax_id: `CUST-TAX-${ts}`,
        is_active: true,
      },
      headers,
    })
    customerId = ((await custRes.json()) as { id: number }).id

    // 2. Supplier (para product)
    const suppRes = await request.post(SUPP, {
      data: {
        name: `Proveedor E2E Ship-${ts}`,
        email: `e2e-ship-${ts}@test.local`,
        phone: '1122334455',
        address: 'Calle Logística 1',
        tax_id: `TAX-SHIP-${ts}`,
        contact_name: 'Contacto E2E',
        is_active: true,
      },
      headers,
    })
    supplierId = ((await suppRes.json()) as { id: number }).id

    // 3. Warehouse (origin_warehouse del shipment + warehouse del product)
    warehouseName = `Almacén E2E Ship-${ts}`
    const whRes = await request.post(WH, {
      data: {
        name: warehouseName,
        address: 'Av. Logística 100',
        city: warehouseCity,
        country: 'Argentina',
        capacity: 5000,
        is_active: true,
      },
      headers,
    })
    warehouseId = ((await whRes.json()) as { id: number }).id

    // 4. Product (para items del shipment)
    productName = `Producto E2E Ship-${ts}`
    productSku  = `SKU-SHIP-${ts}`
    const prodRes = await request.post(PRODUCTS, {
      data: {
        name: productName,
        sku: productSku,
        weight_kg: '2.00',
        unit_price: '500.00',
        stock: 100,
        supplier: supplierId,
        warehouse: warehouseId,
        is_active: true,
      },
      headers,
    })
    productId = ((await prodRes.json()) as { id: number }).id
  })

  test.afterAll(async ({ request }) => {
    const headers = await getAuthHeaders(request)
    // Orden inverso de FK: product → supplier → warehouse → customer
    await request.delete(`${PRODUCTS}${productId}/`,  { headers }).catch(() => {})
    await request.delete(`${SUPP}${supplierId}/`,      { headers }).catch(() => {})
    await request.delete(`${WH}${warehouseId}/`,       { headers }).catch(() => {})
    await request.delete(`${CUSTOMERS}${customerId}/`, { headers }).catch(() => {})
  })

  // ─── 1: Lista ───────────────────────────────────────────────────────────────
  // Seed vía API → recuperar tracking_number → verificar fila en tabla.
  // ShipmentColumns: tracking_number | Cliente | Ruta | Estado | Entrega | Peso | Acciones.

  test('lista: fila con tracking_number auto-generado visible tras sembrar vía API', async ({ page, api }) => {
    const id = await api.seed(SHIPMENTS, shipmentPayload())

    // Obtener tracking_number del registro (auto-generado por el backend)
    const res = await api.get(`${SHIPMENTS}${id}/`)
    const { tracking_number } = (await res.json()) as { tracking_number: string }
    expect(tracking_number).toMatch(/^TRK-/)

    try {
      await page.goto('/shipments')
      // tbody tr para excluir la fila de header (que matchearía por bug de shadcn Table)
      await expect(page.locator('tbody tr', { hasText: tracking_number })).toBeVisible({ timeout: 10_000 })
    } finally {
      await api.remove(SHIPMENTS, id)
    }
  })

  // ─── 2: Crear ───────────────────────────────────────────────────────────────
  // Sheet "Nuevo envío" → seleccionar cliente + almacén → llenar destino y costo
  // → guardar → verificar que el tracking_number TRK- aparece en lista.

  test('crear: Sheet → form con cliente y almacén → tracking_number TRK- en lista', async ({ page, api }) => {
    let createdId: number | undefined

    try {
      await page.goto('/shipments')
      await page.getByRole('button', { name: 'Nuevo envío' }).click()
      await expect(page.getByRole('dialog').getByText('Nuevo envío')).toBeVisible()

      const dialog = page.getByRole('dialog')

      // Cliente (required por backend) — opciones muestran solo {c.name}
      await dialog.getByLabel('Cliente').click()
      await page.getByRole('option', { name: customerName }).click()

      // Almacén de origen (required) — opciones muestran "name — city"
      await dialog.getByLabel('Almacén de origen').click()
      await page.getByRole('option', { name: `${warehouseName} — ${warehouseCity}` }).click()

      // Campos de destino (required)
      await dialog.getByLabel('Dirección de destino').fill('Av. Creación E2E 200')
      await dialog.getByLabel('Ciudad de destino').fill('Rosario')
      await dialog.getByLabel('País de destino').fill('Argentina')

      // Costo calculado (required)
      await dialog.getByLabel('Costo calculado').fill('2500.00')

      // Estado default = "Pendiente"; Ruta es opcional → no tocar

      // Interceptar la respuesta del POST para obtener id y tracking_number
      const responsePromise = page.waitForResponse(
        (res) => res.url().includes('/shipments/') && res.request().method() === 'POST',
        { timeout: 15_000 }
      )

      await dialog.getByRole('button', { name: 'Guardar' }).click()

      const createResponse = await responsePromise
      const createBody = (await createResponse.json()) as Record<string, unknown>
      expect(
        createResponse.status(),
        `POST /shipments/ falló con ${createResponse.status()}: ${JSON.stringify(createBody)}`
      ).toBe(201)

      // WRITE serializer no incluye tracking_number — obtenerlo vía GET posterior
      createdId = (createBody as { id: number }).id

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 })

      // GET para obtener tracking_number del read serializer
      const shipmentRes = await api.get(`${SHIPMENTS}${createdId}/`)
      const { tracking_number } = (await shipmentRes.json()) as { tracking_number: string }

      expect(tracking_number).toMatch(/^TRK-/)
      await expect(page.locator('tbody tr', { hasText: tracking_number })).toBeVisible({ timeout: 10_000 })
    } finally {
      if (createdId) await api.remove(SHIPMENTS, createdId)
    }
  })

  // ─── 3: Items — agregar y eliminar ──────────────────────────────────────────
  // Seed shipment → ir a detail page → agregar item con Producto+Cantidad
  // → verificar nombre en items list → click "Eliminar item" → verificar ausencia.

  test('items: agregar item Producto+Cantidad → aparece en lista → eliminar', async ({ page, api }) => {
    const id = await api.seed(SHIPMENTS, shipmentPayload())

    try {
      await page.goto(`/shipments/${id}`)
      await expect(page.getByRole('heading', { name: 'Editar envío' })).toBeVisible()

      // ShipmentItemForm: Producto select — opciones muestran "name — sku"
      await page.getByLabel('Producto').click()
      await page.getByRole('option', { name: `${productName} — ${productSku}` }).click()

      // Cantidad tiene default 1 — no modificar

      await page.getByRole('button', { name: 'Agregar item' }).click()

      // Item aparece en ShipmentItemList (span.font-medium muestra product.name)
      const itemName = page.locator('span.font-medium', { hasText: productName })
      await expect(itemName).toBeVisible({ timeout: 8_000 })

      // Eliminar el item
      await page.getByRole('button', { name: 'Eliminar item' }).first().click()

      // Item desaparece de la lista
      await expect(itemName).not.toBeVisible({ timeout: 8_000 })
    } finally {
      await api.remove(SHIPMENTS, id)
    }
  })

  // ─── 4: Status transition ───────────────────────────────────────────────────
  // Seed shipment (pending) → detail page → leer tracking_number del header
  // → cambiar Estado select a "En tránsito" → guardar → verificar en lista.

  test('status: pending → in_transit se refleja en lista', async ({ page, api }) => {
    const id = await api.seed(SHIPMENTS, shipmentPayload())

    try {
      await page.goto(`/shipments/${id}`)
      await expect(page.getByRole('heading', { name: 'Editar envío' })).toBeVisible()

      // Leer tracking_number del detail (span.font-mono en el header de la página)
      const tn = (await page.locator('span.font-mono').first().textContent())?.trim() ?? ''
      expect(tn).toMatch(/^TRK-/)

      // Cambiar Estado de "Pendiente" → "En tránsito"
      await page.getByLabel('Estado').click()
      await page.getByRole('option', { name: 'En tránsito' }).click()

      await page.getByRole('button', { name: 'Guardar' }).click()
      // Esperar a que la mutación complete (botón deja de estar deshabilitado)
      await expect(page.getByRole('button', { name: 'Guardar' })).not.toBeDisabled({ timeout: 8_000 })

      // Verificar en lista
      await page.goto('/shipments')
      const row = page.locator('tbody tr', { hasText: tn })
      await expect(row).toBeVisible({ timeout: 10_000 })
      await expect(row).toContainText('En tránsito')
    } finally {
      await api.remove(SHIPMENTS, id)
    }
  })

  // ─── 5: Eliminar ────────────────────────────────────────────────────────────
  // Seed shipment → detail page → botón destructivo "Eliminar"
  // → ShipmentDeleteDialog (role="dialog") → confirmar → redirect a /shipments
  // → fila ya no está en la lista.

  test('eliminar: botón en detail → Dialog → confirmar → redirect y fila desaparece', async ({ page, api }) => {
    const id = await api.seed(SHIPMENTS, shipmentPayload())

    // Obtener tracking_number para verificar ausencia en lista
    const res = await api.get(`${SHIPMENTS}${id}/`)
    const { tracking_number } = (await res.json()) as { tracking_number: string }
    expect(tracking_number).toMatch(/^TRK-/)

    let deleted = false

    try {
      await page.goto(`/shipments/${id}`)
      await expect(page.getByRole('heading', { name: 'Editar envío' })).toBeVisible()

      // Botón destructivo en el header de la página de detalle
      await page.getByRole('button', { name: 'Eliminar' }).click()

      // ShipmentDeleteDialog usa <Dialog> (no AlertDialog)
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('dialog')).toContainText('Eliminar envío')

      // Botón de confirmación dentro del dialog
      await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click()

      // onDeleted() → router.push('/shipments')
      await expect(page).toHaveURL(/\/shipments$/, { timeout: 8_000 })
      await expect(page.locator('tbody tr', { hasText: tracking_number })).not.toBeVisible({ timeout: 10_000 })
      deleted = true
    } finally {
      if (!deleted) await api.remove(SHIPMENTS, id).catch(() => {})
    }
  })
})
