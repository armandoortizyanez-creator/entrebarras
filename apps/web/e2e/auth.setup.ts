/**
 * Auth setup: se ejecuta una vez antes de los tests.
 * Inicia sesión como coach y guarda el estado de autenticación.
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const COACH_AUTH_FILE = path.join(__dirname, '.auth/coach.json')

const TEST_COACH = {
  email: 'coach@entrebarras.cl',
  password: 'EB_Test2026!',
}

setup('autenticar como coach', async ({ page }) => {
  await page.goto('/login')

  await page.locator('#email').fill(TEST_COACH.email)
  await page.locator('#password').fill(TEST_COACH.password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await page.waitForURL('**/dashboard**', { timeout: 15_000 })
  await expect(page).toHaveURL(/\/dashboard/)

  await page.context().storageState({ path: COACH_AUTH_FILE })
})
