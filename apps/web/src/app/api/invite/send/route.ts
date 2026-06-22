import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Administrador',
  coach: 'Coach',
  athlete: 'Atleta',
}

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://entrebarras.cl'
    const inviteUrl = `${appUrl}/invite/${inv.token}`
    const inviterName = (() => {
      const i = inv.inviter as { first_name?: string; last_name?: string } | null
      return i ? `${i.first_name ?? ''} ${i.last_name ?? ''}`.trim() : 'Tu coach'
    })()
    const roleLabel = ROLE_LABELS[inv.role] ?? inv.role
    const expiresDate = new Date(inv.expires_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#E53E3E 0%,#B91C1C 100%);padding:32px 36px;">
      <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-weight:800;font-size:16px;">EB</span>
        </div>
        <span style="color:rgba(255,255,255,0.9);font-size:15px;font-weight:600;letter-spacing:-0.02em;">Entre Barras</span>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.04em;">Te han invitado</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${inviterName} te invita a unirte como <strong>${roleLabel}</strong></p>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px;">
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hola, recibes esta invitación para acceder a la plataforma de entrenamiento <strong>Entre Barras</strong>.
        Haz clic en el botón para crear tu cuenta y comenzar.
      </p>

      <a href="${inviteUrl}" style="display:block;background:#E53E3E;color:#fff;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;margin-bottom:24px;">
        Aceptar invitación →
      </a>

      <div style="background:#F8FAFC;border-radius:10px;padding:16px 18px;border:1px solid #E2E8F0;">
        <p style="margin:0;font-size:12.5px;color:#64748B;line-height:1.6;">
          Si el botón no funciona, copia este enlace en tu navegador:<br>
          <a href="${inviteUrl}" style="color:#E53E3E;word-break:break-all;">${inviteUrl}</a>
        </p>
      </div>

      <p style="margin:20px 0 0;font-size:12px;color:#94A3B8;text-align:center;">
        Esta invitación expira el ${expiresDate}
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 36px;border-top:1px solid #F1F5F9;text-align:center;">
      <p style="margin:0;font-size:12px;color:#CBD5E1;">Entre Barras · Plataforma de entrenamiento para CrossFit y gimnasios</p>
    </div>
  </div>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Entre Barras <invitaciones@entrebarras.cl>',
        to: inv.email,
        subject: `${inviterName} te invita a Entre Barras`,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[invite/send] Resend error:', res.status, body)
      return NextResponse.json({ sent: false, reason: `Resend error: ${res.status}` })
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[invite/send] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
