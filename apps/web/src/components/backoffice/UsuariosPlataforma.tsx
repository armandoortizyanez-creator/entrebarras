'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUsuariosPlataforma, desactivarUsuario, reactivarUsuario, eliminarAcceso,
  type UsuarioPlataforma,
} from '@/lib/queries/platform-users'
import { mensajeDeError } from '@/lib/errors'
import { Search, Building2, UsersRound, ShieldAlert, UserCheck, UserX, Trash2, X, AlertTriangle } from 'lucide-react'

const ROL_ETIQUETA: Record<string, string> = {
  platform_admin: 'Plataforma',
  super_admin: 'Administrador',
  coach: 'Coach',
  athlete: 'Atleta',
}
const ROL_COLOR: Record<string, string> = {
  platform_admin: '#818CF8',
  super_admin: '#22C55E',
  coach: '#C6FF00',
  athlete: '#38BDF8',
}

/** "hace 3 días" comunica mejor que una fecha cuando se revisa actividad. */
function haceCuanto(iso: string | null): { texto: string; dias: number | null } {
  if (!iso) return { texto: 'Nunca entró', dias: null }
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias === 0) return { texto: 'Hoy', dias }
  if (dias === 1) return { texto: 'Ayer', dias }
  if (dias < 30) return { texto: `Hace ${dias} días`, dias }
  const meses = Math.floor(dias / 30)
  return { texto: `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`, dias }
}

