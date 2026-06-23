'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowRight, Check, Play, Menu, X } from 'lucide-react'

const PHOTOS = {
  hero:      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1440&auto=format&fit=crop&q=85',
  athlete1:  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80',
  athlete2:  'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&auto=format&fit=crop&q=80',
  box:       'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
  team:      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
  cinematic: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1440&auto=format&fit=crop&q=85',
}

const TABS = ['Atletas', 'Rutinas', 'WODs', 'Métricas']

const CYCLING_WORDS = [
  'coach de CrossFit',
  'box y Gimnasios',
  'tu negocio fitness',
]

export default function HomePage() {
  const [scrolled, setScrolled]     = useState(false)
  const [email, setEmail]           = useState('')
  const [activeTab, setActiveTab]   = useState(0)
  const [wordIdx, setWordIdx]       = useState(0)
  const [animating, setAnimating]   = useState(false)
  const [isMobile, setIsMobile]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setWordIdx(i => (i + 1) % CYCLING_WORDS.length)
        setAnimating(false)
      }, 350)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  const px = isMobile ? '20px' : '72px'

  return (
    <main style={{ background: '#0D1117', color: '#EDF0F7', fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: scrolled || menuOpen ? 'rgba(8,11,16,0.97)' : 'transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ padding: `0 ${px}`, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>T</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '0.04em', fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>THRYRA</span>
          </div>

          {/* Desktop links */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
              <a href="#producto" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>Producto</a>
              <a href="#precios" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>Precios</a>
              <Link href="/login" style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}>
                Iniciar sesión
              </Link>
              <Link href="/registro" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#C6FF00', color: '#0D1117',
                padding: '8px 20px', borderRadius: 8,
                fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
              }}>
                Empezar gratis <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* Mobile: CTA + hamburger */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/registro" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#C6FF00', color: '#0D1117',
                padding: '7px 14px', borderRadius: 8,
                fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}>
                Gratis <ArrowRight size={12} />
              </Link>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile dropdown menu */}
        {isMobile && menuOpen && (
          <div style={{
            background: 'rgba(8,11,16,0.97)', backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '20px',
            display: 'flex', flexDirection: 'column', gap: 0,
          }}>
            {[
              { label: 'Producto', href: '#producto' },
              { label: 'Precios', href: '#precios' },
              { label: 'Iniciar sesión', href: '/login' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 16, color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
                  fontWeight: 500, padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex', alignItems: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${PHOTOS.hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: isMobile
            ? 'rgba(5,5,8,0.82)'
            : 'linear-gradient(90deg, rgba(5,5,8,0.94) 0%, rgba(5,5,8,0.80) 50%, rgba(5,5,8,0.35) 100%)',
        }} />

        <div style={{ position: 'relative', padding: isMobile ? '120px 20px 100px' : '140px 72px 120px', width: '100%' }}>
          <style>{`
            @keyframes wordSlideIn {
              from { opacity: 0; transform: translateY(32px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes wordSlideOut {
              from { opacity: 1; transform: translateY(0); }
              to   { opacity: 0; transform: translateY(-32px); }
            }
          `}</style>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C6FF00', marginBottom: 20 }}>
            Train. Evolve. Thrive.
          </p>

          <h1 style={{
            fontSize: isMobile ? '38px' : 'clamp(40px, 5.2vw, 74px)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            color: '#fff',
            marginBottom: 24,
            fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
          }}>
            La plataforma todo en uno<br />
            <span style={{
              display: 'block',
              color: 'rgba(255,255,255,0.35)',
              animation: animating
                ? 'wordSlideOut 0.32s cubic-bezier(0.4,0,1,1) forwards'
                : 'wordSlideIn 0.38s cubic-bezier(0,0,0.2,1) forwards',
            }}>
              para {CYCLING_WORDS[wordIdx]}
            </span>
            en LATAM.
          </h1>

          <p style={{
            fontSize: isMobile ? 16 : 18,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.65,
            maxWidth: 480,
            marginBottom: 36,
            fontWeight: 400,
          }}>
            Gestiona atletas, programa WODs y rutinas,
            detecta abandono antes de que pase.
          </p>

          {/* Email capture */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 10 : 0,
            maxWidth: isMobile ? '100%' : 460,
          }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Ingresa tu correo"
              style={{
                flex: 1,
                padding: '14px 18px',
                fontSize: 15,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRight: isMobile ? '1px solid rgba(255,255,255,0.14)' : 'none',
                borderRadius: isMobile ? '10px' : '10px 0 0 10px',
                color: '#fff', outline: 'none',
                backdropFilter: 'blur(10px)',
              }}
            />
            <Link href={`/registro${email ? `?email=${encodeURIComponent(email)}` : ''}`} style={{
              padding: isMobile ? '14px 20px' : '14px 26px',
              fontSize: 15, fontWeight: 700,
              background: '#C6FF00', color: '#0D1117',
              borderRadius: isMobile ? '10px' : '0 10px 10px 0',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 4px 24px rgba(198,255,0,0.35)',
            }}>
              Empezar gratis <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{ display: 'none' }}><Play size={1} /><Check size={1} /></div>
        </div>

        {/* Logos LATAM */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: isMobile ? '14px 20px' : '18px 32px',
          display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 16 : 40,
          flexWrap: 'wrap',
          overflowX: isMobile ? 'auto' : 'visible',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, flexShrink: 0 }}>Coaches en</span>
          {[
            { code: 'mx', name: 'México' },
            { code: 'ar', name: 'Argentina' },
            { code: 'co', name: 'Colombia' },
            { code: 'cl', name: 'Chile' },
            { code: 'pe', name: 'Perú' },
            { code: 'uy', name: 'Uruguay' },
          ].map(p => (
            <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <img src={`https://flagcdn.com/w40/${p.code}.png`} alt={p.name} width={20} height={14}
                style={{ borderRadius: 3, objectFit: 'cover', opacity: 0.85 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTO / TABS ──────────────────────────────────────────── */}
      <section id="producto" style={{ background: '#0D1117', padding: isMobile ? '60px 20px 0' : '100px 72px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6366F1', marginBottom: 14 }}>La herramienta</p>
          <h2 style={{ fontSize: isMobile ? '28px' : 'clamp(32px, 4.5vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: '#EDF0F7', maxWidth: 640, marginBottom: 40, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>
            Todo lo que necesitas para operar tu box.
          </h2>

          {/* Tabs */}
          <div style={{ overflowX: 'auto', marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 4, background: '#13181F', borderRadius: 12, padding: 5, width: 'fit-content', minWidth: isMobile ? 'fit-content' : undefined }}>
              {TABS.map((t, i) => (
                <button key={t} onClick={() => setActiveTab(i)} style={{
                  padding: isMobile ? '8px 16px' : '9px 22px',
                  borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: isMobile ? 13 : 13.5,
                  fontWeight: i === activeTab ? 700 : 500,
                  background: i === activeTab ? '#6366F1' : 'transparent',
                  color: i === activeTab ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: i === activeTab ? '0 2px 8px rgba(99,102,241,0.40)' : 'none',
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #252D3A', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', background: '#13181F' }}>
            {activeTab === 0 && <TabAtletas isMobile={isMobile} />}
            {activeTab === 1 && <TabRutinas isMobile={isMobile} />}
            {activeTab === 2 && <TabWODs isMobile={isMobile} />}
            {activeTab === 3 && <TabMetricas isMobile={isMobile} />}
          </div>
        </div>
      </section>

      {/* ── EDITORIAL BENTO ──────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 20px' : '100px 72px', background: '#0D1117' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16,
          minHeight: isMobile ? undefined : 580,
        }}>
          <div style={{
            background: '#C6FF00', borderRadius: 20, padding: isMobile ? 28 : 48,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24,
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 20 }}>
                THRYRA · 2026
              </p>
              <h3 style={{ fontSize: isMobile ? '28px' : 'clamp(28px, 3.5vw, 44px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: '#0A0A0A', marginBottom: 16, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>
                Construido<br />para el coach<br />que no para.
              </h3>
              <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.55)', lineHeight: 1.65, maxWidth: 340 }}>
                No somos una empresa de software genérico adaptada a fitness. Somos coaches que construyeron la herramienta que siempre quisieron.
              </p>
            </div>
            <Link href="/registro" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#0A0A0A', color: '#C6FF00',
              padding: '12px 22px', borderRadius: 10,
              fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
              width: 'fit-content',
            }}>
              Empieza gratis <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[PHOTOS.athlete1, PHOTOS.athlete2, PHOTOS.box, PHOTOS.team].map((src, i) => (
              <div key={i} style={{
                borderRadius: 14, overflow: 'hidden',
                backgroundImage: `url(${src})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                minHeight: isMobile ? 120 : 140,
              }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK CINEMATIC ───────────────────────────────────────────── */}
      <section style={{
        position: 'relative', minHeight: isMobile ? 400 : 500, overflow: 'hidden',
        display: 'flex', alignItems: 'center',
        background: '#080B10',
      }}>
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: isMobile ? '100%' : '50%',
          backgroundImage: `url(${PHOTOS.cinematic})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: isMobile ? 0.14 : 0.30,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: isMobile
            ? 'linear-gradient(180deg, #080B10 30%, transparent 100%)'
            : 'linear-gradient(90deg, #080B10 40%, transparent 100%)',
        }} />

        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: isMobile ? '60px 20px' : '100px 72px', width: '100%' }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6366F1', marginBottom: 16 }}>Para todos</p>
          <h2 style={{ fontSize: isMobile ? '28px' : 'clamp(34px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: '#fff', maxWidth: 600, marginBottom: 32, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>
            Para el coach que trabaja solo.{' '}
            <span style={{ color: 'rgba(255,255,255,0.30)', fontStyle: 'italic' }}>Y para el que dirige un equipo.</span>
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Pill label="Coach individual" sub="1–100 atletas" />
            <Pill label="Box / Gym" sub="Multi-coach, grupos" />
            <Pill label="Cadena de boxes" sub="Próximamente" dim />
          </div>
        </div>
      </section>

      {/* ── FEATURES — Atletas ───────────────────────────────────────── */}
      <section style={{ background: '#0D1117', padding: isMobile ? '60px 20px' : '100px 72px' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '45% 55%',
          gap: isMobile ? 40 : 64,
          alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6366F1', marginBottom: 16 }}>Gestiona</p>
            <h2 style={{ fontSize: isMobile ? '26px' : 'clamp(28px, 3.5vw, 48px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, color: '#EDF0F7', marginBottom: 16, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>
              Conoce a cada atleta.<br />
              <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.28)' }}>De verdad.</span>
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28 }}>
              Ficha completa por atleta: datos personales, historial médico, progresión de cargas, asistencia. Todo accesible en segundos.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Historial de cargas y PRs automáticos', 'Alertas de abandono con anticipación', 'Asistencia y cumplimiento por semana'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 999, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#818CF8" strokeWidth={3} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <AtletasScreenshot />
        </div>
      </section>

      {/* ── FEATURES — Programación ──────────────────────────────────── */}
      <section style={{ background: '#080B10', padding: isMobile ? '60px 20px' : '100px 72px' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '55% 45%',
          gap: isMobile ? 40 : 64,
          alignItems: 'center',
        }}>
          {!isMobile && <RutinasScreenshot />}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6366F1', marginBottom: 16 }}>Programa</p>
            <h2 style={{ fontSize: isMobile ? '26px' : 'clamp(28px, 3.5vw, 48px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, color: '#fff', marginBottom: 16, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>
              WODs y rutinas.<br />
              <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.28)' }}>Sin fricciones.</span>
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28 }}>
              Constructor de rutinas con bloques y superseries. WODs con timer nativo: AMRAP, EMOM, For Time, Tabata, Chipper.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['808+ ejercicios de la biblioteca wger', 'Drag & drop visual, sin complicaciones', 'Asigna a atletas individuales o grupos'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 999, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#818CF8" strokeWidth={3} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          {isMobile && <RutinasScreenshot />}
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section style={{ background: '#0D1117', borderTop: '1px solid rgba(255,255,255,0.05)', padding: isMobile ? '48px 20px' : '80px 72px' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 12,
          textAlign: 'left',
        }}>
          {[
            { n: '808+', label: 'ejercicios en la biblioteca', sub: 'de wger.de' },
            { n: '6',    label: 'países de LATAM', sub: 'ya en beta' },
            { n: '4',    label: 'roles de usuario', sub: 'plataforma → atleta' },
            { n: '30',   label: 'días gratis', sub: 'sin tarjeta' },
          ].map(s => (
            <div key={s.n} style={{ padding: isMobile ? '20px 16px' : '28px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: isMobile ? '32px' : 'clamp(36px, 4vw, 56px)', fontWeight: 900, color: '#6366F1', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>{s.n}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{s.label}<br /><span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>{s.sub}</span></p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section style={{
        background: '#080B10', padding: isMobile ? '72px 20px' : '120px 72px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 700, height: 500,
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 40 : 80,
            alignItems: 'center',
          }}>
            <div>
              <h2 style={{ fontSize: isMobile ? '32px' : 'clamp(34px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.05, marginBottom: 20, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>
                Tu box merece<br />una herramienta<br />
                <span style={{ color: '#C6FF00' }}>a su altura.</span>
              </h2>
              <p style={{ fontSize: isMobile ? 15 : 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>
                Empieza gratis 30 días. Sin tarjeta de crédito. Soporte en español desde el día uno.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0, marginBottom: 16 }}>
                <input
                  type="email"
                  placeholder="tucorreo@gmail.com"
                  style={{
                    flex: 1, padding: '14px 18px', fontSize: 14.5,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRight: isMobile ? '1px solid rgba(255,255,255,0.10)' : 'none',
                    borderRadius: isMobile ? '10px' : '10px 0 0 10px',
                    color: '#fff', outline: 'none',
                  }}
                />
                <Link href="/registro" style={{
                  padding: '14px 24px', fontSize: 14.5, fontWeight: 700,
                  background: '#C6FF00', color: '#0D1117',
                  borderRadius: isMobile ? '10px' : '0 10px 10px 0',
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 4px 24px rgba(198,255,0,0.30)',
                }}>
                  Empezar gratis <ArrowRight size={16} />
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['30 días gratis', 'Sin tarjeta', 'Cancela cuando quieras'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                    <Check size={11} color="#6366F1" strokeWidth={3} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ background: '#040608', borderTop: '1px solid rgba(255,255,255,0.05)', padding: isMobile ? '36px 20px 28px' : '48px 72px 36px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>T</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: '0.04em', fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>THRYRA</span>
          </div>
          <div style={{ display: 'flex', gap: isMobile ? 20 : 32, flexWrap: 'wrap' }}>
            {['Producto', 'Precios', 'Privacidad', 'Términos'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', textDecoration: 'none', fontWeight: 500 }}>{l}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>© 2026 THRYRA — Hecho para LATAM.</p>
        </div>
      </footer>

    </main>
  )
}

// ── Small components ───────────────────────────────────────────────────────

function Pill({ label, sub, dim }: { label: string; sub: string; dim?: boolean }) {
  return (
    <div style={{
      padding: '12px 18px', borderRadius: 12,
      border: `1px solid ${dim ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
      background: dim ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
    }}>
      <p style={{ fontSize: 13.5, fontWeight: 700, color: dim ? 'rgba(255,255,255,0.25)' : '#fff', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 12, color: dim ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)' }}>{sub}</p>
    </div>
  )
}

// ── Tab panels ─────────────────────────────────────────────────────────────

function TabAtletas({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', minHeight: isMobile ? undefined : 480 }}>
      <div style={{ padding: isMobile ? 24 : 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, borderRight: isMobile ? 'none' : '1px solid #252D3A', borderBottom: isMobile ? '1px solid #252D3A' : 'none' }}>
        <h3 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#EDF0F7', lineHeight: 1.15, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>Fichas completas.<br />Siempre al día.</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>Datos personales, historial médico, progresión de cargas. Todo en una ficha accesible en segundos.</p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['PRs automáticos por ejercicio', 'Historial de asistencia', 'Alertas de abandono'].map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(255,255,255,0.65)' }}>
              <Check size={13} color="#818CF8" strokeWidth={2.5} />{f}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 20 : 32 }}>
        <AtletasScreenshot small />
      </div>
    </div>
  )
}

function TabRutinas({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', minHeight: isMobile ? undefined : 480 }}>
      <div style={{ padding: isMobile ? 24 : 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, borderRight: isMobile ? 'none' : '1px solid #252D3A', borderBottom: isMobile ? '1px solid #252D3A' : 'none' }}>
        <h3 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#EDF0F7', lineHeight: 1.15, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>Construye rutinas.<br />Sin fricción.</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>Drag & drop visual. Bloques, superseries, configuración por ejercicio. 808+ ejercicios disponibles.</p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Bloques y superseries', 'Biblioteca de 808+ ejercicios', 'Asignación por atleta o grupo'].map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(255,255,255,0.65)' }}>
              <Check size={13} color="#818CF8" strokeWidth={2.5} />{f}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 20 : 32 }}>
        <RutinasScreenshot small />
      </div>
    </div>
  )
}

function TabWODs({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', minHeight: isMobile ? undefined : 480 }}>
      <div style={{ padding: isMobile ? 24 : 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, borderRight: isMobile ? 'none' : '1px solid #252D3A', borderBottom: isMobile ? '1px solid #252D3A' : 'none' }}>
        <h3 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#EDF0F7', lineHeight: 1.15, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>WODs con timer.<br />Nativo.</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>AMRAP, EMOM, For Time, Tabata, Chipper. Timer integrado. Sin apps de terceros.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['AMRAP', 'EMOM', 'For Time', 'Tabata', 'Chipper'].map(w => (
            <span key={w} style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: '#818CF8', fontSize: 12, fontWeight: 700 }}>{w}</span>
          ))}
        </div>
      </div>
      <div style={{ background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 20 : 32 }}>
        <WODMockup />
      </div>
    </div>
  )
}

function TabMetricas({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', minHeight: isMobile ? undefined : 480 }}>
      <div style={{ padding: isMobile ? 24 : 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, borderRight: isMobile ? 'none' : '1px solid #252D3A', borderBottom: isMobile ? '1px solid #252D3A' : 'none' }}>
        <h3 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#EDF0F7', lineHeight: 1.15, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>Retén atletas<br />antes de perderlos.</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>El dashboard detecta atletas en riesgo automáticamente según días de inactividad y tendencia.</p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Riesgo alto / medio / bajo', 'Sesiones y cumplimiento semanal', 'Comparativa entre grupos'].map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(255,255,255,0.65)' }}>
              <Check size={13} color="#818CF8" strokeWidth={2.5} />{f}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 20 : 32 }}>
        <MetricasMockup />
      </div>
    </div>
  )
}

