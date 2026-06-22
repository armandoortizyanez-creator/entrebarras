/**
 * Importa ejercicios desde free-exercise-db a Supabase.
 * Uso: node scripts/seed-exercises.mjs
 */

const SUPABASE_URL = 'https://pufsluiwqymewzaysjid.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('Falta SUPABASE_SERVICE_KEY. Ejecútalo así:')
  console.error('  $env:SUPABASE_SERVICE_KEY="tu-service-key" ; node scripts/seed-exercises.mjs')
  process.exit(1)
}

const EXERCISES_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const GIF_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

// Mapeo de nombres de músculos al español
const MUSCLE_ES = {
  'abdominals': 'abdominales',
  'abductors': 'abductores',
  'adductors': 'aductores',
  'biceps': 'bíceps',
  'calves': 'pantorrillas',
  'chest': 'pecho',
  'forearms': 'antebrazos',
  'glutes': 'glúteos',
  'hamstrings': 'isquiotibiales',
  'hip flexors': 'flexores de cadera',
  'it band': 'banda IT',
  'lats': 'dorsales',
  'lower back': 'espalda baja',
  'middle back': 'espalda media',
  'neck': 'cuello',
  'quadriceps': 'cuádriceps',
  'shoulders': 'hombros',
  'traps': 'trapecios',
  'triceps': 'tríceps',
  'upper back': 'espalda alta',
}

const EQUIPMENT_ES = {
  'barbell': 'barra',
  'body only': 'peso corporal',
  'cable': 'cable',
  'dumbbell': 'mancuernas',
  'e-z curl bar': 'barra curl EZ',
  'exercise ball': 'pelota de ejercicio',
  'foam roll': 'foam roller',
  'kettlebells': 'kettlebells',
  'machine': 'máquina',
  'medicine ball': 'balón medicinal',
  'other': 'otro',
  'bands': 'bandas elásticas',
}

function mapExercise(ex) {
  // Los GIFs están en /exercises/<name>/<index>.gif (carpeta con nombre del ejercicio)
  const folderName = ex.id || ex.name
  const gifUrl = `${GIF_BASE_URL}/${folderName}/0.gif`

  const primaryMuscle = ex.primaryMuscles?.[0] ?? null
  const secondaryMuscles = ex.secondaryMuscles ?? []

  return {
    source: 'exercisedb',
    external_id: ex.id ?? ex.name.toLowerCase().replace(/\s+/g, '-'),
    name: ex.name,
    description: Array.isArray(ex.instructions)
      ? ex.instructions.join(' ')
      : (ex.instructions ?? null),
    instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
    muscle_group: primaryMuscle ? (MUSCLE_ES[primaryMuscle] ?? primaryMuscle) : null,
    secondary_muscles: secondaryMuscles.map(m => MUSCLE_ES[m] ?? m),
    equipment: ex.equipment ? (EQUIPMENT_ES[ex.equipment] ?? ex.equipment) : null,
    category: ex.category ?? null,
    gif_url: gifUrl,
    is_public: true,
    tenant_id: null,
    created_by: null,
  }
}

async function supabaseInsert(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/exercises`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(rows),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase error ${res.status}: ${err}`)
  }
}

async function main() {
  console.log('Descargando ejercicios desde free-exercise-db...')
  const res = await fetch(EXERCISES_URL)
  if (!res.ok) throw new Error(`No se pudo descargar: ${res.status}`)
  const exercises = await res.json()
  console.log(`Total ejercicios: ${exercises.length}`)

  const mapped = exercises.map(mapExercise)

  // Insertar en lotes de 100
  const BATCH = 100
  let inserted = 0

  for (let i = 0; i < mapped.length; i += BATCH) {
    const batch = mapped.slice(i, i + BATCH)
    await supabaseInsert(batch)
    inserted += batch.length
    process.stdout.write(`\rInsertados: ${inserted}/${mapped.length}`)
  }

  console.log(`\n✓ Importación completa. ${inserted} ejercicios cargados.`)
}

main().catch(err => {
  console.error('\nError:', err.message)
  process.exit(1)
})
