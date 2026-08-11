'use client'

import { ExternalLink, Play } from 'lucide-react'

export interface BlockLink {
  label: string
  url: string
}

/** Acepta solo http(s). Evita javascript:, data:, etc. */
export function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeLinks(raw: unknown): BlockLink[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((l): l is BlockLink =>
      !!l && typeof l === 'object' &&
      typeof (l as BlockLink).url === 'string' &&
      isSafeUrl((l as BlockLink).url)
    )
    .map(l => ({ label: (l.label || '').trim() || hostOf(l.url), url: l.url }))
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

// La puntuacion final no forma parte de la URL: "mira https://x.com/v." -> corta el punto
const URL_RE = /(https?:\/\/[^\s<>"']+)/g
const TRAILING = /[.,;:!?)\]}]+$/

/**
 * Renderiza texto libre preservando saltos de linea y convirtiendo las URLs
 * en enlaces clicables. Construye nodos de React — nunca innerHTML — asi que
 * el texto del coach no puede inyectar markup.
 */
export function AutoLinkedText({ text, size = 14 }: { text: string; size?: number }) {
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  const re = new RegExp(URL_RE)

  while ((m = re.exec(text)) !== null) {
    let url = m[0]
    let start = m.index
    // Devuelve la puntuacion final al texto plano
    const trail = url.match(TRAILING)?.[0] ?? ''
    if (trail) url = url.slice(0, -trail.length)

    if (start > last) parts.push(text.slice(last, start))

    parts.push(
      isSafeUrl(url)
        ? <a
            key={`${start}-${url}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{
              color: '#6366F1', textDecoration: 'underline',
              textUnderlineOffset: 2, wordBreak: 'break-word',
            }}
          >
            {url}
          </a>
        : url
    )
    if (trail) parts.push(trail)
    last = start + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))

  return (
    <div style={{
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      fontSize: size,
      lineHeight: 1.65,
      color: 'var(--color-text)',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {parts}
    </div>
  )
}

/** Lista de referencias en video del bloque. */
export function BlockLinkList({ links }: { links: BlockLink[] }) {
  if (links.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
      {links.map((l, i) => (
        <a
          key={`${i}-${l.url}`}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12.5, fontWeight: 600, color: '#6366F1',
            background: 'rgba(99,102,241,0.09)',
            border: '1px solid rgba(99,102,241,0.22)',
            borderRadius: 20, padding: '5px 11px',
            textDecoration: 'none', maxWidth: '100%',
          }}
        >
          <Play size={11} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {l.label}
          </span>
          <ExternalLink size={10} style={{ flexShrink: 0, opacity: 0.6 }} />
        </a>
      ))}
    </div>
  )
}
