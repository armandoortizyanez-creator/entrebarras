'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS } from '@entrebarras/types'

interface InvitationInfo {
  id: string
  email: string
  role: string
  expires_at: string
  accepted_at: string | null
  tenant_name: string
  inviter_name: string
}

type PageState = 'loading' | 'ready' | 'expired' | 'accepted' | 'success' | 'error'

const ROLE_COLOR: Record<string, string> = {
  super_admin: '#4caf50',
  coach:       '#e91e8c',
  athlete:     '#2196f3',
}

export function InviteView({ token }: { token: string }) {
  const router = useRouter()
  const [state, setState]       = useState<PageState>('loading')
  const [inv, setInv]           = useState<InvitationInfo | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_invitation_by_token', { p_token: token })

      if (error || !data || data.length === 0) {
        setState('error')
        return
      }

      const info = data[0] as InvitationInfo

      if (info.accepted_at) {
        setState('accepted')
        return
      }
      if (new Date(info.expires_at) < new Date()) {
        setState('expired')
        return
      }

      setInv(info)
      setState('ready')
    }

    load()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inv) return
    if (password.length < 8) { setFormError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirm) { setFormError('Las contraseñas no coinciden'); return }
    if (!firstName.trim())   { setFormError('El nombre es requerido'); return }

    setFormError('')
    setSubmitting(true)

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email: inv.email,
      password,
      options: {
        data: { first_name: firstName.trim(), last_name: lastName.trim() },
      },
    })

    if (signUpError) {
      setFormError(signUpError.message)
      setSubmitting(false)
      return
    }

    // Sign in immediately (trigger auto-confirms email)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: inv.email,
      password,
    })

    if (signInError) {
      // Account created but login failed — redirect to login
      setState('success')
      setSubmitting(false)
      return
    }

    setState('success')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const s = {
    page:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 24 },
    card:    { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 440, padding: '36px 40px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
    logo:    { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
    logoBg:  { width: 36, height: 36, borderRadius: 8, background: 'var(--color-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff' },
    title:   { fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6, letterSpacing: '-0.02em' },
    sub:     { fontSize: 14, color: 'var(--color-text-3)', marginBottom: 28, lineHeight: 1.5 },
    badge:   (role: string) => ({
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 700,
      background: `${ROLE_COLOR[role] ?? '#888'}22`,
      color: ROLE_COLOR[role] ?? '#888',
      marginLeft: 6,
    }),
    label:   { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 },
    input:   { width: '100%', height: 42, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' as const, marginBottom: 14 },
    btn:     { width: '100%', height: 44, background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
    err:     { fontSize: 13, color: '#e53935', background: '#e5393511', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 14 },
    center:  { textAlign: 'center' as const },
    icon:    { fontSize: 44, marginBottom: 16 },
    msg:     { fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 },
    msgsub:  { fontSize: 14, color: 'var(--color-text-3)', lineHeight: 1.5 },
  }

  const Logo = () => (
    <div style={s.logo}>
      <div style={s.logoBg}>EB</div>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Entre Barras</span>
    </div>
  )

  if (state === 'loading') {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, ...s.center }}>
          <Logo />
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Verificando invitación...</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, ...s.center }}>
          <Logo />
          <div style={s.icon}>🔗</div>
          <p style={s.msg}>Invitación no encontrada</p>
          <p style={s.msgsub}>Este enlace no existe o ya no es válido.</p>
        </div>
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, ...s.center }}>
          <Logo />
          <div style={s.icon}>⏰</div>
          <p style={s.msg}>Invitación expirada</p>
          <p style={s.msgsub}>Este enlace expiró. Pide al administrador que envíe una nueva invitación.</p>
        </div>
      </div>
    )
  }

  if (state === 'accepted') {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, ...s.center }}>
          <Logo />
          <div style={s.icon}>✅</div>
          <p style={s.msg}>Invitación ya aceptada</p>
          <p style={s.msgsub}>Esta invitación ya fue usada. Si ya tienes cuenta, <a href="/login" style={{ color: 'var(--color-red)' }}>inicia sesión aquí</a>.</p>
        </div>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, ...s.center }}>
          <Logo />
          <div style={s.icon}>🎉</div>
          <p style={s.msg}>¡Bienvenido a Entre Barras!</p>
          <p style={s.msgsub}>Tu cuenta fue creada. Redirigiendo al dashboard...</p>
        </div>
      </div>
    )
  }

  // state === 'ready'
  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo />

        <h1 style={s.title}>Crea tu cuenta</h1>
        <p style={s.sub}>
          <strong>{inv?.inviter_name}</strong> te invitó a <strong>{inv?.tenant_name}</strong> como
          <span style={s.badge(inv?.role ?? '')}>
            {ROLE_LABELS[inv?.role as keyof typeof ROLE_LABELS] ?? inv?.role}
          </span>
        </p>

        <div style={{ background: 'var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--color-text-2)' }}>
          📧 {inv?.email}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={s.label}>Nombre <span style={{ color: 'var(--color-red)' }}>*</span></label>
              <input style={s.input} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nombre" required />
            </div>
            <div>
              <label style={s.label}>Apellido</label>
              <input style={s.input} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apellido" />
            </div>
          </div>

          <label style={s.label}>Contraseña <span style={{ color: 'var(--color-red)' }}>*</span></label>
          <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />

          <label style={s.label}>Confirmar contraseña <span style={{ color: 'var(--color-red)' }}>*</span></label>
          <input style={s.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite la contraseña" required />

          {formError && <div style={s.err}>{formError}</div>}

          <button type="submit" style={{ ...s.btn, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }} disabled={submitting}>
            {submitting ? 'Creando cuenta...' : 'Crear cuenta →'}
          </button>
        </form>
      </div>
    </div>
  )
}
