import { renderLayout, parrafo, boton, caja, nota, escapar, COLORES } from './layout'

export type RolInvitado = 'super_admin' | 'coach' | 'athlete'

/**
 * El correo es el mismo para todos; cambia lo que la persona va a hacer al
 * entrar. A un atleta le importa recibir su rutina, a un coach armar equipos y
 * a un administrador gestionar el box. Un texto genérico para los tres no le
 * dice nada a ninguno.
 */
const VARIANTES: Record<RolInvitado, {
  etiqueta: string
  asunto: (quien: string) => string
  titulo: string
  intro: string
  puntos: string[]
  textoBoton: string
}> = {
  athlete: {
    etiqueta: 'Atleta',
    asunto: quien => `${quien} te invita a entrenar en THRYRA`,
    titulo: 'Tu coach te está esperando',
    intro: 'Vas a tener tu entrenamiento en un solo lugar, siempre a mano.',
    puntos: [
      'Recibe tus rutinas del día, bloque por bloque',
      'Registra tus resultados y tus marcas personales',
      'Sigue tu progreso en el tiempo',
    ],
    textoBoton: 'Crear mi cuenta',
  },
  coach: {
    etiqueta: 'Coach',
    asunto: quien => `${quien} te invita a THRYRA como coach`,
    titulo: 'Te sumaron como coach',
    intro: 'Vas a poder llevar a tus atletas desde la plataforma.',
    puntos: [
      'Crea rutinas y WODs, y asígnalos por día',
      'Organiza a tus atletas en equipos',
      'Revisa resultados y deja comentarios',
    ],
    textoBoton: 'Activar mi cuenta',
  },
  super_admin: {
    etiqueta: 'Administrador',
    asunto: quien => `${quien} te invita a administrar THRYRA`,
    titulo: 'Te dieron acceso de administrador',
    intro: 'Vas a tener el control completo del box.',
    puntos: [
      'Gestiona coaches, atletas y equipos',
      'Invita y da de baja usuarios',
      'Revisa toda la programación del box',
    ],
    textoBoton: 'Activar mi cuenta',
  },
}

interface DatosInvitacion {
  rol: RolInvitado
  invitadoPor: string
  enlace: string
  expira: string
}

export function correoDeInvitacion({ rol, invitadoPor, enlace, expira }: DatosInvitacion) {
  const v = VARIANTES[rol] ?? VARIANTES.athlete

  const listaPuntos = v.puntos
    .map(punto => `
      <tr>
        <td valign="top" width="18" style="padding:0 10px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:24px; color:${COLORES.lima};">&bull;</td>
        <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14.5px; line-height:24px; color:${COLORES.textoSuave};">${escapar(punto)}</td>
      </tr>`)
    .join('')

  const contenido = [
    parrafo(`Hola, <strong style="color:${COLORES.texto};">${escapar(invitadoPor)}</strong> te invitó a THRYRA. ${escapar(v.intro)}`),
    `<tr><td class="relleno" style="padding:18px 36px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${listaPuntos}</table>
    </td></tr>`,
    boton(v.textoBoton, enlace),
    caja(`Si el botón no funciona, copia este enlace en tu navegador:<br /><a href="${enlace}" style="color:#818CF8; word-break:break-all;">${escapar(enlace)}</a>`),
    nota(`Esta invitación expira el ${expira}`),
  ].join('')

  const html = renderLayout({
    preheader: `${invitadoPor} te invita a unirte como ${v.etiqueta.toLowerCase()}. La invitación expira el ${expira}.`,
    titulo: v.titulo,
    bajada: `${escapar(invitadoPor)} te invita a unirte como <strong style="color:#ffffff;">${v.etiqueta}</strong>`,
    contenido,
  })

  // Versión en texto plano: mejora la entrega y es lo que muestran los relojes
  // y algunos clientes corporativos que bloquean el HTML por completo.
  const text = [
    v.titulo.toUpperCase(),
    '',
    `${invitadoPor} te invitó a THRYRA como ${v.etiqueta.toLowerCase()}.`,
    v.intro,
    '',
    ...v.puntos.map(p => `- ${p}`),
    '',
    `${v.textoBoton}: ${enlace}`,
    '',
    `Esta invitación expira el ${expira}.`,
    '',
    'THRYRA - Plataforma de entrenamiento',
  ].join('\n')

  return { asunto: v.asunto(invitadoPor), html, text }
}
