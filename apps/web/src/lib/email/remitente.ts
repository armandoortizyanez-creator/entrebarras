/**
 * Dirección desde la que sale TODO correo de THRYRA.
 *
 * Da igual qué coach, admin o box dispare el envío: el remitente es siempre el
 * mismo. Quien recibe ve una sola identidad, y los proveedores construyen la
 * reputación de envío sobre una única dirección en vez de repartirla entre
 * muchas, que es lo que termina mandando los correos a spam.
 *
 * Hoy queda en el remitente de pruebas de Resend, que SOLO entrega a la
 * dirección dueña de la cuenta; a cualquier otro destinatario responde 403 y
 * el correo no sale. Para que llegue a los atletas hay que verificar el
 * dominio en resend.com/domains y definir EMAIL_FROM, por ejemplo:
 *
 *   EMAIL_FROM="THRYRA <invitaciones@send.thryra.com>"
 *
 * Conviene un subdominio y no el dominio raíz: si algún envío masivo se marca
 * como spam, la reputación del correo del dominio principal no se ve afectada.
 */
export const REMITENTE = process.env.EMAIL_FROM ?? 'THRYRA <onboarding@resend.dev>'

/** true cuando seguimos en el remitente de pruebas y el envío está limitado. */
export const REMITENTE_ES_DE_PRUEBA = !process.env.EMAIL_FROM
