/**
 * Tests: Reportes (ReportesView)
 * Cubre: carga de métricas, gráficas, tabla de atletas en riesgo
 */
import { test, expect } from '@playwright/test'

test.describe('Vista de reportes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/reportes')
    await expect(page.getByRole('heading', { name: /reportes/i })).toBeVisible({ timeout: 10_000 })
  })

  test('muestra la sección de retención de atletas', async ({ page }) => {
    await expect(page.getByText(/retención de atletas/i)).toBeVisible({ timeout: 8_000 })
  })

  test('muestra métricas KPI (total atletas y cumplimiento)', async ({ page }) => {
    await expect(page.getByText(/total atletas/i)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText(/cumplimiento/i)).toBeVisible()
  })

  test('muestra la sección de sesiones', async ({ page }) => {
    await expect(page.getByText(/sesiones/i)).toBeVisible({ timeout: 8_000 })
  })

  test('muestra la tabla de atletas en riesgo', async ({ page }) => {
    await expect(
      page.getByText(/atletas en riesgo/i).or(page.getByText(/sin atletas en riesgo/i))
    ).toBeVisible({ timeout: 8_000 })
  })

  test('muestra distribución por riesgo (Active/Riesgo)', async ({ page }) => {
    await expect(
      page.getByText(/activos/i).or(page.getByText(/riesgo/i))
    ).toBeVisible({ timeout: 8_000 })
  })
})
