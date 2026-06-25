/**
 * Tests: WODs (WodsView)
 * Cubre: listado, creación, tipos, modal de creación
 */
import { test, expect } from '@playwright/test'

const NEW_WOD_NAME = `WOD Test ${Date.now()}`

test.describe('Vista de WODs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/wods')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 })
  })

  test('muestra el conteo de WODs o estado vacío', async ({ page }) => {
    // La app muestra "N workouts creados" o "Sin WODs todavía"
    await expect(
      page.getByText(/workouts? creado/i).or(page.getByText(/sin wods/i))
    ).toBeVisible({ timeout: 8_000 })
  })

  test('abre el modal para crear un WOD', async ({ page }) => {
    await page.getByRole('button', { name: /nuevo wod/i }).click()
    await expect(page.locator('h2').filter({ hasText: 'Nuevo WOD' })).toBeVisible()
  })

  test('muestra los tipos de WOD en el formulario', async ({ page }) => {
    await page.getByRole('button', { name: /nuevo wod/i }).click()

    for (const tipo of ['AMRAP', 'For Time', 'EMOM']) {
      await expect(page.getByText(tipo, { exact: false })).toBeVisible()
    }
  })

  test('crea un WOD nuevo tipo AMRAP', async ({ page }) => {
    await page.getByRole('button', { name: /nuevo wod/i }).click()

    // Placeholder real del campo nombre
    await page.getByPlaceholder('Ej. Murph, Fran, 21-15-9...').fill(NEW_WOD_NAME)

    // AMRAP ya es el default — click en su botón de tipo
    const amrapBtn = page.getByText('AMRAP', { exact: false }).first()
    await amrapBtn.click()

    await page.getByRole('button', { name: /crear wod/i }).click()

    // El modal se cierra tras éxito
    await expect(page.locator('h2').filter({ hasText: 'Nuevo WOD' })).not.toBeVisible({ timeout: 8_000 })
  })

  test('cierra el modal con el botón Cancelar', async ({ page }) => {
    await page.getByRole('button', { name: /nuevo wod/i }).click()
    await expect(page.locator('h2').filter({ hasText: 'Nuevo WOD' })).toBeVisible()

    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.locator('h2').filter({ hasText: 'Nuevo WOD' })).not.toBeVisible()
  })
})
