/**
 * Auth setup: se ejecuta una vez antes de los tests.
 * Inicia sesión como el coach del box de pruebas y guarda el estado.
 *
 * Las credenciales vienen del entorno, no del código. Antes estaban escritas
 * acá y apuntaban a coach@entrebarras.cl, una cuenta cuyo gimnasio ya no
 * existe: el login pasaba pero la cuenta no tenía perfil, así que todas las
 * pruebas que venían después fallaban sin decir por qué.
 *
 * El box es "QA Automatizada", separado de "Entre Barras" a propósito: estas
 * pruebas crean rutinas, atletas y asignaciones, y no pueden hacer eso en el
 * gimnasio donde hay gente entrenando de verdad.
 *
 * Para correrlas, en apps/web/.env.local:
 *   E2E_EMAIL=qa.coach@thryra.test
 *   E2E_PASSWORD=<la clave del box de pruebas>
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const COACH_AUTH_FILE = path.join(__dirname, '.auth/coach.json')

const EMAIL = process.env.E2E_EMAIL
const PASSWORD = process.env.E2E_PASSWORD

setup('autenticar como coach', async ({ page }) => {
  // Falla acá y con un mensaje claro. Sin esto el error aparecía recién en el
  // primer test, disfrazado de "no se encontró el botón X".
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'Faltan E2E_EMAIL y E2E_PASSWORD en apps/web/.env.local.\n' +
      'Son las credenciales del box de pruebas "QA Automatizada".\n' +
      'Nunca uses una cuenta del box real: estas pruebas escriben datos.'
    )
  }

  await page.goto('/login')

  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  await page.waitForURL('**/dashboard**', { timeout: 15_000 })
  await expect(page).toHaveURL(/\/dashboard/)

  // Entrar al dashboard no basta: una cuenta sin perfil también llega acá y
  // recién falla adentro. Se comprueba que la sesión tenga un box detrás.
  await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 10_000 })

  await page.context().storageState({ path: COACH_AUTH_FILE })
})