// ── Screenshot mockups ─────────────────────────────────────────────────────

function AtletasScreenshot({ small }: { small?: boolean }) {
  return (
    <div style={{ background: '#13181F', borderRadius: 14, border: '1px solid #252D3A', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.35)', width: '100%', transform: small ? 'scale(0.88)' : undefined, transformOrigin: 'center' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1A2030', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#EDF0F7' }}>Atletas</span>
        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>14 activos</span>
      </div>
      {[
        { ini: 'VR', name: 'Valentina Rojas', sport: 'CrossFit · Avanzado', badge: 'Activo', bc: '#22C55E', bb: 'rgba(34,197,94,0.12)' },
        { ini: 'SM', name: 'Sebastián Morales', sport: 'CrossFit · Intermedio', badge: 'Activo', bc: '#22C55E', bb: 'rgba(34,197,94,0.12)' },
        { ini: 'NH', name: 'Nicolás Herrera', sport: 'CrossFit · Avanzado', badge: 'En riesgo', bc: '#EF4444', bb: 'rgba(239,68,68,0.12)' },
        { ini: 'CT', name: 'Camila Torres', sport: 'Hyrox · Principiante', badge: 'Activo', bc: '#22C55E', bb: 'rgba(34,197,94,0.12)' },
      ].map(a => (
        <div key={a.ini} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1A2030' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#818CF8', flexShrink: 0 }}>{a.ini}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#EDF0F7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{a.sport}</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: a.bc, background: a.bb, padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>{a.badge}</span>
        </div>
      ))}
    </div>
  )
}