export function UsuariosPlataforma() {
  const qc = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('todos')
  const [aEliminar, setAEliminar] = useState<UsuarioPlataforma | null>(null)

  const { data: usuarios = [], isLoading, error } = useQuery({
    queryKey: ['platform-usuarios'],
    queryFn: getUsuariosPlataforma,
  })

  const refrescar = () => qc.invalidateQueries({ queryKey: ['platform-usuarios'] })

  const desactivar = useMutation({ mutationFn: desactivarUsuario, onSuccess: refrescar })
  const reactivar  = useMutation({ mutationFn: reactivarUsuario,  onSuccess: refrescar })

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return usuarios.filter(u => {
      const coincideRol = filtroRol === 'todos' || u.rol === filtroRol
      const coincideTexto = q === '' ||
        u.email.toLowerCase().includes(q) ||
        (u.nombre ?? '').toLowerCase().includes(q) ||
        (u.gym ?? '').toLowerCase().includes(q)
      return coincideRol && coincideTexto
    })
  }, [usuarios, busqueda, filtroRol])

  const conteos = useMemo(() => ({
    total: usuarios.length,
    inactivos: usuarios.filter(u => !u.activo).length,
    sinPerfil: usuarios.filter(u => u.sin_perfil).length,
    dormidos: usuarios.filter(u => {
      const d = haceCuanto(u.ultimo_acceso).dias
      return d === null || d > 30
    }).length,
  }), [usuarios])

  if (error) {
    return (
      <div style={{
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 14, padding: '20px 22px', display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <ShieldAlert size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
            No se pudo cargar el listado
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-2)', lineHeight: 1.55 }}>
            {mensajeDeError(error)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
        <Metrica valor={conteos.total}     etiqueta="Usuarios en total" />
        <Metrica valor={conteos.dormidos}  etiqueta="Sin entrar en 30 días" alerta={conteos.dormidos > 0} />
        <Metrica valor={conteos.inactivos} etiqueta="Desactivados" />
        <Metrica valor={conteos.sinPerfil} etiqueta="Sin perfil" alerta={conteos.sinPerfil > 0} />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o gimnasio..."
            style={{
              width: '100%', padding: '9px 11px 9px 34px', boxSizing: 'border-box',
              border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 13.5,
              color: 'var(--color-text)', background: 'var(--color-bg)', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg)', borderRadius: 10, padding: 3 }}>
          {['todos', 'platform_admin', 'super_admin', 'coach', 'athlete'].map(r => (
            <button
              key={r}
              onClick={() => setFiltroRol(r)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12.5, fontWeight: filtroRol === r ? 700 : 500, whiteSpace: 'nowrap',
                background: filtroRol === r ? '#6366F1' : 'transparent',
                color: filtroRol === r ? '#fff' : 'var(--color-text-2)',
              }}
            >
              {r === 'todos' ? 'Todos' : ROL_ETIQUETA[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Listado */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {isLoading ? (
          <p style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
            Cargando usuarios...
          </p>
        ) : filtrados.length === 0 ? (
          <p style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
            Ningún usuario coincide con la búsqueda.
          </p>
        ) : (
          filtrados.map((u, i) => (
            <FilaUsuario
              key={u.auth_user_id}
              u={u}
              ultima={i === filtrados.length - 1}
              onDesactivar={() => u.user_id && desactivar.mutate(u.user_id)}
              onReactivar={() => u.user_id && reactivar.mutate(u.user_id)}
              onEliminar={() => setAEliminar(u)}
              ocupado={desactivar.isPending || reactivar.isPending}
            />
          ))
        )}
      </div>

      {aEliminar && (
        <ConfirmarEliminacion
          usuario={aEliminar}
          onClose={() => setAEliminar(null)}
          onEliminado={() => { setAEliminar(null); refrescar() }}
        />
      )}
    </div>
  )
}

function Metrica({ valor, etiqueta, alerta }: { valor: number; etiqueta: string; alerta?: boolean }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{
        fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em',
        color: alerta && valor > 0 ? '#F59E0B' : 'var(--color-text)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {valor}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>{etiqueta}</div>
    </div>
  )
}

function FilaUsuario({ u, ultima, onDesactivar, onReactivar, onEliminar, ocupado }: {
  u: UsuarioPlataforma
  ultima: boolean
  onDesactivar: () => void
  onReactivar: () => void
  onEliminar: () => void
  ocupado: boolean
}) {
  const acceso = haceCuanto(u.ultimo_acceso)
  const rolColor = u.rol ? ROL_COLOR[u.rol] ?? 'var(--color-text-3)' : 'var(--color-text-3)'
  const revocado = !!u.acceso_revocado
  const iniciales = (u.nombre ?? u.email).slice(0, 2).toUpperCase()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
      borderBottom: ultima ? 'none' : '1px solid var(--color-border)',
      opacity: revocado || !u.activo ? 0.55 : 1,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: '#fff',
      }}>
        {iniciales}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 650, color: 'var(--color-text)' }}>
            {u.nombre ?? u.email}
          </span>
          {u.rol && (
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '2px 7px', borderRadius: 20,
              background: `${rolColor}1F`, color: rolColor, border: `1px solid ${rolColor}44`,
            }}>
              {ROL_ETIQUETA[u.rol] ?? u.rol}
            </span>
          )}
          {revocado && <Marca texto="Acceso eliminado" color="#EF4444" />}
          {!revocado && !u.activo && <Marca texto="Desactivado" color="var(--color-text-3)" />}
          {u.sin_perfil && <Marca texto="Sin perfil" color="#F59E0B" />}
          {!u.email_confirmado && <Marca texto="Correo sin confirmar" color="#F59E0B" />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 3 }}>
          {u.nombre && (
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{u.email}</span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-3)' }}>
            <Building2 size={11} />
            {u.gym ?? 'Sin gimnasio'}
          </span>
          {u.equipos.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6366F1' }}>
              <UsersRound size={11} />
              {u.equipos.join(', ')}
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 96 }}>
        <div style={{
          fontSize: 12.5, fontWeight: 600,
          color: acceso.dias === null || acceso.dias > 30 ? '#F59E0B' : 'var(--color-text-2)',
        }}>
          {acceso.texto}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-4)' }}>último acceso</div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {!revocado && u.user_id && (
          u.activo ? (
            <BotonAccion titulo="Desactivar" onClick={onDesactivar} disabled={ocupado}>
              <UserX size={13} />
            </BotonAccion>
          ) : (
            <BotonAccion titulo="Reactivar" onClick={onReactivar} disabled={ocupado}>
              <UserCheck size={13} />
            </BotonAccion>
          )
        )}
        {!revocado && (
          <BotonAccion titulo="Eliminar cuenta" onClick={onEliminar} peligro>
            <Trash2 size={13} />
          </BotonAccion>
        )}
      </div>
    </div>
  )
}

