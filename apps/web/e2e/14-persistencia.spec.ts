/**
 * Tests de PERSISTENCIA — el hueco que dejaban los demás.
 *
 * Los otros 13 archivos verifican que las pantallas se rendericen: que existan
 * los 7 días de la semana, que aparezca el botón "+". Ninguno guarda algo y
 * comprueba que quedó guardado.
 *
 * Por eso `05-programacion.spec.ts` pasó durante meses mientras Programación
 * no guardaba absolutamente nada: omitía tenant_id y cada intento moría con
 * violación de RLS, en silencio y con el modal abierto.
 *
 * La disciplina de este archivo: escribir, RECARGAR, y verificar que el dato
 * sigue ahí. Recargar es lo que distingue "la UI se ve bien" de "se guardó".
 */
import { test, expect, type Page } from '@playwright/test'

/** Marca los datos de prueba para poder limpiarlos y no confundirlos con datos reales. */
const MARCA = 'zz-e2e'
const nombreUnico = (base: string) => `${MARCA}-${base}-${Date.now()}`

async function irA(page: Page, ruta: string) {
  await page.goto(ruta)
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 })
}

/**
 * Ningún aviso de error debe quedar en pantalla tras una acción exitosa.
 *
 * Se busca por data-eb-toast y no por role="alert": Next.js monta su propio
 * role="alert" para anunciar el título de la ruta a los lectores de pantalla,
 * y eso daba falsos positivos.
 */
async function sinErrores(page: Page) {
  await expect(page.locator('[data-eb-toast]')).toHaveCount(0)
}

