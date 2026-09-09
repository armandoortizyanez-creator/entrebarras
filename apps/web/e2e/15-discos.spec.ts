/**
 * Tests: calculadora de discos (CalculadoraDeDiscos)
 *
 * La cuenta la hace el atleta con la barra delante, así que un error acá no
 * es cosmético: carga mal el peso. Se prueban los números concretos, no que
 * "la sección exista".
 */
import { test, expect } from '@playwright/test'

async function llenarObjetivo(page: import('@playwright/test').Page, kg: string) {
  const campo = page.locator('#discos-objetivo')
  await campo.fill(kg)
}

test.describe('Calculadora de discos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/calculadora')
    await expect(page.locator('#discos-objetivo')).toBeVisible({ timeout: 15_000 })
  })

  test('80 kg con barra de 20 son 25 + 5 por lado', async ({ page }) => {
    await llenarObjetivo(page, '80')

    await expect(page.getByText('POR LADO · 30 KG')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('[data-disco="1x25kg"]')).toBeVisible()
    await expect(page.locator('[data-disco="1x5kg"]')).toBeVisible()
    // Y nada más: dos discos por lado, no tres
    await expect(page.locator('[data-disco]')).toHaveCount(2)
  })

  test('cambiar a la barra de 15 cambia los discos', async ({ page }) => {
    await llenarObjetivo(page, '80')
    await page.locator('#discos-barra').selectOption('15')

    // 80 − 15 = 65, o sea 32.5 por lado
    await expect(page.getByText('POR LADO · 32.5 KG')).toBeVisible({ timeout: 8_000 })
  })

  test('con 20 kg ya cargados por lado dice cuánto falta, en kg y en lb', async ({ page }) => {
    await llenarObjetivo(page, '80')
    await page.locator('#discos-cargado').fill('20')

    await expect(page.getByText('Faltan 10 kg por lado')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText(/20 kg en total · 44\.1 lb/)).toBeVisible()
    await expect(page.getByText('AGREGA POR LADO')).toBeVisible()
    await expect(page.locator('[data-disco="1x10kg"]')).toBeVisible()
  })

  test('avisa cuando ya se llegó al peso', async ({ page }) => {
    await llenarObjetivo(page, '80')
    await page.locator('#discos-cargado').fill('30')

    await expect(page.getByText(/Ya está en 80 kg/)).toBeVisible({ timeout: 8_000 })
  })

  test('avisa cuando se pasó', async ({ page }) => {
    await llenarObjetivo(page, '80')
    await page.locator('#discos-cargado').fill('35')

    await expect(page.getByText(/Te pasaste por 10 kg/)).toBeVisible({ timeout: 8_000 })
  })

  test('un peso menor que la barra no inventa discos', async ({ page }) => {
    await llenarObjetivo(page, '10')

    await expect(page.getByText(/no llega ni a la barra vacía/)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText(/POR LADO/)).not.toBeVisible()
  })

  test('83.5 kg se arma exacto con discos en libras', async ({ page }) => {
    // El caso que justifica mezclar sistemas: con puros kilos no sale redondo,
    // con dos discos de libras por lado sí.
    await llenarObjetivo(page, '83.5')

    await expect(page.getByText('POR LADO · 31.75 KG')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('[data-disco="1x45lb"]')).toBeVisible()
    await expect(page.locator('[data-disco="1x25lb"]')).toBeVisible()
  })
})
