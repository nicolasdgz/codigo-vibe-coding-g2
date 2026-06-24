import { test as base, request, type APIResponse } from '@playwright/test'

const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'

type Api = {
  get(path: string): Promise<APIResponse>
  post(path: string, body: object): Promise<APIResponse>
  delete(path: string): Promise<APIResponse>
  /** POST `endpoint` with `payload`, returns the created record's `id`. */
  seed(endpoint: string, payload: object): Promise<number>
  /** DELETE `${endpoint}${id}/` — cleanup after test. */
  remove(endpoint: string, id: number): Promise<void>
}

type Fixtures = { api: Api }

export const test = base.extend<Fixtures>({
  api: async ({}, use) => {
    const username = process.env.E2E_USERNAME ?? 'testuser'
    const password = process.env.E2E_PASSWORD ?? 'testpass123'

    // Authenticate
    const anonCtx = await request.newContext()
    const tokenRes = await anonCtx.post(`${API_BASE}/auth/login/`, {
      data: { username, password },
    })
    const { access } = await tokenRes.json()
    await anonCtx.dispose()

    // Authenticated context
    const authCtx = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${access}` },
    })

    await use({
      get: (path) => authCtx.get(path),
      post: (path, body) => authCtx.post(path, { data: body }),
      delete: (path) => authCtx.delete(path),

      async seed(endpoint, payload) {
        const r = await authCtx.post(endpoint, { data: payload })
        const data = (await r.json()) as { id: number }
        return data.id
      },

      async remove(endpoint, id) {
        await authCtx.delete(`${endpoint}${id}/`)
      },
    })

    await authCtx.dispose()
  },
})

export { expect } from '@playwright/test'