test.describe('Persistencia real de los guardados', () => {

  test('una rutina nueva sobrevive a recargar la página', async ({ page }) => {
    await irA(page, '/dashboard/rutinas')

    const nombre = nombreUnico('rutina')
    await page.getByRole('button', { name: /Nueva rutina/i }).click()
    await page.locator('input[placeholder*="Push Pull"]').fill(nombre)
    await page.getByRole('button', { name: /Crear y editar/i }).click()

    // Crear redirige al editor: la URL confirma que la fila existe
    await page.waitForURL(/\/dashboard\/rutinas\/[0-9a-f-]{36}/, { timeout: 15_000 })
    await sinErrores(page)

    // La prueba de fuego: volver al listado recargando de cero
    await page.goto('/dashboard/rutinas')
    await expect(page.getByText(nombre)).toBeVisible({ timeout: 15_000 })
  })

  test('el contenido de un bloque se guarda solo y sigue ahí tras recargar', async ({ page }) => {
    await irA(page, '/dashboard/rutinas')

    const nombre = nombreUnico('bloque')
    await page.getByRole('button', { name: /Nueva rutina/i }).click()
    await page.locator('input[placeholder*="Push Pull"]').fill(nombre)
    await page.getByRole('button', { name: /Crear y editar/i }).click()
    await page.waitForURL(/\/dashboard\/rutinas\/[0-9a-f-]{36}/, { timeout: 15_000 })
    const urlEditor = page.url()

    await page.getByRole('button', { name: /Agregar bloque/i }).click()

    const textoBloque = '4 SET 55-65%\n2 HANG POWER CLEAN\n1 PUSH JERK'
    await page.locator('input[placeholder^="Nombre del bloque"]').first().fill('LIFT')
    await page.locator('textarea').first().fill(textoBloque)

    // El guardado es automático con rebote; el indicador confirma que terminó
    await expect(page.getByText('Guardado')).toBeVisible({ timeout: 15_000 })
    await sinErrores(page)

    await page.goto(urlEditor)
    await expect(page.locator('input[placeholder^="Nombre del bloque"]').first())
      .toHaveValue('LIFT', { timeout: 15_000 })
    await expect(page.locator('textarea').first()).toHaveValue(textoBloque)
  })

  test('asignar una rutina y agendarla la deja en el calendario del atleta', async ({ page }) => {
    await irA(page, '/dashboard/rutinas')

    const nombre = nombreUnico('asignada')
    await page.getByRole('button', { name: /Nueva rutina/i }).click()
    await page.locator('input[placeholder*="Push Pull"]').fill(nombre)
    await page.getByRole('button', { name: /Crear y editar/i }).click()
    await page.waitForURL(/\/dashboard\/rutinas\/[0-9a-f-]{36}/, { timeout: 15_000 })
    const urlEditor = page.url()

    await page.getByRole('button', { name: /Asignar atletas/i }).click()
    await expect(page.getByText('O ATLETAS UNO POR UNO')).toBeVisible({ timeout: 15_000 })

    // Un atleta concreto, no un chip de equipo: el chip depende de qué equipos
    // tenga el coach y hacía la prueba dependiente de los datos del box.
    const filaAtleta = page.locator('button').filter({ hasText: /@/ }).first()
    await expect(filaAtleta).toBeVisible({ timeout: 10_000 })
    await filaAtleta.click()
    await expect(page.getByText(/^1 atleta · /)).toBeVisible({ timeout: 10_000 })

    // Un día futuro del mes en curso, para no chocar con fechas pasadas
    const diaFuturo = String(Math.min(28, new Date().getDate() + 2))
    await page.locator('button[style*="aspect-ratio"]')
      .filter({ hasText: new RegExp(`^${diaFuturo}$`) }).first().click()

    // El texto del botón prueba que ambas selecciones cuajaron
    const botonGuardar = page.getByRole('button', { name: /^Asignar a 1 y agendar 1 día$/ })
    await expect(botonGuardar).toBeVisible({ timeout: 10_000 })
    await botonGuardar.click()

    // Que desaparezca el panel completo, no solo un botón: si el guardado falla,
    // el botón cambia de texto y una aserción sobre él pasaría en falso.
    await expect(page.getByText('O ATLETAS UNO POR UNO')).toHaveCount(0, { timeout: 15_000 })
    await sinErrores(page)

    // Recargar: los días agendados se leen de training_sessions, no del estado local
    await page.goto(urlEditor)
    await page.getByRole('button', { name: /Asignar atletas/i }).click()
    await expect(page.getByText('Ya agendada:')).toBeVisible({ timeout: 15_000 })
  })

  test('Programación guarda el día y lo muestra tras recargar', async ({ page }) => {
    // Este es el caso que estuvo roto en silencio: upsertBoxSchedule omitía
    // tenant_id y cada guardado moría con violación de RLS sin avisar.
    await irA(page, '/dashboard/programacion')

    await page.getByRole('button', { name: '+ Asignar' }).first().click()
    await expect(page.getByText('PROGRAMAR ENTRENAMIENTO')).toBeVisible({ timeout: 10_000 })

    // Elegir el primer WOD disponible
    const selector = page.locator('select').first()
    // Las opciones llegan por consulta: contarlas de inmediato daba 1 y saltaba
    await expect
      .poll(() => selector.locator('option').count(), { timeout: 15_000 })
      .toBeGreaterThan(1)
    await selector.selectOption({ index: 1 })

    // Guardar el nombre elegido: es lo que debe aparecer en la grilla despues
    const nombreWod = (await selector.locator('option:checked').textContent())?.trim() ?? ''
    expect(nombreWod.length).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Programar' }).click()

    // Si falla, el modal se queda abierto: esperar a que cierre ES la aserción
    await expect(page.getByText('PROGRAMAR ENTRENAMIENTO')).toHaveCount(0, { timeout: 15_000 })
    await sinErrores(page)

    // La prueba de fuego: recargar de cero y buscar el WOD en la grilla.
    // Un día con contenido conserva su botón "+", así que contar botones no
    // servía como señal.
    await page.reload()
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(nombreWod).first()).toBeVisible({ timeout: 15_000 })
  })

  test('un fallo de guardado avisa en pantalla y no pasa desapercibido', async ({ page }) => {
    // Red de seguridad del MutationCache global. Se inyecta un 403 en las
    // escrituras para comprobar que el usuario se entera del fallo.
    await irA(page, '/dashboard/grupos')

    await page.route('**/rest/v1/**', async (route, request) => {
      if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method())) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'new row violates row-level security policy for table "groups"',
            code: '42501',
          }),
        })
        return
      }
      await route.continue()
    })

    page.on('dialog', d => d.accept())
    const basurero = page.locator('button[aria-label^="Eliminar grupo"]').first()
    // Las tarjetas llegan por consulta; sin esperar, el contador daba 0 y saltaba
    await expect(basurero).toBeVisible({ timeout: 15_000 })
    await basurero.click()

    // El mensaje debe estar traducido, no ser jerga cruda de Postgres
    const aviso = page.locator('[data-eb-toast]')
    await expect(aviso).toBeVisible({ timeout: 15_000 })
    await expect(aviso).toContainText(/no tienes permisos/i)
    await expect(aviso).not.toContainText(/row-level security/i)
  })
})
