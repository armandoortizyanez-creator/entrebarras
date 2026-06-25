/**
 * Tests: Programación semanal (ProgramacionView)
 * Cubre: renderizado de la semana, días, botones de acción
 */
import { test, expect } from '@playwright/test'

test.describe('Vista de programación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/programacion')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 })
  })

  test('muestra la semana actual con los 7 días', async ({ page }) => {
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    for (const dia of dias) {
      await expect(page.getByText(dia, { exact: false }).first()).toBeVisible()
    }
  })

  test('muestra los números de día del mes', async ({ page }) => {
    // La semana actual siempre tiene el día de hoy visible
    const today = new Date().getDate().toString()
    await expect(page.getByText(today, { exact: true }).first()).toBeVisible()
  })

  test('botones de navegación de semana existen', async ({ page }) => {
    // Los botones de chevron para semana anterior/siguiente están en el header
    // Son los botones con SVG dentro del bloque de programación (no el sidebar)
    // :visible filtra el botón oculto del sidebar
    const navBtns = page.locator('button:visible').filter({ has: page.locator('svg') })
    await expect(navBtns.first()).toBeVisible({ timeout: 5_000 })
  })

  test('muestra la fecha de la semana actual', async ({ page }) => {
    // Debe mostrar algún mes/año
    const meses = 'ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic'
    await expect(page.locator(`text=/${meses}/i`).first()).toBeVisible({ timeout: 5_000 })
  })

  test('botones para agregar entrenamiento están presentes', async ({ page }) => {
    // Cada celda de día tiene un botón de "+" para agregar
    const addButton = page.getByRole('button', { name: '+' })
      .or(page.locator('button[title*="Agregar"], button[title*="gregar"]'))
    // Al menos uno de los días debe tener el botón visible
    await expect(addButton.first()).toBeVisible({ timeout: 5_000 })
  })
})
