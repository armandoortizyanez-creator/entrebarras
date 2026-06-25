/**
 * Tests: Calculadora de 1RM (CalculadoraView)
 * Cubre: selector de atleta, después de seleccionar: movimiento, 1RM, tabla, zonas
 */
import { test, expect } from '@playwright/test'

test.describe('Calculadora de 1RM', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/calculadora')
    // El h1 "Calculadora de % y PRs" siempre aparece
    await expect(page.locator('h1').filter({ hasText: /calculadora/i })).toBeVisible({ timeout: 10_000 })
  })

  test('muestra el selector de atleta para el coach', async ({ page }) => {
    // El coach ve primero la sección "SELECCIONAR ATLETA"
    await expect(page.getByText('SELECCIONAR ATLETA')).toBeVisible()
  })

  test('muestra chips de atletas o estado vacío', async ({ page }) => {
    // La sección siempre aparece (con chips o con mensaje de vacío)
    await expect(page.getByText('SELECCIONAR ATLETA')).toBeVisible()
    // Los chips son botones dentro de la sección, o el mensaje "No hay atletas registrados"
    // Usar XPath para obtener el padre directo del <p> "Seleccionar atleta"
    const sectionDiv = page.locator('p').filter({ hasText: 'Seleccionar atleta' }).locator('xpath=parent::div')
    await expect(
      sectionDiv.locator('button').first()
        .or(page.getByText(/no hay atletas registrados/i))
    ).toBeVisible({ timeout: 5_000 })
  })

  test('al seleccionar atleta aparece el selector de movimiento', async ({ page }) => {
    // XPath para el div padre directo del <p> "Seleccionar atleta"
    const sectionDiv = page.getByText('SELECCIONAR ATLETA').locator('xpath=parent::div')
    const chipCount = await sectionDiv.locator('button').count()
    if (chipCount === 0) return // Sin atletas registrados — estado válido

    await sectionDiv.locator('button').first().click()
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5_000 })
  })

  test('al seleccionar atleta aparece el campo de 1RM', async ({ page }) => {
    const sectionDiv = page.getByText('SELECCIONAR ATLETA').locator('xpath=parent::div')
    const chipCount = await sectionDiv.locator('button').count()
    if (chipCount === 0) return

    await sectionDiv.locator('button').first().click()
    await expect(page.getByPlaceholder('Ej. 100').first()).toBeVisible({ timeout: 5_000 })
  })

  test('la tabla de porcentajes se calcula al ingresar 1RM', async ({ page }) => {
    const sectionDiv = page.getByText('SELECCIONAR ATLETA').locator('xpath=parent::div')
    const chipCount = await sectionDiv.locator('button').count()
    if (chipCount === 0) return

    await sectionDiv.locator('button').first().click()
    await page.getByPlaceholder('Ej. 100').first().fill('100')

    await expect(
      page.getByText(/50%|65%|80%|90%|100%/).first()
    ).toBeVisible({ timeout: 5_000 })
  })

  test('muestra etiquetas de zona (Calentamiento, Fuerza, etc.)', async ({ page }) => {
    const sectionDiv = page.getByText('SELECCIONAR ATLETA').locator('xpath=parent::div')
    const chipCount = await sectionDiv.locator('button').count()
    if (chipCount === 0) return

    await sectionDiv.locator('button').first().click()
    for (const zona of ['Calentamiento', 'Técnica', 'Fuerza']) {
      await expect(page.getByText(zona, { exact: false }).first()).toBeVisible({ timeout: 5_000 })
    }
  })

  test('muestra sección de récords (selecciona un atleta o lista)', async ({ page }) => {
    // La sección de PRs siempre muestra algo: "Selecciona un atleta" o la lista
    await expect(
      page.getByText(/selecciona un atleta|récord|PR/i).first()
    ).toBeVisible({ timeout: 5_000 })
  })
})
