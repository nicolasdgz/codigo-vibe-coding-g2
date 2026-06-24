/**
 * Prerequisites — servidores deben estar corriendo ANTES de `npm run e2e`.
 * El proyecto no levanta servidores automáticamente (ver CLAUDE.md).
 *
 *   1. Backend  →  cd logistica-api && python manage.py runserver 8000
 *   2. Frontend →  cd logistica-frontend && npm run dev   (puerto 3000)
 *   3. Usuario de test (una sola vez):
 *        source .venv/Scripts/activate && python manage.py shell -c "
 *          from django.contrib.auth import get_user_model; U = get_user_model()
 *          U.objects.create_superuser('testuser', 'test@test.local', 'testpass123')
 *        "
 *
 * Variables de entorno (todas opcionales, los defaults funcionan en local):
 *   E2E_BASE_URL   URL del frontend   (default: http://localhost:3000)
 *   E2E_API_URL    URL del backend    (default: http://localhost:8000/api/v1)
 *   E2E_USERNAME   Usuario de test    (default: testuser)
 *   E2E_PASSWORD   Contraseña de test (default: testpass123)
 */

import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Playwright corre fuera del contexto de Next.js, así que carga .env.local manualmente
dotenv.config({ path: '.env.local' })

export default defineConfig({
  testDir: 'e2e',
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // 1. Obtiene tokens y guarda storageState en playwright/.auth/user.json
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // 2. Tests del flujo de login (sin storageState — testean el login mismo)
    {
      name: 'login',
      testMatch: /login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // 3. Resto de specs autenticados (dependen del setup)
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: /login\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
    },
  ],
})
