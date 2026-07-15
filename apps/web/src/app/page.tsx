'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowRight, Check, Menu, X, ChevronRight,
  BarChart2, Users, Zap, Timer, Dumbbell,
  Star, Bell, MessageCircle, Award, Briefcase,
  Target, Wifi, Sun, Moon, TrendingUp, Flame
} from 'lucide-react'

/* ─── brand tokens (hardcoded, always vibrant) ─────────── */
const ACCENT   = '#6366F1'
const VIOLET   = '#7C3AED'
const LIME     = '#C6FF00'
const DARK_BG  = '#0D1117'

/* ─── static data ──────────────────────────────────────── */
const NAV_LINKS = ['Producto', 'Funciones', 'Precios', 'Blog']
const DYN_WORDS = ['gestionar tus clientes', 'gestionar tu box', 'tu negocio fitness']

const KPI_CARDS = [
  { val: '+82%',   label: 'Retención', sub: 'vs sin herramienta', grad: `linear-gradient(140deg,${ACCENT} 0%,${VIOLET} 100%)`, col: '#fff', icon: <TrendingUp size={18}/> },
  { val: '+90%',   label: 'Tiempo libre', sub: 'más de 5h por semana', grad: 'linear-gradient(140deg,#06B6D4 0%,#0E7490 100%)', col: '#fff', icon: <Zap size={18}/> },
  { val: '5,000+', label: 'Atletas',    sub: 'en Latinoamérica',   grad: `linear-gradient(140deg,${LIME} 0%,#84CC16 100%)`, col: DARK_BG, icon: <Users size={18}/> },
  { val: '25+',    label: 'Boxes',      sub: 'activos en 6 países', grad: 'linear-gradient(140deg,#F59E0B 0%,#EF4444 100%)', col: '#fff', icon: <Flame size={18}/> },
]

const FEATURES = [
  { icon: <Users size={18}/>, title: 'Gestiona cada atleta a fondo.', body: 'Ficha completa con historial, PRs automáticos y alertas de abandono. Sabes quién está en riesgo antes de que se vaya.', color: ACCENT },
  { icon: <Dumbbell size={18}/>, title: 'Programa WODs y rutinas sin fricciones.', body: 'Constructor drag & drop con 808+ ejercicios. AMRAP, EMOM, For Time, Tabata y Chipper con timer nativo integrado.', color: VIOLET },
  { icon: <BarChart2 size={18}/>, title: 'Métricas que te dicen qué hacer.', body: 'Dashboard de retención, cumplimiento semanal y riesgo de abandono en tiempo real. Datos accionables, no solo números.', color: '#06B6D4' },
]

const SERVICES = [
  { icon: <Users size={22}/>, title: 'Clases grupales', desc: 'WODs con timer proyectable y registro de asistencia.', bg: `${ACCENT}18`, ic: ACCENT },
  { icon: <Briefcase size={22}/>, title: 'Entrenamiento personal', desc: 'Rutinas 1:1 con seguimiento de PRs individualizado.', bg: '#7C3AED18', ic: VIOLET },
  { icon: <Wifi size={22}/>, title: 'Programas online', desc: 'Crea y asigna programas remotos con seguimiento.', bg: '#06B6D418', ic: '#06B6D4' },
  { icon: <Award size={22}/>, title: 'Competencia y retos', desc: 'Leaderboards, retos internos y eventos especiales.', bg: `${LIME}22`, ic: '#7A9900' },
]

const AUDIENCE_TABS = ['Coach independiente', 'Box CrossFit', 'Academia fitness']
const AUDIENCE_DATA = [
  [
    { icon: <Target size={20}/>, col: ACCENT, title: 'Clientes organizados', desc: 'Ficha completa con historial, PRs, notas y alertas de inactividad. Sin hojas de cálculo.' },
    { icon: <Dumbbell size={20}/>, col: ACCENT, title: 'Rutinas personalizadas', desc: 'Programas individuales con bloques, superseries y progresión automática de cargas.' },
    { icon: <TrendingUp size={20}/>, col: ACCENT, title: 'Resultados medibles', desc: 'Tus clientes ven su progreso en PRs. Tú ves su adherencia. Todos ganan.' },
  ],
  [
    { icon: <Timer size={20}/>, col: VIOLET, title: 'WODs con timer nativo', desc: 'AMRAP, EMOM, For Time, Tabata y Chipper. Timer proyectable en la pantalla del box.' },
    { icon: <Users size={20}/>, col: VIOLET, title: 'Grupos de entrenamiento', desc: 'Crea grupos, asigna WODs y sigue la asistencia de cada atleta por clase.' },
    { icon: <Bell size={20}/>, col: VIOLET, title: 'Alertas de abandono', desc: 'Detecta automáticamente quién lleva días sin aparecer. Actúa antes de que cancele.' },
  ],
  [
    { icon: <BarChart2 size={20}/>, col: '#06B6D4', title: 'Métricas de negocio', desc: 'Retención, cumplimiento y riesgo de churn a nivel de academia completa.' },
    { icon: <Users size={20}/>, col: '#06B6D4', title: 'Multi-sede y multi-coach', desc: 'Gestiona varios coaches con roles y permisos diferenciados por sede.' },
    { icon: <Zap size={20}/>, col: '#06B6D4', title: 'Control total', desc: 'Panel de administrador con visibilidad de todos los atletas y grupos.' },
  ],
]

const FEATURE_TABS = [
  { label: 'Atletas', icon: <Users size={13}/> },
  { label: 'Programación', icon: <Dumbbell size={13}/> },
  { label: 'WODs', icon: <Timer size={13}/> },
  { label: 'Métricas', icon: <BarChart2 size={13}/> },
]

const TESTIMONIALS = [
  { name: 'Valentina R.', role: 'Head Coach · CrossFit CDMX', stars: 5, text: 'Con THRYRA detecté que 3 atletas llevaban 2 semanas sin venir. Los recuperé antes de que cancelaran. Nunca había podido hacer eso con una planilla.' },
  { name: 'Matías C.', role: 'Dueño de box · Santiago, Chile', stars: 5, text: 'Programar WODs ahora me toma 10 minutos. Antes pasaba toda la tarde armando el Google Doc y todavía se veía mal en el celular.' },
  { name: 'Luciana F.', role: 'Coach · Medellín, Colombia', stars: 5, text: 'El timer proyectable en la pantalla del box cambió todo. Mis atletas saben exactamente qué hacer sin que yo tenga que gritar el tiempo.' },
]

const CMP = [
  { f: 'Gestión de atletas',             t: true,  p: false, g: false },
  { f: 'Timer nativo integrado',          t: true,  p: false, g: false },
  { f: 'Alertas de abandono automáticas', t: true,  p: false, g: false },
  { f: 'Constructor de WODs drag & drop', t: true,  p: false, g: false },
  { f: 'Métricas de retención',           t: true,  p: false, g: false },
  { f: 'Precio accesible LATAM',          t: true,  p: true,  g: false },
  { f: 'Soporte en español',              t: true,  p: false, g: false },
]

