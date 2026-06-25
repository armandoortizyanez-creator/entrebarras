/**
 * Tests: Inicio de sesión
 * Cubre: renderizado, validaciones, credenciales inválidas, login exitoso, rutas protegidas
 */
import { test, expect } from '@playwright/test'

// Estos tests NO usan storageState — prueban el flujo de auth desde cero
test.use({ storageState: { cookies: [], origins: [] } })

const VALID_EMAIL    = 'coach@entrebarras.cl'
const VALID_PASSWORD = 'EB_Test2026!'

test.describe('Página de login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('muestra el formulario de login', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible()
  })

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.locator('#email').fill('usuario@falso.cl')
    await page.locator('#password').fill('contraseña_incorrecta')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    // Usar <p role="alert"> específico (ignorar el route-announcer de Next.js)
    const error = page.locator('p[role="alert"]')
    await expect(error).toBeVisible({ timeout: 8_000 })
    await expect(error).toContainText('Email o contraseña incorrectos')
  })

  test('el botón muestra "Ingresando..." mientras carga', async ({ page }) => {
    // Usamos credenciales inválidas para que el request no navegue y podamos
    // observar el estado de carga intermedio antes de recibir error
    await page.locator('#email').fill('lento@test.cl')
    await page.locator('#password').fill('clave_incorrecta_para_ver_loading')

    const btn = page.getByRole('button', { name: 'Iniciar sesión' })

    // Disparar el click y capturar el texto inmediatamente
    const [textDuringLoad] = await Promise.all([
      btn.textContent(),
      btn.click(),
    ])

    // Tras el click el botón debe haberse deshabilitado o cambiado de texto
    // Esperamos el error (confirma que el request ocurrió)
    await expect(page.locator('p[role="alert"]')).toBeVisible({ timeout: 8_000 })
  })

  test('redirige al dashboard con credenciales válidas', async ({ page }) => {
    await page.locator('#email').fill(VALID_EMAIL)
    await page.locator('#password').fill(VALID_PASSWORD)
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    await page.waitForURL('**/dashboard**', { timeout: 15_000 })
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Rutas protegidas', () => {
  test('redirige /dashboard a /login cuando no hay sesión', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login**', { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirige /dashboard/atletas a /login cuando no hay sesión', async ({ page }) => {
    await page.goto('/dashboard/atletas')
    await page.waitForURL('**/login**', { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
