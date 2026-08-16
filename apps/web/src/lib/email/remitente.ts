/**
 * Dirección desde la que sale TODO correo de THRYRA.
 *
 * Da igual qué coach, admin o box dispare el envío: el remitente es siempre el
 * mismo. Quien recibe ve una sola identidad, y los proveedores construyen la
 * reputación de envío sobre una única dirección en vez de repartirla entre
 * muchas, que es lo que termina mandando los correos a spam.
 *
 * PROVISIONAL: sale desde compraia.cl, que es el único dominio verificado en
 * la cuenta de Resend. No es lo ideal —el atleta ve una dirección que no dice
 * thryra.com— pero es lo que permite el plan actual, y entrega a cualquier
 * destinatario.
 *
 * Antes apuntaba a `onboarding@resend.dev`, el remitente compartido de
 * pruebas de Resend. Ese SOLO entrega a la dirección dueña de la cuenta; a
 * cualquier otro destinatario responde 403 y el correo nunca sale. Es una
 * barrera antiabuso del proveedor, no algo que se pueda sortear desde acá:
 * resend.dev es un dominio suyo y lo comparten entre todas las cuentas sin
 * dominio propio verificado.
 *
 * Ojo: un subdominio como thryra.compraia.cl NO hereda la verificación. En
 * Resend cada subdominio es una entrada aparte con sus propios registros DKIM
 * y ocupa un cupo de dominio. Una dirección distinta dentro del dominio ya
 * verificado, en cambio, no cuesta nada.
 *
 * Cuando thryra.com esté verificado, basta definir EMAIL_FROM y esto queda
 * obsoleto sin tocar código:
 *
 *   EMAIL_FROM="THRYRA <invitaciones@send.thryra.com>"
 *
 * Conviene un subdominio y no el dominio raíz: si algún envío masivo se marca
 * como spam, la reputación del correo del dominio principal no se ve afectada.
 */
export const REMITENTE = process.env.EMAIL_FROM ?? 'THRYRA <thryra@compraia.cl>'

/** true mientras sigamos saliendo desde un dominio que no es el de THRYRA. */
export const REMITENTE_ES_PROVISIONAL = !process.env.EMAIL_FROM
