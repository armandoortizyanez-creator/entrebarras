/**
 * Tests: Invitaciones (InvitacionesView)
 * Cubre: listado, filtros de estado, formulario de nueva invitación, validaciones
 */
import { test, expect } from '@playwright/test'

test.describe('Vista de invitaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/invitaciones')
    await page.waitForLoadState('networkidle')
  })

  test('carga sin errores', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Application error')
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('muestra el encabezado de invitaciones (o mensaje de permisos)', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /invitaciones/i })
        .or(page.getByText(/no tienes permisos/i))
    ).toBeVisible({ timeout: 8_000 })
  })

  test('muestra filtros de estado', async ({ page }) => {
    const tienePermisos = await page.getByRole('heading', { name: /invitaciones/i }).count() > 0
    if (!tienePermisos) return

    await expect(page.getByRole('button', { name: /todas/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /pendientes/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /aceptadas/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /expiradas/i })).toBeVisible()
  })

  test('abre el formulario de nueva invitación', async ({ page }) => {
    const tienePermisos = await page.getByRole('heading', { name: /invitaciones/i }).count() > 0
    if (!tienePermisos) return

    await page.getByRole('button', { name: /nueva invitación/i }).click()
    await expect(page.getByText('Email *')).toBeVisible()
    await expect(page.getByRole('button', { name: /enviar invitación/i })).toBeVisible()
  })

  test('valida email requerido en el formulario', async ({ page }) => {
    const tienePermisos = await page.getByRole('heading', { name: /invitaciones/i }).count() > 0
    if (!tienePermisos) return

    await page.getByRole('button', { name: /nueva invitación/i }).click()
    await page.getByRole('button', { name: /enviar invitación/i }).click()

    // Debe mostrar error de validación
    await expect(page.getByText(/email es requerido/i)).toBeVisible({ timeout: 5_000 })
  })

  test('cierra el formulario con Cancelar', async ({ page }) => {
    const tienePermisos = await page.getByRole('heading', { name: /invitaciones/i }).count() > 0
    if (!tienePermisos) return

    await page.getByRole('button', { name: /nueva invitación/i }).click()
    await expect(page.getByRole('button', { name: /enviar invitación/i })).toBeVisible()

    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('button', { name: /enviar invitación/i })).not.toBeVisible()
  })

  test('filtra por estado "Pendientes"', async ({ page }) => {
    const tienePermisos = await page.getByRole('heading', { name: /invitaciones/i }).count() > 0
    if (!tienePermisos) return

    await page.getByRole('button', { name: /pendientes/i }).click()
    // La vista debe responder al filtro sin error
    await expect(page.getByRole('button', { name: /pendientes/i })).toBeVisible()
  })
})
