#!/usr/bin/env tsx
/**
 * Seed script: crea/recrea usuarios de prueba para desarrollo.
 * Uso: npx tsx scripts/seed-test-users.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://pufsluiwqymewzaysjid.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  console.error('❌  Falta SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const TENANT_ID = '6c52fb1c-a100-465f-b4e7-66f31f76751c'
const PASSWORD  = 'EB_Test2026!'

const TEST_USERS = [
  {
    email:        'plataforma@entrebarras.cl',
    app_metadata: { role: 'platform_admin' },
    user_metadata: { first_name: 'Admin', last_name: 'Plataforma' },
  },
  {
    email:        'coach@entrebarras.cl',
    app_metadata: { role: 'coach', tenant_id: TENANT_ID },
    user_metadata: { first_name: 'Coach', last_name: 'Test' },
  },
  {
    email:        'atleta@entrebarras.cl',
    app_metadata: { role: 'athlete', tenant_id: TENANT_ID },
    user_metadata: { first_name: 'Atleta', last_name: 'Test' },
  },
]

async function adminRequest(path: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey':        SERVICE_KEY!,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function listUsers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY! },
  })
  const data = await res.json() as { users: { id: string; email: string }[] }
  return data.users ?? []
}

async function deleteUser(id: string) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method:  'DELETE',
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY! },
  })
}

async function main() {
  console.log('🌱  Seeding test users...\n')

  const existing = await listUsers()

  for (const u of TEST_USERS) {
    const found = existing.find(e => e.email === u.email)
    if (found) {
      process.stdout.write(`  🗑  Eliminando ${u.email}... `)
      await deleteUser(found.id)
      console.log('ok')
    }

    process.stdout.write(`  ✚  Creando ${u.email}... `)
    const result = await adminRequest('/admin/users', {
      email:         u.email,
      password:      PASSWORD,
      email_confirm: true,
      app_metadata:  u.app_metadata,
      user_metadata: u.user_metadata,
    }) as { id?: string; message?: string }

    if (result.id) {
      console.log(`ok (${result.id.slice(0, 8)}...)`)
    } else {
      console.log(`❌  ${JSON.stringify(result)}`)
    }
  }

  console.log(`\n✅  Listo. Contraseña para todos: ${PASSWORD}`)
  console.log('\nUsuarios:')
  for (const u of TEST_USERS) {
    console.log(`  ${u.email}  →  role: ${u.app_metadata.role}`)
  }
}

main().catch(console.error)
