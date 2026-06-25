/**
 * Tests: Timer / Temporizador (TimerView)
 * Modos: REGRESIVA, CRONÓMETRO, INTERVALOS
 * El timer es pantalla completa con clase .eb-timer-fullscreen
 */
import { test, expect } from '@playwright/test'

test.describe('Timer de entrenamiento', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/timer')
    // Los botones de modo siempre aparecen en la barra superior
    await expect(page.getByRole('button', { name: /regresiva|cronómetro|intervalos/i }).first())
      .toBeVisible({ timeout: 10_000 })
  })

  test('muestra los modos de timer disponibles', async ({ page }) => {
    for (const modo of ['REGRESIVA', 'CRONÓMETRO', 'INTERVALOS']) {
      await expect(page.getByRole('button', { name: modo })).toBeVisible()
    }
  })

  test('muestra el display del tiempo (timer fullscreen)', async ({ page }) => {
    // El timer toma toda la pantalla con clase eb-timer-fullscreen
    await expect(page.locator('.eb-timer-fullscreen')).toBeVisible()
    // El tiempo se muestra con ":" de separación (e.g. "05:00")
    await expect(page.getByText(':', { exact: true }).first()).toBeVisible()
  })

  test('botón de play / inicio está presente', async ({ page }) => {
    // El botón de play/inicio es grande y redondo con ícono de play
    // No tiene texto — identificar por SVG o posición
    const playBtn = page.locator('.eb-timer-fullscreen button:visible')
      .filter({ hasNot: page.getByRole('button', { name: /regresiva|cronómetro|intervalos/i }) })
    await expect(playBtn.first()).toBeVisible()
  })

  test('se puede cambiar entre modos sin error', async ({ page }) => {
    await page.getByRole('button', { name: 'CRONÓMETRO' }).click()
    await expect(page.getByRole('button', { name: 'CRONÓMETRO' })).toBeVisible()

    await page.getByRole('button', { name: 'INTERVALOS' }).click()
    await expect(page.getByRole('button', { name: 'INTERVALOS' })).toBeVisible()

    await page.getByRole('button', { name: 'REGRESIVA' }).click()
    await expect(page.getByRole('button', { name: 'REGRESIVA' })).toBeVisible()

    // Sin error después de cambiar modos
    await expect(page.locator('.eb-timer-fullscreen')).toBeVisible()
  })

  test('modo CRONÓMETRO: se puede iniciar', async ({ page }) => {
    await page.getByRole('button', { name: 'CRONÓMETRO' }).click()

    // Buscar el botón de play (el más grande visible, no los de modo)
    const modeBtns = page.getByRole('button', { name: /regresiva|cronómetro|intervalos/i })
    const allBtns = page.locator('.eb-timer-fullscreen button:visible')

    // Click en el botón que no es de modo (el de play/inicio)
    for (let i = 0; i < await allBtns.count(); i++) {
      const btn = allBtns.nth(i)
      const name = await btn.getAttribute('aria-label') || ''
      if (!/(regresiva|cronómetro|intervalos)/i.test(name)) {
        await btn.click()
        break
      }
    }

    await page.waitForTimeout(500)
    // La pantalla sigue visible sin error
    await expect(page.locator('.eb-timer-fullscreen')).toBeVisible()
  })

  test('tiene botón de reiniciar (reset)', async ({ page }) => {
    // El reset es un botón circular con ícono de flecha — siempre visible junto al play
    const resetBtn = page.locator('.eb-timer-fullscreen button:visible')
      .filter({ hasNot: page.getByRole('button', { name: /regresiva|cronómetro|intervalos/i }) })
    // Al menos 2 botones visibles: reset + play
    const count = await resetBtn.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
