'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : error.message
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6 }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="coach@ejemplo.com"
          style={{
            width: '100%', padding: '9px 12px',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)',
            outline: 'none',
          }}
        />
      </div>

      <div>
        <label htmlFor="password" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6 }}>
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          style={{
            width: '100%', padding: '9px 12px',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)',
            outline: 'none',
          }}
        />
      </div>

      {error && (
        <p role="alert" style={{ fontSize: 13, color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '10px',
          background: loading ? 'var(--color-border)' : 'var(--color-red)',
          color: loading ? 'var(--color-text-3)' : '#fff',
          border: 'none', borderRadius: 'var(--radius-md)',
          fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {loading ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
