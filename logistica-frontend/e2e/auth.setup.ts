import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1'
const username = process.env.E2E_USERNAME ?? 'testuser'
const password = process.env.E2E_PASSWORD ?? 'testpass123'
const authFile = path.join(process.cwd(), 'playwright/.auth/user.json')

setup('authenticate', async ({ page, request }) => {
  // Ensure output directory exists
  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  // Get tokens + user from API (faster than UI login)
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { username, password },
  })
  expect(res.ok(), `Login API failed (${res.status()}): ${await res.text()}`).toBeTruthy()
  const { access, refresh, user } = await res.json()

  // Navigate to app to establish the origin for localStorage
  await page.goto(`${BASE_URL}/login`)

  // Seed Zustand auth-storage  { state: {...}, version: 0 }
  await page.evaluate(
    ({ access, refresh, user }) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: { accessToken: access, refreshToken: refresh, user, isAuthenticated: true },
          version: 0,
        })
      )
    },
    { access, refresh, user }
  )

  // Set proxy guard cookie (proxy.ts checks `logged-in`)
  await page.context().addCookies([
    { name: 'logged-in', value: '1', domain: 'localhost', path: '/', sameSite: 'Lax' },
  ])

  // Verify protected route is accessible
  await page.goto(`${BASE_URL}/dashboard`)
  await expect(page).toHaveURL(/\/dashboard/)

  await page.context().storageState({ path: authFile })
})