function RutinasScreenshot({ small }: { small?: boolean }) {
  return (
    <div style={{ background: '#080B10', borderRadius: 14, border: '1px solid #252D3A', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.45)', width: '100%', transform: small ? 'scale(0.88)' : undefined, transformOrigin: 'center' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Fuerza Base — Semana 1</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>4 bloques · 6 ejercicios</p>
      </div>
      {[
        { block: 'BLOQUE 1 — Estándar', exs: ['Back Squat  3×10 · 70%1RM · 60s', 'Romanian DL  3×8 · 65%'] },
        { block: 'BLOQUE 2 — Superserie', exs: ['Bench Press  4×8 · 75%', 'DB Row  4×10 por lado'] },
      ].map(b => (
        <div key={b.block} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{b.block}</p>
          {b.exs.map(ex => (
            <div key={ex} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{ex}</p>
            </div>
          ))}
        </div>
      ))}
      <div style={{ padding: '10px 16px' }}>
        <span style={{ fontSize: 12, color: '#818CF8', fontWeight: 600 }}>+ Agregar bloque</span>
      </div>
    </div>
  )
}

function WODMockup() {
  return (
    <div style={{ background: '#080B10', borderRadius: 14, border: '1px solid #252D3A', overflow: 'hidden', width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.30)' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>WOD del día</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', background: 'rgba(99,102,241,0.14)', padding: '3px 10px', borderRadius: 999 }}>AMRAP</span>
      </div>
      <div style={{ padding: 18, textAlign: 'center' }}>
        <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', marginBottom: 4, fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>20:00</div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>AMRAP · 20 minutos</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {['21 Thrusters (95/65 lb)', '15 Pull-ups', '9 Box Jumps (24/20")'].map(e => (
            <div key={e} style={{ padding: '9px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', textAlign: 'left' }}>{e}</p>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#C6FF00', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: '#0D1117' }}>
          ▶ Iniciar timer
        </button>
      </div>
    </div>
  )
}

function MetricasMockup() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { l: 'Atletas activos', v: '24', c: '#EDF0F7' },
          { l: 'Cumplimiento', v: '91%', c: '#22C55E' },
          { l: 'Sesiones/semana', v: '18', c: '#EDF0F7' },
          { l: 'En riesgo', v: '2', c: '#EF4444' },
        ].map(k => (
          <div key={k.l} style={{ background: '#13181F', border: '1px solid #252D3A', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.l}</p>
            <p style={{ fontSize: 24, fontWeight: 900, color: k.c, letterSpacing: '-0.03em', lineHeight: 1 }}>{k.v}</p>
          </div>
        ))}
      </div>
      <div style={{ background: '#13181F', border: '1px solid #252D3A', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #1A2030' }}>
          <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Riesgo de abandono</p>
        </div>
        {[
          { n: 'Nicolás H.', l: 'Alto', c: '#EF4444', p: 85 },
          { n: 'Catalina C.', l: 'Medio', c: '#F59E0B', p: 55 },
          { n: 'Diego F.', l: 'Bajo', c: '#22C55E', p: 22 },
        ].map(a => (
          <div key={a.n} style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1A2030' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#EDF0F7', width: 76, flexShrink: 0 }}>{a.n}</p>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
              <div style={{ width: `${a.p}%`, height: '100%', background: a.c, borderRadius: 999 }} />
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: a.c, width: 50, textAlign: 'right', flexShrink: 0 }}>{a.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
