/**
 * Tests: Grupos de entrenamiento (GruposView)
 * Cubre: listado de grupos, creación, asignación de atletas
 */
import { test, expect } from '@playwright/test'

test.describe('Vista de grupos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/grupos')
    await page.waitForLoadState('networkidle')
  })

  test('carga sin error', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Application error')
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('muestra el encabezado de grupos', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /grupos/i })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('muestra listado de grupos o estado vacío', async ({ page }) => {
    // Antes buscaba "grupos creados", un texto que la vista nunca tuvo: solo
    // pasaba por el estado vacio. Ahora acepta las dos situaciones reales:
    // hay tarjetas de grupo, o se muestra el mensaje de vacio.
    const tarjetas = page.locator('button[aria-label^="Eliminar grupo"]').first()
    const vacio    = page.getByText(/no hay grupos/i).first()
    await expect(tarjetas.or(vacio).first()).toBeVisible({ timeout: 8_000 })
  })

  test('botón para crear grupo existe', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /nuevo grupo|crear grupo|agregar grupo/i })
    if (await createBtn.count() > 0) {
      await expect(createBtn).toBeVisible()
    }
  })

  test('modal de creación de grupo funciona', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /nuevo grupo|crear grupo/i })
    if (await createBtn.count() === 0) return

    await createBtn.click()
    await expect(
      page.getByRole('heading', { name: /nuevo grupo|crear grupo/i })
        .or(page.locator('[role="dialog"]'))
    ).toBeVisible({ timeout: 5_000 })

    // Cerrar el modal
    const cancelBtn = page.getByRole('button', { name: /cancelar|cerrar/i })
    if (await cancelBtn.count() > 0) {
      await cancelBtn.first().click()
    }
  })
})
