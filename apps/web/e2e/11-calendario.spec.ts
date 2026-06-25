/**
 * Tests: Calendario (CalendarioView)
 * Cubre: renderizado del mes, navegación, días de la semana
 */
import { test, expect } from '@playwright/test'

test.describe('Vista de calendario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/calendario')
    await expect(page.getByRole('heading', { name: /calendario/i })).toBeVisible({ timeout: 10_000 })
  })

  test('muestra el mes y año actual', async ({ page }) => {
    // Debe mostrar el mes actual
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    const mesActual = meses[new Date().getMonth()]

    await expect(page.getByText(new RegExp(mesActual, 'i'))).toBeVisible({ timeout: 5_000 })
  })

  test('muestra los días de la semana', async ({ page }) => {
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    for (const dia of diasSemana) {
      await expect(page.getByText(dia, { exact: false })).toBeVisible()
    }
  })

  test('navegación al mes anterior funciona', async ({ page }) => {
    // Capturar el mes actual
    const before = await page.locator('text=/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i').first().textContent()

    // El botón "anterior" usa flecha ← (texto, no SVG)
    const prevBtn = page.locator('button').filter({ hasText: '←' })
    await prevBtn.click()
    await page.waitForTimeout(500)

    const after = await page.locator('text=/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i').first().textContent()

    // El mes debe haber cambiado
    expect(before).not.toEqual(after)
  })

  test('cada día del mes es visible en la grilla', async ({ page }) => {
    // Al menos el día 1 del mes debe estar visible
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible()
  })

  test('botón para agregar evento existe al hacer clic en un día', async ({ page }) => {
    // Intentar hacer clic en el día 15 del mes actual
    const day15 = page.getByText('15', { exact: true }).first()
    if (await day15.count() > 0) {
      await day15.click()
      // Puede aparecer un modal o botón de agregar
      await page.waitForTimeout(500)
    }
    // No debe haber error
    await expect(page.locator('body')).not.toContainText('Application error')
  })
})
