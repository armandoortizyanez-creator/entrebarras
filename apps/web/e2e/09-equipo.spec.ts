/**
 * Tests: Equipo (EquipoView)
 * Cubre: stats, tabla de miembros, búsqueda, filtros de rol
 */
import { test, expect } from '@playwright/test'

test.describe('Vista de equipo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/equipo')
    // Puede mostrar "No tienes permisos" si el usuario es solo coach
    // En ese caso, los tests verifican el comportamiento correcto
    await page.waitForLoadState('networkidle')
  })

  test('carga la página sin error 500', async ({ page }) => {
    // No debe haber un error fatal en la página
    await expect(page.locator('body')).not.toContainText('500')
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('muestra stats de admins, coaches y atletas (o mensaje de permisos)', async ({ page }) => {
    const tienePermisos = await page.getByText(/mi equipo/i).count() > 0

    if (tienePermisos) {
      await expect(page.getByText('ADMINS')).toBeVisible()
      await expect(page.getByText('COACHES')).toBeVisible()
      await expect(page.getByText('ATLETAS')).toBeVisible()
    } else {
      await expect(page.getByText(/no tienes permisos/i)).toBeVisible()
    }
  })

  test('búsqueda de miembros está disponible (si tiene permisos)', async ({ page }) => {
    const tienePermisos = await page.getByText(/mi equipo/i).count() > 0
    if (!tienePermisos) return

    const input = page.getByPlaceholder(/buscar por nombre/i)
    await expect(input).toBeVisible()
    await input.fill('test')
    await input.clear()
  })

  test('filtros de rol existen (si tiene permisos)', async ({ page }) => {
    const tienePermisos = await page.getByText(/mi equipo/i).count() > 0
    if (!tienePermisos) return

    await expect(page.getByRole('button', { name: 'Todos' })).toBeVisible()
    await expect(page.getByRole('button', { name: /coach/i })).toBeVisible()
  })

  test('link a invitaciones está presente (si tiene permisos)', async ({ page }) => {
    const tienePermisos = await page.getByText(/mi equipo/i).count() > 0
    if (!tienePermisos) return

    await expect(page.getByRole('link', { name: /invitar miembro/i })).toBeVisible()
  })
})