/* ─── component ─────────────────────────────────────────── */
export default function HomePage() {
  const [theme, setTheme]             = useState<'dark'|'light'>('dark')
  const [isMobile, setIsMobile]       = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [activeAcc, setActiveAcc]     = useState(0)
  const [activeTab, setActiveTab]     = useState(0)
  const [audienceTab, setAudienceTab] = useState(0)
  const [dynIdx, setDynIdx]           = useState(0)
  const [dynVis, setDynVis]           = useState(true)

  const applyTheme = useCallback((t: 'dark'|'light') => {
    if (t === 'light') document.documentElement.setAttribute('data-theme','light')
    else document.documentElement.removeAttribute('data-theme')
  }, [])

  useEffect(() => {
    const saved = (localStorage.getItem('thryra-theme') as 'dark'|'light'|null) ?? 'dark'
    setTheme(saved); applyTheme(saved)
  }, [applyTheme])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      setDynVis(false)
      setTimeout(() => { setDynIdx(i => (i+1) % DYN_WORDS.length); setDynVis(true) }, 350)
    }, 2800)
    return () => clearInterval(iv)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next); localStorage.setItem('thryra-theme', next); applyTheme(next)
  }

  const C = {
    bg:        'var(--color-bg)',
    surf:      'var(--color-surface)',
    surf2:     'var(--color-surface-2)',
    bdr:       'var(--color-border)',
    bdr2:      'var(--color-border-2)',
    txt:       'var(--color-text)',
    txt2:      'var(--color-text-2)',
    txt3:      'var(--color-text-3)',
    acc:       'var(--color-red)',
    accM:      'var(--color-red-muted)',
    accBr:     'var(--color-red-bright)',
    lime:      'var(--color-lime)',
    limeM:     'var(--color-lime-muted)',
    suc:       'var(--color-success)',
    warn:      'var(--color-warning)',
    err:       'var(--color-error)',
    shCard:    'var(--shadow-card)',
    shCardH:   'var(--shadow-card-hover)',
    shLg:      'var(--shadow-lg)',
  }

  const H = (size: string, weight = 700) => ({
    fontSize: size, fontWeight: weight,
    letterSpacing: '-0.032em', lineHeight: 1.1,
    fontFamily: 'var(--font-montserrat,Montserrat,sans-serif)',
  })

  const isDark = theme === 'dark'

  return (
    <main style={{ background: C.bg, color: C.txt, fontFamily: 'var(--font-inter,Inter,system-ui,sans-serif)', overflowX: 'hidden' }}>

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .kpi-card{transition:transform .2s,box-shadow .2s,filter .2s}
        .kpi-card:hover{transform:translateY(-4px) scale(1.02);filter:brightness(1.08)}
        .feature-card{transition:box-shadow .2s,transform .2s,border-color .2s}
        .feature-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-card-hover)!important;border-color:var(--color-border-2)!important}
        .bcard{transition:transform .18s,box-shadow .18s}
        .bcard:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.18)!important}
        .svc-card{transition:transform .18s,box-shadow .18s,border-color .18s}
        .svc-card:hover{transform:translateY(-2px);border-color:var(--color-border-2)!important}
        .test-card{transition:transform .18s,box-shadow .18s}
        .test-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-card-hover)!important}
        .nav-link:hover{color:var(--color-red)!important}
        .footer-link:hover{color:rgba(255,255,255,.7)!important}
        .cmp-row:hover{background:var(--color-surface-2)}
        .pill-cta{transition:all .15s;display:inline-flex;align-items:center;gap:7px}
        .pill-cta:hover{opacity:.9;transform:translateY(-1px)}
        .acc-item{transition:background .15s,border-color .15s}
        .tab-btn{transition:all .15s}
        .theme-btn{transition:all .18s}
        .theme-btn:hover{background:var(--color-surface-2)!important}
        .aud-tab{transition:all .15s}
        input::placeholder{color:var(--color-text-3)}
        :focus-visible{outline:2px solid var(--color-red);outline-offset:2px}
      `}</style>

      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, pointerEvents:'none' }}>
        <div style={{ margin:'12px 16px 0', pointerEvents:'auto', background: isDark ? 'rgba(13,17,23,0.88)' : 'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:`1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, borderRadius:16, boxShadow:'0 4px 24px rgba(0,0,0,.12)', padding:'0 20px' }}>
          <div style={{ height:64, display:'flex', alignItems:'center', gap:6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={isDark ? '/logos/logo-dark-v3.png' : '/logos/logo-light-v2.png'} alt="THRYRA" style={{ height:46, width:'auto', marginRight:14, flexShrink:0 }} />
            {!isMobile && NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" style={{ padding:'7px 11px', borderRadius:8, fontSize:13.5, fontWeight:500, color:C.txt2, transition:'color .15s' }}>{l}</a>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
              <button onClick={toggleTheme} className="theme-btn" aria-label="Toggle theme" style={{ width:36, height:36, borderRadius:10, border:`1px solid ${C.bdr}`, background:'transparent', cursor:'pointer', color:C.txt2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {isDark ? <Sun size={15}/> : <Moon size={15}/>}
              </button>
              {!isMobile && <Link href="/login" style={{ padding:'7px 15px', borderRadius:9, fontSize:13.5, fontWeight:500, color:C.txt2, background:'transparent', border:`1px solid ${C.bdr}`, transition:'all .15s' }}>Iniciar sesión</Link>}
              <Link href="/registro" className="pill-cta" style={{ padding:'9px 20px', borderRadius:10, fontSize:13.5, fontWeight:600, background:`linear-gradient(135deg,${ACCENT},${VIOLET})`, color:'#fff', boxShadow:'0 4px 14px rgba(99,102,241,.35)' }}>
                {isMobile ? 'Empezar' : 'Empezar gratis'} <ArrowRight size={13}/>
              </Link>
              {isMobile && (
                <button onClick={() => setMenuOpen(o => !o)} style={{ width:36, height:36, borderRadius:8, border:`1px solid ${C.bdr}`, background:'none', cursor:'pointer', color:C.txt2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {menuOpen ? <X size={15}/> : <Menu size={15}/>}
                </button>
              )}
            </div>
          </div>
          {isMobile && menuOpen && (
            <div style={{ borderTop:`1px solid ${C.bdr}`, padding:'8px 0 14px' }}>
              {[...NAV_LINKS,'Iniciar sesión'].map(l => (
                <a key={l} href="#" onClick={() => setMenuOpen(false)} style={{ display:'block', padding:'11px 4px', fontSize:15, color:C.txt2, fontWeight:500, borderBottom:`1px solid ${C.surf2}` }}>{l}</a>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{ background: isDark
          ? `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), ${DARK_BG}`
          : `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%), #F4F5F8`,
        padding: isMobile ? '120px 20px 64px' : '140px 24px 80px', textAlign:'center' }}>

        <h1 style={{ ...H(isMobile ? '34px' : 'clamp(44px,5vw,70px)'), color:C.txt, maxWidth:900, margin:'0 auto 14px', lineHeight:1.1 }}>
          La plataforma todo en uno para<br />
          <span style={{ display:'inline-block', color: isDark ? LIME : ACCENT, opacity:dynVis?1:0, transform:dynVis?'translateY(0)':'translateY(8px)', transition:'opacity 0.35s ease,transform 0.35s ease', textShadow: isDark ? `0 0 32px ${LIME}55` : 'none' }}>
            {DYN_WORDS[dynIdx]}.
          </span>
        </h1>

        <p style={{ fontSize:isMobile?16:18, color:C.txt2, lineHeight:1.7, maxWidth:500, margin:'0 auto 36px', fontWeight:400 }}>
          Gestiona atletas, programa WODs y rutinas, detecta abandono antes de que pase. Todo en un solo lugar.
        </p>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <Link href="/registro" className="pill-cta" style={{ padding:'16px 38px', borderRadius:13, fontSize:15, fontWeight:700, background: isDark ? `linear-gradient(135deg,${ACCENT},${VIOLET})` : LIME, color: isDark ? '#fff' : DARK_BG, boxShadow: isDark ? '0 8px 32px rgba(99,102,241,.4)' : '0 8px 32px rgba(198,255,0,.35)' }}>
            Empieza a usarla GRATIS <ArrowRight size={15}/>
          </Link>
          <p style={{ fontSize:12.5, color:C.txt3 }}>30 días gratis · Sin tarjeta · Cancela cuando quieras</p>
        </div>

        {/* KPI cards row — BankDash style */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:12, maxWidth:860, margin:'60px auto 0' }}>
          {KPI_CARDS.map(k => (
            <div key={k.label} className="kpi-card" style={{ background:k.grad, borderRadius:16, padding:'22px 20px', textAlign:'left', boxShadow:'0 8px 28px rgba(0,0,0,.22)', cursor:'default' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ opacity:.7, color:k.col }}>{k.icon}</span>
                <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', color:k.col, opacity:.65 }}>THRYRA</span>
              </div>
              <p style={{ ...H(isMobile?'26px':'30px'), color:k.col, marginBottom:4 }}>{k.val}</p>
              <p style={{ fontSize:13, fontWeight:600, color:k.col, marginBottom:2 }}>{k.label}</p>
              <p style={{ fontSize:11, color:k.col, opacity:.65 }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Product mockup */}
        <div style={{ maxWidth:1060, margin:'52px auto 0', animation:'float 8s ease-in-out infinite' }}>
          <div style={{ background:C.surf, borderRadius:18, border:`1px solid ${C.bdr}`, boxShadow:`0 32px 80px rgba(0,0,0,.3),0 0 0 1px rgba(99,102,241,.06)`, overflow:'hidden' }}>
            <div style={{ background:C.surf2, padding:'11px 18px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${C.bdr}` }}>
              <div style={{ display:'flex', gap:5 }}>{['#FF5F57','#FEBC2E','#28C840'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }}/>)}</div>
              <div style={{ flex:1, background:C.bdr, borderRadius:5, height:22, maxWidth:260, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:10.5, color:C.txt3 }}>app.thryra.com/dashboard</span>
              </div>
            </div>
            <DashboardMockup C={C} isDark={isDark} />
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ══════════════════════════════════════════ */}
      <div style={{ background:C.surf, borderTop:`1px solid ${C.bdr}`, borderBottom:`1px solid ${C.bdr}`, padding:isMobile?'20px':'24px 80px' }}>
        <div style={{ maxWidth:1060, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', gap:isMobile?10:32, flexWrap:'wrap' }}>
          <p style={{ fontSize:12, color:C.txt3, fontWeight:500 }}>Coaches en todo LATAM confían en THRYRA</p>
          {[{code:'mx',name:'México'},{code:'ar',name:'Argentina'},{code:'co',name:'Colombia'},{code:'cl',name:'Chile'},{code:'pe',name:'Perú'},{code:'uy',name:'Uruguay'}].map(p=>(
            <div key={p.code} style={{ display:'flex', alignItems:'center', gap:5, opacity:.5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://flagcdn.com/w40/${p.code}.png`} alt={p.name} width={18} height={12} style={{ borderRadius:2,objectFit:'cover' }}/>
              <span style={{ fontSize:12, fontWeight:600, color:C.txt2 }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PARA TODOS ════════════════════════════════════════════ */}
      <section style={{ background:C.bg, padding:isMobile?'72px 20px':'96px 80px' }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <Label text="Para todos" C={C}/>
          <h2 style={{ ...H(isMobile?'26px':'clamp(30px,3.5vw,48px)'), color:C.txt, textAlign:'center', marginBottom:12 }}>
            Para coaches que inspiran<br/>y negocios que escalan.
          </h2>
          <p style={{ fontSize:15, color:C.txt2, textAlign:'center', marginBottom:40, lineHeight:1.65, fontWeight:400 }}>
            THRYRA se adapta a ti, seas un coach independiente o un box con múltiples sedes.
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:32, flexWrap:'wrap' }}>
            {AUDIENCE_TABS.map((t,i) => (
              <button key={t} onClick={() => setAudienceTab(i)} className="aud-tab"
                style={{ padding:'9px 20px', borderRadius:10, border:`1px solid ${audienceTab===i ? ACCENT : C.bdr}`, background:audienceTab===i ? `${ACCENT}18` : C.surf, color:audienceTab===i ? ACCENT : C.txt2, fontSize:13.5, fontWeight:audienceTab===i?600:400, cursor:'pointer' }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:14 }}>
            {AUDIENCE_DATA[audienceTab].map(card => (
              <div key={card.title} className="feature-card" style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:16, padding:'24px 22px', display:'flex', flexDirection:'column', gap:12, boxShadow:C.shCard }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${card.col}18`, display:'flex', alignItems:'center', justifyContent:'center', color:card.col }}>{card.icon}</div>
                <p style={{ fontSize:15, fontWeight:600, color:C.txt }}>{card.title}</p>
                <p style={{ fontSize:13.5, color:C.txt2, lineHeight:1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICIOS ════════════════════════════════════════════ */}
      <section style={{ background:C.surf2, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <Label text="Todo en un lugar" C={C}/>
          <h2 style={{ ...H(isMobile?'26px':'clamp(30px,3.5vw,48px)'), color:C.txt, textAlign:'center', marginBottom:12 }}>
            Ofrece todos tus servicios<br/>en un solo lugar.
          </h2>
          <p style={{ fontSize:15, color:C.txt2, textAlign:'center', marginBottom:48, lineHeight:1.65, fontWeight:400 }}>
            Clases grupales, entrenamiento personal, programas online. Todo desde THRYRA.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:14 }}>
            {SERVICES.map(s => (
              <div key={s.title} className="svc-card feature-card" style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:16, padding:'24px 20px', display:'flex', flexDirection:'column', gap:10, boxShadow:C.shCard }}>
                <div style={{ width:46, height:46, borderRadius:13, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', color:s.ic }}>{s.icon}</div>
                <p style={{ fontSize:14.5, fontWeight:600, color:C.txt }}>{s.title}</p>
                <p style={{ fontSize:13, color:C.txt2, lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PLANIFICA ════════════════════════════════════════════ */}
      <section style={{ background:C.bg, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:1060, margin:'0 auto', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?40:80, alignItems:'center' }}>
          <div>
            <Label text="Programación" C={C} left/>
            <h2 style={{ ...H(isMobile?'26px':'clamp(28px,3vw,44px)'), color:C.txt, marginBottom:16 }}>
              Planifica con precisión.<br/>Crea con confianza.
            </h2>
            <p style={{ fontSize:15, color:C.txt2, lineHeight:1.7, marginBottom:24 }}>
              El constructor de WODs y rutinas más completo para coaches de CrossFit. Drag & drop, 808+ ejercicios, bloques y progresión automática.
            </p>
            <ul style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
              {['808+ ejercicios con descripción y músculos','Bloques, supersets, circuitos y finishers','Progresión de carga automática por atleta','Publicación directa a grupos o atletas'].map(f => (
                <li key={f} style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:14, color:C.txt2 }}>
                  <Check size={14} color={ACCENT} strokeWidth={2.5} style={{ flexShrink:0, marginTop:2 }}/>{f}
                </li>
              ))}
            </ul>
            <Link href="/registro" className="pill-cta" style={{ padding:'11px 22px', borderRadius:10, background:`linear-gradient(135deg,${ACCENT},${VIOLET})`, color:'#fff', fontSize:14, fontWeight:600, boxShadow:'0 4px 14px rgba(99,102,241,.3)' }}>
              Probar gratis <ChevronRight size={14}/>
            </Link>
          </div>
          <div style={{ background:C.surf, borderRadius:18, border:`1px solid ${C.bdr}`, overflow:'hidden', boxShadow:C.shLg }}>
            <RutinasBuilder C={C} isDark={isDark}/>
          </div>
        </div>
      </section>

      {/* ══ HAZ SEGUIMIENTO ══════════════════════════════════════ */}
      <section style={{ background:C.surf2, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:1060, margin:'0 auto', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?40:80, alignItems:'center' }}>
          <div style={{ background:C.surf, borderRadius:18, border:`1px solid ${C.bdr}`, overflow:'hidden', boxShadow:C.shLg, order:isMobile?2:1 }}>
            <MetricasPanel C={C}/>
          </div>
          <div style={{ order:isMobile?1:2 }}>
            <Label text="Métricas" C={C} left/>
            <h2 style={{ ...H(isMobile?'26px':'clamp(28px,3vw,44px)'), color:C.txt, marginBottom:16 }}>
              Haz seguimiento.<br/>Analiza. Mejora.
            </h2>
            <p style={{ fontSize:15, color:C.txt2, lineHeight:1.7, marginBottom:24 }}>
              Deja de adivinar quién va a cancelar. THRYRA detecta patrones de abandono y te da los datos para actuar antes de que sea tarde.
            </p>
            <ul style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
              {['Riesgo de abandono por atleta (alto/medio/bajo)','Tasa de retención y cumplimiento semanal','Comparativa de rendimiento entre grupos','Dashboard en tiempo real sin configuración'].map(f => (
                <li key={f} style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:14, color:C.txt2 }}>
                  <Check size={14} color={ACCENT} strokeWidth={2.5} style={{ flexShrink:0, marginTop:2 }}/>{f}
                </li>
              ))}
            </ul>
            <Link href="/registro" className="pill-cta" style={{ padding:'11px 22px', borderRadius:10, background:`linear-gradient(135deg,${ACCENT},${VIOLET})`, color:'#fff', fontSize:14, fontWeight:600, boxShadow:'0 4px 14px rgba(99,102,241,.3)' }}>
              Ver métricas <ChevronRight size={14}/>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ CONECTA ══════════════════════════════════════════════ */}
      <section style={{ background: isDark ? '#080B10' : '#0F1117', padding:isMobile?'72px 20px':'96px 80px' }}>
        <div style={{ maxWidth:1060, margin:'0 auto', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?40:80, alignItems:'center' }}>
          <div>
            <p style={{ fontSize:11.5, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:LIME, marginBottom:12 }}>Engagement</p>
            <h2 style={{ ...H(isMobile?'26px':'clamp(28px,3vw,44px)'), color:'#fff', marginBottom:16 }}>
              Conecta. Motiva.<br/>Retén.
            </h2>
            <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:28 }}>
              Un atleta que siente que su coach lo ve, no cancela. THRYRA te da las herramientas para estar presente sin estar físicamente presente.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { icon:<Bell size={17}/>, title:'Alertas automáticas', desc:'Notificaciones de inactividad y hitos.' },
                { icon:<MessageCircle size={17}/>, title:'Notas por atleta', desc:'Observaciones privadas por cada atleta.' },
                { icon:<Award size={17}/>, title:'Celebra los PRs', desc:'El sistema reconoce cada récord personal.' },
                { icon:<Target size={17}/>, title:'Metas y objetivos', desc:'Asigna metas y mide el avance real.' },
              ].map(f => (
                <div key={f.title} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px 14px' }}>
                  <div style={{ color:'#818CF8', marginBottom:8 }}>{f.icon}</div>
                  <p style={{ fontSize:13.5, fontWeight:600, color:'#fff', marginBottom:4 }}>{f.title}</p>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)', lineHeight:1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:18, border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
            <EngagementFeed/>
          </div>
        </div>
      </section>

      {/* ══ ELEVA TU PRESENCIA ════════════════════════════════════ */}
      <section style={{ background:C.bg, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:1060, margin:'0 auto', display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?40:80, alignItems:'center' }}>
          <div>
            <Label text="Crecimiento" C={C} left/>
            <h2 style={{ ...H(isMobile?'26px':'clamp(28px,3vw,44px)'), color:C.txt, marginBottom:16 }}>
              Eleva tu presencia.<br/>Expande tu alcance.
            </h2>
            <p style={{ fontSize:15, color:C.txt2, lineHeight:1.7, marginBottom:24 }}>
              THRYRA no es solo una herramienta operativa. Es la base para que tu box crezca: más atletas, mejor retención, más ingresos.
            </p>
            <ul style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
              {['Branding personalizado con tu logo y colores','Programas online para clientes remotos','Métricas de crecimiento mensual del box','Reportes exportables para decisiones de negocio'].map(f => (
                <li key={f} style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:14, color:C.txt2 }}>
                  <Check size={14} color={ACCENT} strokeWidth={2.5} style={{ flexShrink:0, marginTop:2 }}/>{f}
                </li>
              ))}
            </ul>
            <Link href="/registro" className="pill-cta" style={{ padding:'11px 22px', borderRadius:10, background:`linear-gradient(135deg,${ACCENT},${VIOLET})`, color:'#fff', fontSize:14, fontWeight:600, boxShadow:'0 4px 14px rgba(99,102,241,.3)' }}>
              Escalar mi box <ChevronRight size={14}/>
            </Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { pct:'+82%', label:'de retención promedio con THRYRA vs sin herramienta digital', grad:`linear-gradient(135deg,${ACCENT},${VIOLET})`, col:'#fff' },
              { pct:'+90%', label:'de coaches dicen ahorrar más de 5 horas por semana', grad:`linear-gradient(135deg,${LIME},#84CC16)`, col:DARK_BG },
              { pct:'5k+',  label:'atletas gestionados en LATAM durante la beta',             grad:'linear-gradient(135deg,#06B6D4,#0891B2)', col:'#fff' },
              { pct:'25+',  label:'boxes activos en 6 países de Latinoamérica',               grad:'linear-gradient(135deg,#F59E0B,#EF4444)', col:'#fff' },
            ].map(s => (
              <div key={s.pct} className="kpi-card" style={{ background:s.grad, borderRadius:14, padding:'20px 24px', display:'flex', alignItems:'center', gap:20, boxShadow:'0 4px 16px rgba(0,0,0,.2)' }}>
                <p style={{ ...H('30px'), color:s.col, flexShrink:0, minWidth:72 }}>{s.pct}</p>
                <p style={{ fontSize:13, color:s.col, opacity:.75, lineHeight:1.45 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE ACCORDION ════════════════════════════════════ */}
      <section id="producto" style={{ background:C.surf2, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <Label text="La herramienta" C={C}/>
          <h2 style={{ ...H(isMobile?'26px':'clamp(30px,3.5vw,48px)'), color:C.txt, textAlign:'center', marginBottom:56 }}>
            Ahorra tiempo<br/>y haz más cosas.
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:isMobile?36:72, alignItems:'center' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {FEATURES.map((item,i) => (
                <button key={i} onClick={() => setActiveAcc(i)} className="acc-item"
                  style={{ textAlign:'left', background:activeAcc===i ? C.surf : 'transparent', border:'none', borderRadius:12, padding:'18px 20px', cursor:'pointer', width:'100%', borderLeft:`3px solid ${activeAcc===i ? item.color : 'transparent'}`, boxShadow:activeAcc===i ? C.shCard : 'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:activeAcc===i?8:0 }}>
                    <span style={{ color:activeAcc===i ? item.color : C.txt3 }}>{item.icon}</span>
                    <p style={{ fontSize:isMobile?16:17.5, fontWeight:600, color:activeAcc===i ? C.txt : C.txt2 }}>{item.title}</p>
                  </div>
                  {activeAcc===i && <p style={{ fontSize:14, color:C.txt2, lineHeight:1.65, marginLeft:28 }}>{item.body}</p>}
                </button>
              ))}
            </div>
            <div style={{ background:C.surf, borderRadius:16, border:`1px solid ${C.bdr}`, overflow:'hidden', boxShadow:C.shLg }}>
              {activeAcc===0 && <AtletasView C={C}/>}
              {activeAcc===1 && <RutinasView C={C}/>}
              {activeAcc===2 && <MetricasView C={C}/>}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA ═════════════════════════════════════════ */}
      <section style={{ background:C.bg, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <Label text="Simple desde el día uno" C={C}/>
          <h2 style={{ ...H(isMobile?'26px':'clamp(30px,3.5vw,48px)'), color:C.txt, textAlign:'center', marginBottom:12 }}>
            Empieza en minutos,<br/>no en semanas.
          </h2>
          <p style={{ fontSize:15, color:C.txt2, textAlign:'center', lineHeight:1.65, maxWidth:440, margin:'0 auto 48px' }}>
            Sin configuraciones interminables. THRYRA está listo desde que creas tu cuenta.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:20 }}>
            {[
              { n:'01', title:'Crea tu box en minutos', body:'Configura tu espacio, invita a tus coaches y carga tus atletas. Listo para operar el mismo día.', grad:`linear-gradient(135deg,${ACCENT}22,${ACCENT}08)`, bc:ACCENT },
              { n:'02', title:'Programa y publica WODs', body:'Diseña el entrenamiento con el constructor visual y publícalo para que tus atletas lo vean antes de llegar.', grad:'linear-gradient(135deg,#06B6D422,#06B6D408)', bc:'#06B6D4' },
              { n:'03', title:'Sigue el progreso en vivo', body:'Mira quién registró el WOD, quién batió un PR y quién lleva semanas sin aparecer — antes de que sea tarde.', grad:`linear-gradient(135deg,${LIME}22,${LIME}08)`, bc:LIME },
            ].map(s => (
              <div key={s.n} className="feature-card" style={{ background:s.grad, border:`1px solid ${s.bc}22`, borderRadius:18, padding:'32px 28px', boxShadow:C.shCard }}>
                <p style={{ fontSize:11, fontWeight:700, color:s.bc, letterSpacing:'0.12em', marginBottom:16, opacity:.7 }}>{s.n}</p>
                <p style={{ fontSize:17, fontWeight:700, color:C.txt, marginBottom:10, lineHeight:1.3, fontFamily:'var(--font-montserrat,Montserrat,sans-serif)' }}>{s.title}</p>
                <p style={{ fontSize:14, color:C.txt2, lineHeight:1.65 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TABS POR CASO DE USO ══════════════════════════════════ */}
      <section id="funciones" style={{ background:C.surf2, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <Label text="Funciones" C={C}/>
          <h2 style={{ ...H(isMobile?'26px':'clamp(30px,3.5vw,48px)'), color:C.txt, textAlign:'center', marginBottom:12 }}>
            La opción perfecta<br/>para cualquier box.
          </h2>
          <p style={{ fontSize:15, color:C.txt2, textAlign:'center', marginBottom:36, lineHeight:1.65 }}>Personaliza THRYRA a medida que crece tu negocio.</p>
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:24, flexWrap:'wrap' }}>
            {FEATURE_TABS.map((tab,i) => (
              <button key={tab.label} onClick={() => setActiveTab(i)} className="tab-btn"
                style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', borderRadius:10, border:`1px solid ${activeTab===i ? ACCENT : C.bdr}`, background:activeTab===i ? `${ACCENT}18` : C.surf, color:activeTab===i ? ACCENT : C.txt2, fontSize:13.5, fontWeight:activeTab===i?600:400, cursor:'pointer' }}>
                <span style={{ color:activeTab===i ? ACCENT : C.txt3 }}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
          <div style={{ background:C.surf, borderRadius:18, border:`1px solid ${C.bdr}`, boxShadow:C.shLg, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'40% 60%' }}>
              <div style={{ padding:isMobile?'28px 22px':'44px', borderRight:isMobile?'none':`1px solid ${C.bdr}`, borderBottom:isMobile?`1px solid ${C.bdr}`:'none', display:'flex', flexDirection:'column', gap:14 }}>
                {activeTab===0 && <TabContent C={C} title="Entrega resultados a tus atletas siempre." body="Ficha completa, PRs automáticos y alertas de abandono. Potencia la eficiencia de tu box con visibilidad total." items={['Reduce el tiempo de seguimiento manual','Controla la adherencia con alertas automáticas','Gestiona con información completa siempre']} quote={{ text:'Con THRYRA detecté que 3 atletas llevaban 2 semanas sin venir. Los recuperé a tiempo.', author:'Valentina R., Head Coach CrossFit MX' }}/>}
                {activeTab===1 && <TabContent C={C} title="Diseña rutinas sin fricción." body="Constructor drag & drop con bloques, superseries y finishers. 808+ ejercicios listos para usar." items={['Bloques, supersets y circuitos visuales','Biblioteca de 808+ ejercicios','Asignación directa a atletas o grupos']}/>}
                {activeTab===2 && <TabContent C={C} title="WODs con timer. Todo nativo." body="AMRAP, EMOM, For Time, Tabata, Chipper. Timer proyectable. Sin apps de terceros." items={['5 modalidades de WOD nativas','Timer proyectable en pantalla del box','Registro automático de resultados']} chips={['AMRAP','EMOM','For Time','Tabata','Chipper']}/>}
                {activeTab===3 && <TabContent C={C} title="Retén atletas antes de perderlos." body="Riesgo de abandono automático por inactividad. Cumplimiento semanal y comparativa entre grupos." items={['Riesgo alto/medio/bajo automático','Sesiones y cumplimiento por semana','Comparativa entre grupos en tiempo real']}/>}
                <Link href="/registro" className="pill-cta" style={{ padding:'11px 20px', borderRadius:9, background:`linear-gradient(135deg,${ACCENT},${VIOLET})`, color:'#fff', fontSize:13.5, fontWeight:600, width:'fit-content', boxShadow:'0 4px 14px rgba(99,102,241,.3)' }}>
                  Usar esta función <ChevronRight size={13}/>
                </Link>
              </div>
              <div style={{ background:C.surf2, padding:isMobile?18:28, display:'flex', alignItems:'center', justifyContent:'center', minHeight:320 }}>
                {activeTab===0 && <AtletasView C={C}/>}
                {activeTab===1 && <RutinasView C={C}/>}
                {activeTab===2 && <WODView C={C}/>}
                {activeTab===3 && <MetricasView C={C}/>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ BENTO GRID ═══════════════════════════════════════════ */}
      <section style={{ background:C.bg, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <Label text="Todo incluido" C={C}/>
          <h2 style={{ ...H(isMobile?'26px':'clamp(30px,3.5vw,48px)'), color:C.txt, textAlign:'center', marginBottom:10 }}>
            Todo lo que busca<br/>tu box.
          </h2>
          <p style={{ fontSize:15, color:C.txt2, textAlign:'center', marginBottom:44, lineHeight:1.65 }}>THRYRA es increíblemente flexible. Nunca dejamos de innovar.</p>

          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div className="bcard" style={{ background:`linear-gradient(140deg,${ACCENT},${VIOLET})`, borderRadius:18, padding:'26px 22px', boxShadow:'0 8px 24px rgba(99,102,241,.3)' }}>
              <p style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:5 }}>PRs automáticos</p>
              <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.65)', marginBottom:16, lineHeight:1.5 }}>El sistema detecta récords personales solo. Sin papeleo.</p>
              <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
                {[{n:'VR',ex:'Back Squat',v:'95 kg',pr:true},{n:'SM',ex:'Clean & Jerk',v:'80 kg',pr:false},{n:'NH',ex:'Deadlift',v:'140 kg',pr:true}].map(r=>(
                  <div key={r.n} style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:22,height:22,borderRadius:'50%',background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8.5,fontWeight:700,color:'#fff',flexShrink:0 }}>{r.n}</div>
                    <p style={{ fontSize:11,color:'rgba(255,255,255,0.88)',fontWeight:500,flex:1 }}>{r.ex}</p>
                    <span style={{ fontSize:11,fontWeight:700,color:'#fff' }}>{r.v}</span>
                    {r.pr && <span style={{ fontSize:9,fontWeight:700,background:LIME,color:DARK_BG,padding:'1px 5px',borderRadius:4 }}>PR</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="bcard" style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:18, padding:'26px 22px', boxShadow:C.shCard }}>
              <p style={{ fontSize:15, fontWeight:700, color:C.txt, marginBottom:5 }}>Timer nativo</p>
              <p style={{ fontSize:12.5, color:C.txt2, marginBottom:16, lineHeight:1.5 }}>5 modalidades. Proyectable en la pantalla del box.</p>
              <div style={{ background:DARK_BG, borderRadius:12, padding:'16px', textAlign:'center' }}>
                <div style={{ display:'flex', gap:5, justifyContent:'center', marginBottom:10, flexWrap:'wrap' }}>
                  {['AMRAP','EMOM','For Time','Tabata'].map((m,i)=>(
                    <span key={m} style={{ fontSize:8.5,fontWeight:600,padding:'3px 6px',borderRadius:4,background:i===0?ACCENT:'rgba(255,255,255,0.08)',color:i===0?'#fff':'rgba(255,255,255,0.4)' }}>{m}</span>
                  ))}
                </div>
                <p style={{ fontSize:38,fontWeight:700,color:'#fff',letterSpacing:'-0.05em',lineHeight:1,fontVariantNumeric:'tabular-nums' }}>12:47</p>
                <p style={{ fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:4 }}>AMRAP · 20 min</p>
                <div style={{ marginTop:10,padding:'7px',borderRadius:7,background:ACCENT,fontSize:11,fontWeight:600,color:'#fff' }}>▶ En curso</div>
              </div>
            </div>
            <div className="bcard" style={{ background:`${ACCENT}14`, border:`1px solid ${ACCENT}28`, borderRadius:18, padding:'26px 22px', boxShadow:C.shCard }}>
              <p style={{ fontSize:15, fontWeight:700, color:C.txt, marginBottom:5 }}>Personaliza tu box</p>
              <p style={{ fontSize:12.5, color:C.txt2, marginBottom:16, lineHeight:1.5 }}>Activa o desactiva módulos según tu flujo.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {[{label:'Timer proyectable',on:true},{label:'Alertas de churn',on:true},{label:'Modo competición',on:false},{label:'Grupos avanzados',on:true}].map(f=>(
                  <div key={f.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:C.surf, borderRadius:8, padding:'7px 10px', border:`1px solid ${C.bdr}` }}>
                    <span style={{ fontSize:11.5, color:C.txt, fontWeight:500 }}>{f.label}</span>
                    <div style={{ width:30,height:16,borderRadius:999,background:f.on?ACCENT:C.bdr,position:'relative',flexShrink:0 }}>
                      <div style={{ width:12,height:12,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:f.on?16:2,boxShadow:'0 1px 3px rgba(0,0,0,.2)',transition:'left .15s' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div className="bcard" style={{ background: isDark ? '#080B10' : '#0F1117', border:'1px solid rgba(255,255,255,0.06)', borderRadius:18, padding:'26px 22px', boxShadow:'0 4px 20px rgba(0,0,0,.3)' }}>
              <p style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:5 }}>Gestión de atletas</p>
              <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.45)', marginBottom:16, lineHeight:1.5 }}>Ficha completa, historial y niveles.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {[{i:'VR',n:'Valentina R.',s:'Activo',c:'#22C55E'},{i:'SM',n:'Sebastián M.',s:'Activo',c:'#22C55E'},{i:'NH',n:'Nicolás H.',s:'Riesgo',c:'#EF4444'},{i:'CT',n:'Camila T.',s:'Activo',c:'#22C55E'}].map(a=>(
                  <div key={a.i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:7, background:'rgba(255,255,255,0.05)' }}>
                    <div style={{ width:24,height:24,borderRadius:'50%',background:ACCENT,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'#fff',flexShrink:0 }}>{a.i}</div>
                    <p style={{ fontSize:11.5, color:'rgba(255,255,255,0.8)', fontWeight:500, flex:1 }}>{a.n}</p>
                    <span style={{ fontSize:10, fontWeight:600, color:a.c }}>{a.s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bcard" style={{ background:`linear-gradient(140deg,${VIOLET},#5B21B6)`, borderRadius:18, padding:'26px 22px', boxShadow:'0 8px 24px rgba(124,58,237,.3)' }}>
              <p style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:5 }}>Es la sustituta perfecta</p>
              <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.65)', marginBottom:16, lineHeight:1.5 }}>Acaba con Google Sheets, Notion y apps sin integrar.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {['Google Sheets','Notion','WhatsApp','Excel','Google Forms'].map(app=>(
                  <div key={app} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px', borderRadius:6, background:'rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize:10.5, color:'rgba(255,255,255,0.4)', textDecoration:'line-through', flex:1 }}>{app}</span>
                    <span style={{ fontSize:9, fontWeight:700, color:LIME, background:`${LIME}20`, padding:'2px 6px', borderRadius:4 }}>THRYRA</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bcard" style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:18, padding:'26px 22px', boxShadow:C.shCard }}>
              <p style={{ fontSize:15, fontWeight:700, color:C.txt, marginBottom:5 }}>Métricas en tiempo real</p>
              <p style={{ fontSize:12.5, color:C.txt2, marginBottom:16, lineHeight:1.5 }}>Riesgo de abandono, cumplimiento y retención.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[{l:'Tasa de retención',v:'94%',c:'#22C55E',w:94},{l:'Cumplimiento semanal',v:'87%',c:ACCENT,w:87},{l:'Riesgo de churn',v:'6%',c:'#EF4444',w:6}].map(m=>(
                  <div key={m.l}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, color:C.txt2 }}>{m.l}</span>
                      <span style={{ fontSize:11, color:m.c, fontWeight:700 }}>{m.v}</span>
                    </div>
                    <div style={{ height:5, background:C.bdr, borderRadius:999 }}>
                      <div style={{ width:`${m.w}%`, height:'100%', background:m.c, borderRadius:999 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'2fr 1fr', gap:12 }}>
            <div className="bcard" style={{ background:`linear-gradient(135deg,${LIME},#AAFF00)`, borderRadius:18, padding:'28px 28px', boxShadow:'0 8px 24px rgba(198,255,0,.2)' }}>
              <p style={{ fontSize:15, fontWeight:700, color:DARK_BG, marginBottom:5 }}>Hecho para LATAM</p>
              <p style={{ fontSize:12.5, color:`${DARK_BG}88`, marginBottom:18, lineHeight:1.5 }}>Español, precios accesibles, soporte humano.</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {[{code:'mx',name:'México'},{code:'ar',name:'Argentina'},{code:'co',name:'Colombia'},{code:'cl',name:'Chile'},{code:'pe',name:'Perú'},{code:'uy',name:'Uruguay'}].map(p=>(
                  <div key={p.code} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.1)', borderRadius:20, padding:'4px 10px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w40/${p.code}.png`} alt={p.name} width={16} height={11} style={{ borderRadius:2,objectFit:'cover' }}/>
                    <span style={{ fontSize:11, fontWeight:600, color:DARK_BG }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bcard" style={{ background:`linear-gradient(140deg,${ACCENT},#4338CA)`, borderRadius:18, padding:'28px 24px', display:'flex', flexDirection:'column', justifyContent:'space-between', boxShadow:'0 8px 24px rgba(99,102,241,.3)' }}>
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:5 }}>808+ ejercicios</p>
                <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>Biblioteca completa con descripción y músculos.</p>
              </div>
              <p style={{ fontSize:54, fontWeight:700, color:'#fff', letterSpacing:'-0.05em', lineHeight:1, marginTop:16 }}>808</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIOS ══════════════════════════════════════════ */}
      <section style={{ background:C.surf2, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <Label text="Coaches reales" C={C}/>
          <h2 style={{ ...H(isMobile?'26px':'clamp(30px,3.5vw,48px)'), color:C.txt, textAlign:'center', marginBottom:44 }}>
            Lo que dicen los coaches<br/>que ya usan THRYRA.
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)', gap:18 }}>
            {TESTIMONIALS.map((t,i) => (
              <div key={i} className="test-card" style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:18, padding:'28px 24px', display:'flex', flexDirection:'column', gap:14, boxShadow:C.shCard, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${ACCENT},${VIOLET})` }}/>
                <div style={{ display:'flex', gap:3 }}>{Array.from({length:t.stars}).map((_,s)=><Star key={s} size={13} color="#F59E0B" fill="#F59E0B"/>)}</div>
                <p style={{ fontSize:14.5, color:C.txt2, lineHeight:1.7, flex:1 }}>&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p style={{ fontSize:13.5, fontWeight:600, color:C.txt }}>{t.name}</p>
                  <p style={{ fontSize:12, color:C.txt3, marginTop:2 }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMPARATIVA ══════════════════════════════════════════ */}
      <section style={{ background:C.bg, padding:isMobile?'72px 20px':'96px 80px', borderTop:`1px solid ${C.bdr}` }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <Label text="Por qué THRYRA" C={C}/>
          <h2 style={{ ...H(isMobile?'26px':'clamp(30px,3.5vw,48px)'), color:C.txt, textAlign:'center', marginBottom:44 }}>Sin comparación.</h2>
          <div style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:18, overflow:'hidden', boxShadow:C.shLg }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 100px', borderBottom:`2px solid ${C.bdr}` }}>
              <div style={{ padding:'14px 18px' }}/>
              {['THRYRA','Planilla','Otro SaaS'].map((col,i)=>(
                <div key={col} style={{ padding:'14px 10px', textAlign:'center', background:i===0?`${ACCENT}14`:'transparent', borderLeft:i===0?`2px solid ${ACCENT}`:'none' }}>
                  <p style={{ fontSize:12.5, fontWeight:700, color:i===0?ACCENT:C.txt3 }}>{col}</p>
                </div>
              ))}
            </div>
            {CMP.map((row,i)=>(
              <div key={i} className="cmp-row" style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 100px', borderBottom:i<CMP.length-1?`1px solid ${C.bdr}`:'none', transition:'background .1s' }}>
                <div style={{ padding:'12px 18px', display:'flex', alignItems:'center' }}>
                  <span style={{ fontSize:13.5, color:C.txt2 }}>{row.f}</span>
                </div>
                {([row.t,row.p,row.g] as boolean[]).map((val,j)=>(
                  <div key={j} style={{ padding:'12px 10px', display:'flex', alignItems:'center', justifyContent:'center', background:j===0?`${ACCENT}08`:'transparent', borderLeft:j===0?`2px solid ${ACCENT}30`:'none' }}>
                    {val
                      ? <div style={{ width:20,height:20,borderRadius:'50%',background:'#22C55E18',display:'flex',alignItems:'center',justifyContent:'center' }}><Check size={12} color="#22C55E" strokeWidth={2.5}/></div>
                      : <span style={{ fontSize:15, color:C.txt3, opacity:.4 }}>✕</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ═════════════════════════════════════════════ */}
      <section style={{ background:`linear-gradient(135deg,${ACCENT} 0%,${VIOLET} 100%)`, padding:isMobile?'80px 20px':'112px 80px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 60% 60% at 50% 100%,rgba(198,255,0,0.12) 0%,transparent 70%)`, pointerEvents:'none' }}/>
        <div style={{ maxWidth:600, margin:'0 auto', position:'relative' }}>
          <h2 style={{ ...H(isMobile?'30px':'clamp(32px,4vw,54px)'), color:'#fff', marginBottom:16, lineHeight:1.08 }}>
            Únete a la evolución<br/>del coaching hoy.
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.65)', lineHeight:1.65, marginBottom:36 }}>
            30 días gratis. Soporte en español desde el primer día. Sin tarjeta de crédito.
          </p>
          <div style={{ display:'flex', flexDirection:isMobile?'column':'row', maxWidth:440, margin:'0 auto 20px' }}>
            <input type="email" placeholder="tucorreo@gmail.com"
              style={{ flex:1, padding:'14px 16px', fontSize:14, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRight:isMobile?'1px solid rgba(255,255,255,0.25)':'none', borderRadius:isMobile?'11px 11px 0 0':'11px 0 0 11px', color:'#fff', outline:'none' }}/>
            <Link href="/registro" className="pill-cta" style={{ justifyContent:'center', padding:'14px 24px', fontSize:14, fontWeight:700, background:'#fff', color:ACCENT, borderRadius:isMobile?'0 0 11px 11px':'0 11px 11px 0', whiteSpace:'nowrap' }}>
              Empezar gratis <ArrowRight size={14}/>
            </Link>
          </div>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            {['30 días gratis','Sin tarjeta','Cancela cuando quieras','Soporte en español'].map(t=>(
              <span key={t} style={{ fontSize:12, color:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', gap:5 }}>
                <Check size={11} color="rgba(255,255,255,0.75)" strokeWidth={3}/> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer style={{ background: isDark ? '#080B10' : '#0F1117', borderTop:`1px solid rgba(255,255,255,0.06)`, padding:isMobile?'40px 20px 28px':'56px 80px 36px' }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'2fr 1fr 1fr 1fr', gap:isMobile?28:40, marginBottom:40 }}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo-dark-v3.png" alt="THRYRA" style={{ height:32, width:'auto', marginBottom:12 }}/>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.65, maxWidth:240 }}>La plataforma todo en uno para coaches y boxes CrossFit en Latinoamérica.</p>
            </div>
            {[
              { title:'Producto', links:['Atletas','WODs','Rutinas','Timer','Métricas'] },
              { title:'Empresa', links:['Nosotros','Blog','Prensa'] },
              { title:'Legal', links:['Privacidad','Términos'] },
            ].map(col=>(
              <div key={col.title}>
                <p style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.22)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>{col.title}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  {col.links.map(l=><a key={l} href="#" className="footer-link" style={{ fontSize:13, color:'rgba(255,255,255,0.38)', fontWeight:400, transition:'color .15s' }}>{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.22)' }}>© 2026 THRYRA · Hecho para LATAM.</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.22)' }}>Train. Evolve. Thrive.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ── HELPERS ── */

type Cv = Record<string, string>

function Label({ text, C, left }: { text: string; C: Cv; left?: boolean }) {
  return <p style={{ fontSize:11.5, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--color-red)', textAlign:left?'left':'center', marginBottom:12 }}>{text}</p>
}

function TabContent({ title, body, items, quote, chips, C }: { title: string; body: string; items: string[]; quote?: {text:string;author:string}; chips?: string[]; C: Cv }) {
  return <>
    <h3 style={{ fontSize:19, fontWeight:700, color:C.txt, lineHeight:1.25, fontFamily:'var(--font-montserrat,Montserrat,sans-serif)', letterSpacing:'-0.02em' }}>{title}</h3>
    <p style={{ fontSize:14, color:C.txt2, lineHeight:1.65 }}>{body}</p>
    <ul style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {items.map(f=><li key={f} style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:13.5, color:C.txt2 }}><Check size={14} color={ACCENT} strokeWidth={2.5} style={{ flexShrink:0,marginTop:3 }}/>{f}</li>)}
    </ul>
    {chips && <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>{chips.map(c=><span key={c} style={{ padding:'5px 10px', borderRadius:7, background:`${ACCENT}18`, color:ACCENT, fontSize:12, fontWeight:600, border:`1px solid ${ACCENT}30` }}>{c}</span>)}</div>}
    {quote && <div style={{ padding:'12px 14px', background:`${ACCENT}14`, borderRadius:9, borderLeft:`3px solid ${ACCENT}` }}>
      <p style={{ fontSize:12.5, color:ACCENT, fontStyle:'italic', lineHeight:1.55 }}>&ldquo;{quote.text}&rdquo;</p>
      <p style={{ fontSize:11.5, color:ACCENT, marginTop:5, fontWeight:600, opacity:.7 }}>— {quote.author}</p>
    </div>}
  </>
}

/* ── MOCKUP COMPONENTS ── */

function DashboardMockup({ C, isDark }: { C: Cv; isDark: boolean }) {
  void isDark
  return (
    <div style={{ display:'grid', gridTemplateColumns:'188px 1fr', minHeight:380 }}>
      <div style={{ background:'var(--sidebar-bg)', borderRight:`1px solid var(--sidebar-border)`, padding:'14px 10px' }}>
        <p style={{ fontSize:8, fontWeight:700, color:'var(--sidebar-label)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, padding:'0 4px' }}>Principal</p>
        {[{l:'Dashboard',a:true},{l:'Atletas'},{l:'WODs'},{l:'Rutinas'},{l:'Timer'},{l:'Métricas'}].map(item=>(
          <div key={item.l} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 8px', borderRadius:7, background:item.a?'var(--sidebar-bg-active)':'transparent', marginBottom:2 }}>
            <div style={{ width:5,height:5,borderRadius:'50%',background:item.a?'var(--color-red)':'var(--sidebar-text)',flexShrink:0 }}/>
            <span style={{ fontSize:11.5, fontWeight:item.a?600:400, color:item.a?'var(--sidebar-text-active)':'var(--sidebar-text)' }}>{item.l}</span>
          </div>
        ))}
      </div>
      <div style={{ padding:'18px 22px', background:C.surf }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:C.txt }}>Dashboard</p>
            <p style={{ fontSize:10.5, color:C.txt3 }}>Martes, 24 de Junio 2026</p>
          </div>
          <div style={{ padding:'6px 12px', borderRadius:7, background:`linear-gradient(135deg,${ACCENT},${VIOLET})`, fontSize:11, fontWeight:600, color:'#fff' }}>+ Nuevo WOD</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
          {[{l:'Atletas activos',v:'47',c:ACCENT},{l:'Sesiones hoy',v:'12',c:'#22C55E'},{l:'Cumplimiento',v:'94%',c:VIOLET},{l:'En riesgo',v:'3',c:'#EF4444'}].map(k=>(
            <div key={k.l} style={{ background:C.surf2, border:`1px solid ${C.bdr}`, borderRadius:9, padding:'10px 12px' }}>
              <p style={{ fontSize:9, color:C.txt3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{k.l}</p>
              <p style={{ fontSize:20, fontWeight:700, color:k.c, letterSpacing:'-0.04em', lineHeight:1 }}>{k.v}</p>
            </div>
          ))}
        </div>
        <div style={{ background:C.surf2, border:`1px solid ${C.bdr}`, borderRadius:9, overflow:'hidden' }}>
          <div style={{ padding:'9px 13px', borderBottom:`1px solid ${C.bdr}`, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:11.5, fontWeight:600, color:C.txt }}>Atletas recientes</span>
            <span style={{ fontSize:10.5, color:ACCENT, fontWeight:500 }}>Ver todos →</span>
          </div>
          {[{i:'VR',n:'Valentina Rojas',t:'Avanzado',b:'Activo',bc:'#22C55E'},{i:'SM',n:'Sebastián M.',t:'Intermedio',b:'Activo',bc:'#22C55E'},{i:'NH',n:'Nicolás Herrera',t:'Avanzado',b:'Riesgo alto',bc:'#EF4444'}].map(a=>(
            <div key={a.i} style={{ padding:'8px 13px', display:'flex', alignItems:'center', gap:9, borderBottom:`1px solid ${C.bdr}` }}>
              <div style={{ width:26,height:26,borderRadius:'50%',background:`${ACCENT}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9.5,fontWeight:700,color:ACCENT,flexShrink:0 }}>{a.i}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:11.5, fontWeight:600, color:C.txt }}>{a.n}</p>
                <p style={{ fontSize:10, color:C.txt3 }}>{a.t}</p>
              </div>
              <span style={{ fontSize:10, fontWeight:600, color:a.bc, background:`${a.bc}15`, padding:'2px 7px', borderRadius:4 }}>{a.b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RutinasBuilder({ C, isDark }: { C: Cv; isDark: boolean }) {
  void isDark
  return (
    <div style={{ padding:'20px' }}>
      <div style={{ background:C.surf2, borderRadius:12, border:`1px solid ${C.bdr}`, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.bdr}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:C.txt }}>Fuerza Base — 12 semanas</p>
            <p style={{ fontSize:11, color:C.txt3, marginTop:2 }}>6 bloques · 47 atletas asignados</p>
          </div>
          <div style={{ padding:'5px 10px', borderRadius:6, background:`${ACCENT}18`, border:`1px solid ${ACCENT}30`, fontSize:11, fontWeight:700, color:ACCENT }}>Publicado</div>
        </div>
        {[
          {block:'BLOQUE A — Fuerza',color:ACCENT,exs:[{n:'Back Squat',s:'4×6 · 80% 1RM',tag:'Principal'},{n:'Romanian Deadlift',s:'3×8 · 65%',tag:''}]},
          {block:'BLOQUE B — Hipertrofia',color:VIOLET,exs:[{n:'Bench Press',s:'4×10 · 70%',tag:'Superserie'},{n:'DB Row',s:'4×10/lado',tag:'Superserie'}]},
          {block:'BLOQUE C — Finisher',color:'#06B6D4',exs:[{n:'Box Jumps',s:'3×12',tag:''},{n:'KB Swings',s:'3×15 · 24kg',tag:''}]},
        ].map(b=>(
          <div key={b.block} style={{ padding:'12px 16px', borderBottom:`1px solid ${C.bdr}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
              <div style={{ width:3,height:12,borderRadius:2,background:b.color }}/>
              <p style={{ fontSize:9, fontWeight:700, color:C.txt3, textTransform:'uppercase', letterSpacing:'0.08em' }}>{b.block}</p>
            </div>
            {b.exs.map(ex=>(
              <div key={ex.n} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, padding:'7px 11px', background:C.surf, borderRadius:7, border:`1px solid ${C.bdr}` }}>
                <div style={{ width:5,height:5,borderRadius:'50%',background:b.color,opacity:.6,flexShrink:0 }}/>
                <p style={{ fontSize:12.5, color:C.txt, fontWeight:500, flex:1 }}>{ex.n}</p>
                <span style={{ fontSize:11, color:C.txt3 }}>{ex.s}</span>
                {ex.tag && <span style={{ fontSize:9.5, fontWeight:600, color:b.color, background:`${b.color}15`, padding:'2px 6px', borderRadius:4 }}>{ex.tag}</span>}
              </div>
            ))}
          </div>
        ))}
        <div style={{ padding:'10px 16px', display:'flex', gap:8 }}>
          <span style={{ fontSize:12, color:ACCENT, fontWeight:500 }}>+ Agregar bloque</span>
          <span style={{ fontSize:12, color:C.txt3 }}>· 808 ejercicios disponibles</span>
        </div>
      </div>
    </div>
  )
}

function MetricasPanel({ C }: { C: Cv }) {
  return (
    <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.bdr}`, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <p style={{ fontSize:13, fontWeight:700, color:C.txt }}>Dashboard de retención</p>
        <span style={{ fontSize:10.5, color:'#22C55E', fontWeight:600 }}>● Tiempo real</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {[{l:'Retención',v:'94%',c:'#22C55E',sub:'+2% este mes'},{l:'Cumplimiento',v:'87%',c:ACCENT,sub:'Promedio semanal'},{l:'En riesgo',v:'3',c:'#EF4444',sub:'Requieren contacto'}].map(k=>(
          <div key={k.l} style={{ background:C.surf2, border:`1px solid ${C.bdr}`, borderRadius:9, padding:'10px 12px' }}>
            <p style={{ fontSize:9, color:C.txt3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{k.l}</p>
            <p style={{ fontSize:22, fontWeight:700, color:k.c, letterSpacing:'-0.04em', lineHeight:1, marginBottom:3 }}>{k.v}</p>
            <p style={{ fontSize:9.5, color:C.txt3 }}>{k.sub}</p>
          </div>
        ))}
      </div>
      <div style={{ background:C.surf2, border:`1px solid ${C.bdr}`, borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'9px 14px', borderBottom:`1px solid ${C.bdr}` }}>
          <p style={{ fontSize:10, fontWeight:700, color:C.txt }}>Riesgo de abandono</p>
        </div>
        {[{n:'Nicolás H.',dias:'14 días sin asistir',l:'Alto',c:'#EF4444',p:82},{n:'Catalina C.',dias:'7 días sin asistir',l:'Medio',c:'#F59E0B',p:51},{n:'Diego F.',dias:'3 días sin asistir',l:'Bajo',c:'#22C55E',p:18},{n:'Valentina R.',dias:'Asistencia perfecta',l:'Activo',c:'#22C55E',p:5}].map(a=>(
          <div key={a.n} style={{ padding:'9px 14px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${C.bdr}` }}>
            <div style={{ width:26,height:26,borderRadius:'50%',background:`${ACCENT}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:ACCENT,flexShrink:0 }}>{a.n.split(' ').map((x:string)=>x[0]).join('')}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:600, color:C.txt }}>{a.n}</p>
              <p style={{ fontSize:10, color:C.txt3 }}>{a.dias}</p>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:a.c, background:`${a.c}15`, padding:'2px 8px', borderRadius:5, flexShrink:0 }}>{a.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AtletasView({ C }: { C: Cv }) {
  return (
    <div style={{ background:C.surf, borderRadius:10, border:`1px solid ${C.bdr}`, overflow:'hidden', width:'100%' }}>
      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.bdr}`, display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:12.5, fontWeight:600, color:C.txt }}>Atletas — 47 activos</span>
        <span style={{ fontSize:10.5, color:'#22C55E', fontWeight:600 }}>● En vivo</span>
      </div>
      {[{i:'VR',n:'Valentina Rojas',t:'CrossFit · Avanzado',b:'Activo',bc:'#22C55E'},{i:'SM',n:'Sebastián Morales',t:'CrossFit · Intermedio',b:'Activo',bc:'#22C55E'},{i:'NH',n:'Nicolás Herrera',t:'CrossFit · Avanzado',b:'Riesgo alto',bc:'#EF4444'},{i:'CT',n:'Camila Torres',t:'Hyrox · Principiante',b:'Activo',bc:'#22C55E'}].map(a=>(
        <div key={a.i} style={{ padding:'9px 14px', display:'flex', alignItems:'center', gap:9, borderBottom:`1px solid ${C.bdr}` }}>
          <div style={{ width:28,height:28,borderRadius:'50%',background:`${ACCENT}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9.5,fontWeight:700,color:ACCENT,flexShrink:0 }}>{a.i}</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:12, fontWeight:600, color:C.txt }}>{a.n}</p>
            <p style={{ fontSize:10.5, color:C.txt3 }}>{a.t}</p>
          </div>
          <span style={{ fontSize:10.5, fontWeight:600, color:a.bc, background:`${a.bc}15`, padding:'2px 7px', borderRadius:5 }}>{a.b}</span>
        </div>
      ))}
    </div>
  )
}

function RutinasView({ C }: { C: Cv }) {
  return (
    <div style={{ background:C.surf, borderRadius:10, border:`1px solid ${C.bdr}`, overflow:'hidden', width:'100%' }}>
      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.bdr}` }}>
        <p style={{ fontSize:12.5, fontWeight:600, color:C.txt }}>Fuerza Base — Semana 1</p>
        <p style={{ fontSize:10.5, color:C.txt3, marginTop:2 }}>4 bloques · 6 ejercicios</p>
      </div>
      {[{block:'BLOQUE 1',color:ACCENT,exs:['Back Squat  3×10 · 70% 1RM','Romanian DL  3×8 · 65%']},{block:'BLOQUE 2',color:VIOLET,exs:['Bench Press  4×8 · 75%','DB Row  4×10 por lado']}].map(b=>(
        <div key={b.block} style={{ padding:'10px 14px', borderBottom:`1px solid ${C.bdr}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
            <div style={{ width:3,height:11,borderRadius:2,background:b.color }}/>
            <p style={{ fontSize:8.5, fontWeight:700, color:C.txt3, textTransform:'uppercase', letterSpacing:'0.08em' }}>{b.block}</p>
          </div>
          {b.exs.map(ex=>(
            <div key={ex} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4, padding:'5px 9px', background:C.surf2, borderRadius:5 }}>
              <div style={{ width:3,height:3,borderRadius:'50%',background:b.color,opacity:.5,flexShrink:0 }}/>
              <p style={{ fontSize:11.5, color:C.txt2 }}>{ex}</p>
            </div>
          ))}
        </div>
      ))}
      <div style={{ padding:'9px 14px' }}><span style={{ fontSize:12, color:ACCENT, fontWeight:500 }}>+ Agregar bloque</span></div>
    </div>
  )
}

function WODView({ C }: { C: Cv }) {
  return (
    <div style={{ background:C.surf, borderRadius:10, border:`1px solid ${C.bdr}`, overflow:'hidden', width:'100%' }}>
      <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.bdr}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12.5, fontWeight:600, color:C.txt }}>WOD del día</span>
        <span style={{ fontSize:10.5, fontWeight:700, color:ACCENT, background:`${ACCENT}15`, padding:'2px 9px', borderRadius:999 }}>AMRAP</span>
      </div>
      <div style={{ padding:'18px 16px', textAlign:'center' }}>
        <div style={{ fontSize:48, fontWeight:700, color:C.txt, letterSpacing:'-0.05em', lineHeight:1, marginBottom:3, fontVariantNumeric:'tabular-nums' }}>20:00</div>
        <p style={{ fontSize:10.5, color:C.txt3, marginBottom:14 }}>AMRAP · 20 minutos</p>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
          {['21 Thrusters (95/65 lb)','15 Pull-ups','9 Box Jumps (24/20")'].map(e=>(
            <div key={e} style={{ padding:'7px 12px', borderRadius:7, background:C.surf2, border:`1px solid ${C.bdr}`, textAlign:'left' }}>
              <p style={{ fontSize:12, color:C.txt2 }}>{e}</p>
            </div>
          ))}
        </div>
        <div style={{ padding:'10px', borderRadius:8, background:`linear-gradient(135deg,${ACCENT},${VIOLET})`, fontSize:12.5, fontWeight:600, color:'#fff' }}>▶ Iniciar timer</div>
      </div>
    </div>
  )
}

function MetricasView({ C }: { C: Cv }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7, width:'100%' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
        {[{l:'Atletas activos',v:'47',c:C.txt},{l:'Cumplimiento',v:'94%',c:'#22C55E'},{l:'Sesiones/sem',v:'21',c:C.txt},{l:'En riesgo',v:'3',c:'#EF4444'}].map(k=>(
          <div key={k.l} style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:9, padding:'10px 13px' }}>
            <p style={{ fontSize:9, color:C.txt3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>{k.l}</p>
            <p style={{ fontSize:22, fontWeight:700, color:k.c, letterSpacing:'-0.04em', lineHeight:1 }}>{k.v}</p>
          </div>
        ))}
      </div>
      <div style={{ background:C.surf, border:`1px solid ${C.bdr}`, borderRadius:9, overflow:'hidden' }}>
        <div style={{ padding:'8px 13px', borderBottom:`1px solid ${C.bdr}` }}>
          <p style={{ fontSize:9, fontWeight:600, color:C.txt3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Riesgo de abandono</p>
        </div>
        {[{n:'Nicolás H.',l:'Alto',c:'#EF4444',p:82},{n:'Catalina C.',l:'Medio',c:'#F59E0B',p:51},{n:'Diego F.',l:'Bajo',c:'#22C55E',p:18}].map(a=>(
          <div key={a.n} style={{ padding:'8px 13px', display:'flex', alignItems:'center', gap:9, borderBottom:`1px solid ${C.bdr}` }}>
            <p style={{ fontSize:11.5, fontWeight:500, color:C.txt, width:68, flexShrink:0 }}>{a.n}</p>
            <div style={{ flex:1, height:4, background:C.bdr, borderRadius:999 }}>
              <div style={{ width:`${a.p}%`, height:'100%', background:a.c, borderRadius:999 }}/>
            </div>
            <span style={{ fontSize:10, fontWeight:600, color:a.c, width:40, textAlign:'right', flexShrink:0 }}>{a.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EngagementFeed() {
  return (
    <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Actividad reciente</p>
      {[
        { i:'VR', name:'Valentina R.', event:'Nuevo PR — Back Squat 95 kg', time:'Hace 5 min', tc:LIME },
        { i:'NH', name:'Nicolás H.',   event:'Sin actividad por 14 días — en riesgo', time:'Alerta hoy', tc:'#EF4444' },
        { i:'SM', name:'Sebastián M.', event:'Completó el WOD de hoy',      time:'Hace 1h',   tc:'#22C55E' },
        { i:'CT', name:'Camila T.',    event:'3 semanas seguidas asistiendo',time:'Hito',      tc:'#818CF8' },
        { i:'DF', name:'Diego F.',     event:'Completó el WOD de hoy',      time:'Hace 2h',   tc:'#22C55E' },
      ].map(a => (
        <div key={a.i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width:28,height:28,borderRadius:'50%',background:ACCENT,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9.5,fontWeight:700,color:'#fff',flexShrink:0 }}>{a.i}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.82)', marginBottom:2 }}>{a.name}</p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.38)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.event}</p>
          </div>
          <span style={{ fontSize:9.5, color:a.tc, fontWeight:600, flexShrink:0 }}>{a.time}</span>
        </div>
      ))}
    </div>
  )
}
