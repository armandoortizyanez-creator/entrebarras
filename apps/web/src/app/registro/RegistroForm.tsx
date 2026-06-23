'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RegistroForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    org_name: '',
    email: '',
    password: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
          org_name: form.org_name,
        },
      },
    })

    if (error) {
      setError(typeof error.message === 'string' && error.message ? error.message : JSON.stringify(error))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Nombre" id="first_name" value={form.first_name} onChange={v => update('first_name', v)} placeholder="Juan" required />
        <Field label="Apellido" id="last_name" value={form.last_name} onChange={v => update('last_name', v)} placeholder="Pérez" required />
      </div>

      <Field
        label="Nombre de tu organización"
        id="org_name"
        value={form.org_name}
        onChange={v => update('org_name', v)}
        placeholder="Box CrossFit Norte, Juan Pérez Trainer..."
        required
      />

      <Field
        label="Email"
        id="email"
        type="email"
        value={form.email}
        onChange={v => update('email', v)}
        placeholder="coach@ejemplo.com"
        required
      />

      <Field
        label="Contraseña"
        id="password"
        type="password"
        value={form.password}
        onChange={v => update('password', v)}
        placeholder="Mínimo 8 caracteres"
        required
      />

      {error && (
        <p role="alert" style={{
          fontSize: 13, color: 'var(--color-error)',
          background: 'var(--color-error-bg)', padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
        }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '11px',
          background: loading ? 'var(--color-border)' : '#C6FF00',
          color: loading ? 'var(--color-text-3)' : '#0D1117',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 14, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 4,
        }}
      >
        {loading ? 'Creando tu espacio...' : 'Comenzar 30 días gratis'}
      </button>

      <p style={{ fontSize: 12, color: 'var(--color-text-4)', textAlign: 'center' }}>
        Al registrarte aceptas los Términos de Servicio y la Política de Privacidad.
      </p>
    </form>
  )
}

function Field({
  label, id, value, onChange, placeholder, type = 'text', required = false,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} style={{
        display: 'block', fontSize: 13, fontWeight: 500,
        color: 'var(--color-text-2)', marginBottom: 5,
      }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: '9px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 14, color: 'var(--color-text)',
          background: 'var(--color-surface)', outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