function Marca({ texto, color }: { texto: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      background: `${color}1A`, color, border: `1px solid ${color}44`,
    }}>
      {texto}
    </span>
  )
}

function BotonAccion({ titulo, onClick, disabled, peligro, children }: {
  titulo: string; onClick: () => void; disabled?: boolean; peligro?: boolean; children: React.ReactNode
}) {
  return (
    <button
      className="eb-tap"
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      aria-label={titulo}
      style={{
        padding: '6px 8px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'transparent',
        border: `1px solid ${peligro ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}`,
        color: peligro ? '#EF4444' : 'var(--color-text-3)',
        display: 'flex', alignItems: 'center', opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

/* ══════════════ Confirmación de eliminación ══════════════ */
function ConfirmarEliminacion({ usuario, onClose, onEliminado }: {
  usuario: UsuarioPlataforma
  onClose: () => void
  onEliminado: () => void
}) {
  const [escrito, setEscrito] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const coincide = escrito.trim().toLowerCase() === usuario.email.toLowerCase()

  async function confirmar() {
    if (!coincide) return
    setEnviando(true)
    setError('')
    try {
      await eliminarAcceso(usuario.auth_user_id, usuario.email)
      onEliminado()
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo eliminar la cuenta'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 460,
          border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          padding: '22px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 16 }}>
          <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              Eliminar la cuenta de {usuario.nombre ?? usuario.email}
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--color-text-2)', lineHeight: 1.6 }}>
              No podrá volver a entrar nunca. <strong style={{ color: 'var(--color-text)' }}>
              Sí se conserva</strong> todo lo que creó: sus rutinas siguen asignadas y el historial
              de sus atletas queda intacto.
            </p>
          </div>
          <button
            className="eb-tap"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              borderRadius: 8, cursor: 'pointer', padding: 5, display: 'flex',
              color: 'var(--color-text-2)', flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        <label style={{
          display: 'block', fontSize: 12, color: 'var(--color-text-3)', marginBottom: 7, lineHeight: 1.5,
        }}>
          Para confirmar, escribe <strong style={{ color: 'var(--color-text-2)' }}>{usuario.email}</strong>
        </label>
        <input
          autoFocus
          value={escrito}
          onChange={e => { setEscrito(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && coincide && confirmar()}
          placeholder={usuario.email}
          style={{
            width: '100%', padding: '9px 11px', boxSizing: 'border-box',
            border: `1px solid ${escrito && !coincide ? 'rgba(239,68,68,0.4)' : 'var(--color-border)'}`,
            borderRadius: 9, fontSize: 13.5, color: 'var(--color-text)',
            background: 'var(--color-bg)', outline: 'none', marginBottom: 14,
          }}
        />

        {error && <p style={{ fontSize: 12.5, color: '#EF4444', marginBottom: 12, lineHeight: 1.5 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-text-2)', fontSize: 13.5, fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!coincide || enviando}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              fontSize: 13.5, fontWeight: 700,
              background: coincide && !enviando ? '#EF4444' : 'var(--color-surface-2)',
              color: coincide && !enviando ? '#fff' : 'var(--color-text-3)',
              cursor: coincide && !enviando ? 'pointer' : 'not-allowed',
            }}
          >
            {enviando ? 'Eliminando...' : 'Eliminar cuenta'}
          </button>
        </div>
      </div>
    </div>
  )
}
