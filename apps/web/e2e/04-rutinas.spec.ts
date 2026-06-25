/**
 * Tests: Rutinas (RutinasView)
 * Cubre: listado, tipos, modal de creación, navegación al builder
 */
import { test, expect } from '@playwright/test'

const NEW_ROUTINE_NAME = `Rutina Test ${Date.now()}`

test.describe('Vista de rutinas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/rutinas')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 })
  })

  test('muestra el listado de rutinas o estado vacío', async ({ page }) => {
    const count    = page.locator('p').filter({ hasText: /rutina.*registrada/i }).first()
    const emptyMsg = page.getByText(/sin rutinas/i)
    await expect(count.or(emptyMsg)).toBeVisible({ timeout: 8_000 })
  })

  test('abre el modal de nueva rutina', async ({ page }) => {
    await page.getByRole('button', { name: /nueva rutina/i }).click()
    await expect(page.locator('h2').filter({ hasText: 'Nueva rutina' })).toBeVisible()
  })

  test('muestra los tipos de rutina en el select', async ({ page }) => {
    await page.getByRole('button', { name: /nueva rutina/i }).click()

    const select = page.locator('select')
    await expect(select).toBeVisible()

    const options = await select.locator('option').allTextContents()
    expect(options).toContain('Fuerza')
    expect(options).toContain('Hipertrofia')
    expect(options).toContain('Cardio')
  })

  test('crea una rutina nueva', async ({ page }) => {
    await page.getByRole('button', { name: /nueva rutina/i }).click()

    // Placeholder real: "Ej. Push Pull Legs — Semana 1"
    await page.getByPlaceholder(/Push Pull Legs/i).fill(NEW_ROUTINE_NAME)
    await page.getByRole('button', { name: /crear y editar/i }).click()

    // Redirige al builder de la rutina
    await page.waitForURL(/\/dashboard\/rutinas\/.+/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/dashboard\/rutinas\/.+/)
  })

  test('opción "Guardar como plantilla" existe', async ({ page }) => {
    await page.getByRole('button', { name: /nueva rutina/i }).click()
    await expect(page.getByText('Guardar como plantilla')).toBeVisible()
  })

  test('cierra el modal con Cancelar', async ({ page }) => {
    await page.getByRole('button', { name: /nueva rutina/i }).click()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.locator('h2').filter({ hasText: 'Nueva rutina' })).not.toBeVisible()
  })
})
