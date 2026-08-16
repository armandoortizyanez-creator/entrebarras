import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { correoDeInvitacion, type RolInvitado } from '@/lib/email/invitacion'
import { REMITENTE } from '@/lib/email/remitente'

export async function POST(req: NextRequest) {
  try {
    const { invitationId } = await req.json()
    if (!invitationId) return NextResponse.json({ error: 'invitationId requerido' }, { status: 400 })

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      // No key configured — skip silently (invitation was created in DB already)
      return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY no configurada' })
    }

    const supabase = await createServerClient()

    // Get invitation details
    const { data: inv, error } = await supabase
      .from('invitations')
      .select('*, inviter:invited_by(first_name, last_name)')
      .eq('id', invitationId)
      .single()

    if (error || !inv) return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    if (inv.accepted_at) return NextResponse.json({ sent: false, reason: 'Ya aceptada' })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thryra.com'
    const inviteUrl = `${appUrl}/invite/${inv.token}`
    const inviterName = (() => {
      const i = inv.inviter as { first_name?: string; last_name?: string } | null
      return i ? `${i.first_name ?? ''} ${i.last_name ?? ''}`.trim() : 'Tu coach'
    })()
    const expiresDate = new Date(inv.expires_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

    const { asunto, html, text } = correoDeInvitacion({
      rol: inv.role as RolInvitado,
      invitadoPor: inviterName || 'Tu coach',
      enlace: inviteUrl,
      expira: expiresDate,
    })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: inv.email,
        subject: asunto,
        html,
        text,
      }),
    })

    if (!res.ok) {
      const resBody = await res.text()
      console.error('[invite/send] Resend error:', res.status, resBody)
      return NextResponse.json({ sent: false, reason: `Resend error: ${res.status}` })
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[invite/send] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
