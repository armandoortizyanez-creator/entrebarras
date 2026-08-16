/**
 * Plantilla base de los correos de THRYRA.
 *
 * El HTML de correo no es HTML web. Spark, Outlook de escritorio, Yahoo y
 * varios clientes de Android pasan el mensaje por su propio saneador y
 * descartan lo que no entienden, sin avisar. Por eso aquí no hay flex, ni
 * grid, ni hojas de estilo externas, ni clases: solo tablas anidadas y
 * estilos en línea, que es lo único que sobrevive en todos lados.
 *
 * Reglas que sostienen esta plantilla:
 *
 * - El layout va en <table>. Outlook usa el motor de Word para maquetar y no
 *   implementa `display:flex`; con divs el diseño se apila en una columna.
 * - Los degradados van en `background-image` con un `bgcolor` sólido al lado.
 *   Outlook ignora el primero y se queda con el segundo, así que nunca queda
 *   texto claro sobre fondo blanco.
 * - Los botones son una celda con `bgcolor` y un <a> con relleno dentro. Un
 *   <a> suelto con `display:block` pierde el relleno en Outlook y queda como
 *   un enlace de texto.
 * - Se declara `color-scheme` para que Apple Mail y Outlook no inviertan los
 *   colores por su cuenta: el diseño ya es oscuro y la inversión lo rompe.
 * - Todo mensaje lleva versión en texto plano. Suma para no caer en spam y es
 *   lo que leen los relojes y algunos clientes corporativos.
 */

/** Dominio desde donde se sirven las imágenes. Un correo necesita URL absoluta. */
const ASSETS = process.env.EMAIL_ASSETS_URL ?? 'https://www.thryra.com'

/** El logo claro sobre transparente: solo funciona sobre fondo oscuro. */
export const LOGO_URL = `${ASSETS}/logos/logo-dark-v3.png`

export const COLORES = {
  fondo: '#0D1117',
  tarjeta: '#13181F',
  borde: '#252D3A',
  texto: '#EDF0F7',
  textoSuave: '#8A93A8',
  textoTenue: '#526075',
  moradoSolido: '#4F52D4',
  moradoClaro: '#6366F1',
  lima: '#C6FF00',
} as const

interface OpcionesLayout {
  /** Línea de vista previa que muestra la bandeja antes de abrir el correo. */
  preheader: string
  /** Título grande dentro de la cabecera morada. */
  titulo: string
  /** Bajada bajo el título. Admite <strong>. */
  bajada: string
  /** Cuerpo ya renderizado como filas de tabla. */
  contenido: string
}

export function renderLayout({ preheader, titulo, bajada, contenido }: OpcionesLayout): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>THRYRA</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style type="text/css">
  /* Solo ajustes que se pueden perder sin romper nada: lo esencial va en línea. */
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
  a { text-decoration:none; }
  /* Evita que iOS y Windows conviertan fechas y direcciones en enlaces azules. */
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important; }
  u + #cuerpo a { color:inherit; text-decoration:none; }
  @media only screen and (max-width:600px) {
    .contenedor { width:100% !important; }
    .relleno { padding-left:24px !important; padding-right:24px !important; }
    .titulo { font-size:21px !important; }
    .boton a { display:block !important; }
  }
</style>
</head>
<body id="cuerpo" style="margin:0; padding:0; width:100%; background-color:${COLORES.fondo}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

<!-- Vista previa de la bandeja. Los espacios evitan que se cuele el texto siguiente. -->
<div style="display:none; font-size:1px; color:${COLORES.fondo}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
  ${escapar(preheader)}${'&#847;&zwnj;&nbsp;'.repeat(60)}
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORES.fondo};">
  <tr>
    <td align="center" style="padding:32px 12px;">

      <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"><tr><td><![endif]-->
      <table role="presentation" class="contenedor" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px; max-width:600px; background-color:${COLORES.tarjeta}; border:1px solid ${COLORES.borde}; border-radius:16px; overflow:hidden;">

        <!-- Cabecera. bgcolor sostiene el color donde el degradado no existe. -->
        <tr>
          <td bgcolor="${COLORES.moradoSolido}" class="relleno" style="background-color:${COLORES.moradoSolido}; background-image:linear-gradient(135deg, ${COLORES.moradoClaro} 0%, ${COLORES.moradoSolido} 100%); padding:32px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="left" style="padding-bottom:22px;">
                  <img src="${LOGO_URL}" width="168" height="59" alt="THRYRA" style="display:block; width:168px; height:auto; max-width:168px;" />
                </td>
              </tr>
              <tr>
                <td align="left" class="titulo" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:23px; line-height:30px; font-weight:bold; color:#ffffff; letter-spacing:-0.5px;">
                  ${escapar(titulo)}
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-top:7px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:21px; color:#E4E4F6;">
                  ${bajada}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${contenido}

        <tr>
          <td class="relleno" style="padding:20px 36px 24px; border-top:1px solid #1A2030;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#3D4A5E;">
                  THRYRA &middot; Plataforma de entrenamiento<br />Train. Evolve. Thrive.
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!--[if mso]></td></tr></table><![endif]-->

    </td>
  </tr>
</table>
</body>
</html>`
}

/** Fila de párrafo del cuerpo. */
export function parrafo(html: string, opciones: { arriba?: number } = {}): string {
  return `<tr><td class="relleno" style="padding:${opciones.arriba ?? 30}px 36px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:24px; color:${COLORES.textoSuave};">${html}</td></tr>`
}

/**
 * Botón a prueba de clientes: el color vive en la celda, no en el enlace, y el
 * relleno va dentro del <a> para que toda el área sea pulsable.
 */
export function boton(texto: string, url: string): string {
  return `<tr>
    <td class="relleno" style="padding:26px 36px 0;">
      <table role="presentation" class="boton" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" bgcolor="${COLORES.lima}" style="background-color:${COLORES.lima}; border-radius:10px;">
            <a href="${url}" style="display:inline-block; padding:15px 30px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; font-weight:bold; color:${COLORES.fondo}; text-decoration:none; border-radius:10px;">${escapar(texto)}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

/** Caja tenue para el enlace de respaldo y avisos secundarios. */
export function caja(html: string): string {
  return `<tr>
    <td class="relleno" style="padding:24px 36px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORES.fondo}; border:1px solid ${COLORES.borde}; border-radius:10px;">
        <tr>
          <td style="padding:16px 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12.5px; line-height:20px; color:${COLORES.textoTenue};">${html}</td>
        </tr>
      </table>
    </td>
  </tr>`
}

/** Nota final centrada, antes del pie. */
export function nota(texto: string): string {
  return `<tr><td class="relleno" style="padding:20px 36px 30px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:${COLORES.textoTenue}; text-align:center;">${escapar(texto)}</td></tr>`
}

/**
 * Escapa lo que viene de la base. Un nombre con `<` rompería la maqueta, y el
 * correo se arma concatenando texto.
 */
export function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
