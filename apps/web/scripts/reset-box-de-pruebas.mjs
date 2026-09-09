/**
 * Deja el box de pruebas automatizadas como recién creado.
 *
 * Cada corrida de la suite crea rutinas, WODs, atletas y sesiones. Sin esto se
 * van acumulando: después de unas semanas el box tiene cientos de filas basura
 * y las pruebas empiezan a tardar y a fallar por razones que no tienen nada que
 * ver con el código.
 *
 *   npm run test:reset
 *
 * Solo toca el box "QA Automatizada". Antes de borrar nada comprueba que el
 * tenant se llame así: si alguien cambia el id por el del box real, el script
 * se detiene en vez de vaciarlo.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const aquí = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(aquí, '..', '.env.local')

const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/).filter(l => l.includes('=') && !l.trimStart().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en apps/web/.env.local')
  process.exit(1)
}

const TENANT = '766de4d4-17a9-49dc-8959-2630938f8625'
const NOMBRE_ESPERADO = 'QA Automatizada'

/** Las cuentas que forman el box y no se borran nunca. */
const CUENTAS_BASE = ['qa.coach@thryra.test', 'qa.atleta1@thryra.test', 'qa.atleta2@thryra.test']

const rest = (path, opts = {}) =>
  fetch(`${URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json',
      Prefer: 'return=representation', ...(opts.headers || {}),
    },
  }).then(async r => {
    const t = await r.text()
    if (!r.ok) throw new Error(`${path} ${r.status}: ${t}`)
    return t ? JSON.parse(t) : []
  })

async function main() {
  // ─── Salvaguarda ────────────────────────────────────────────────────────────
  const [box] = await rest(`tenants?id=eq.${TENANT}&select=id,name`)
  if (!box) {
    console.error(`No existe el tenant ${TENANT}. ¿Se borró el box de pruebas?`)
    process.exitCode = 1
    return
  }
  if (box.name !== NOMBRE_ESPERADO) {
    console.error(`ABORTADO: el tenant ${TENANT} se llama "${box.name}", no "${NOMBRE_ESPERADO}".`)
    console.error('Este script borra datos. No corre sobre un box que no sea el de pruebas.')
    process.exitCode = 1
    return
  }

  // ─── Limpieza ───────────────────────────────────────────────────────────────
  const rutinas = await rest(`routines?tenant_id=eq.${TENANT}&select=id`)
  const idsRutinas = rutinas.map(r => r.id)

  const borrar = async (tabla, filtro) => {
    const antes = await rest(`${tabla}?${filtro}&select=id`)
    if (antes.length === 0) return 0
    await rest(`${tabla}?${filtro}`, { method: 'DELETE' })
    return antes.length
  }

  const cuentas = await rest(`athletes?tenant_id=eq.${TENANT}&select=id,email`)
  const fichasBasura = cuentas.filter(a => !CUENTAS_BASE.includes((a.email || '').toLowerCase()))

  const resumen = {}
  if (idsRutinas.length) {
    const enRutinas = `routine_id=in.(${idsRutinas.join(',')})`
    const bloques = await rest(`routine_blocks?${enRutinas}&select=id`)
    if (bloques.length) {
      await rest(`routine_exercises?block_id=in.(${bloques.map(b => b.id).join(',')})`, { method: 'DELETE' })
    }
    resumen.athlete_routines = await borrar('athlete_routines', enRutinas)
    resumen.routine_blocks = bloques.length
    if (bloques.length) await rest(`routine_blocks?${enRutinas}`, { method: 'DELETE' })
  }

  resumen.training_sessions = await borrar('training_sessions', `tenant_id=eq.${TENANT}`)
  resumen.routines = await borrar('routines', `tenant_id=eq.${TENANT}`)
  resumen.wods = await borrar('wods', `tenant_id=eq.${TENANT}`)
  resumen.invitations = await borrar('invitations', `tenant_id=eq.${TENANT}`)
  resumen.personal_records = await borrar('personal_records', `tenant_id=eq.${TENANT}`)

  if (fichasBasura.length) {
    await rest(`athletes?id=in.(${fichasBasura.map(a => a.id).join(',')})`, { method: 'DELETE' })
    resumen.athletes = fichasBasura.length
  }

  // Los grupos creados por las pruebas: se conserva "Grupo QA".
  const grupos = await rest(`groups?tenant_id=eq.${TENANT}&select=id,name`)
  const gruposBasura = grupos.filter(g => g.name !== 'Grupo QA')
  if (gruposBasura.length) {
    await rest(`groups?id=in.(${gruposBasura.map(g => g.id).join(',')})`, { method: 'DELETE' })
    resumen.groups = gruposBasura.length
  }

  console.log(`Box "${box.name}" limpio. Filas borradas:`)
  for (const [tabla, n] of Object.entries(resumen)) {
    if (n) console.log(`  ${tabla}: ${n}`)
  }
  if (!Object.values(resumen).some(Boolean)) console.log('  (ya estaba limpio)')
}

await main()
