'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react'

type Mode = 'countdown' | 'stopwatch' | 'interval'
type Phase = 'work' | 'rest'
type TimerState = 'idle' | 'running' | 'paused' | 'finished'

function beep(frequency = 880, duration = 0.08, volume = 0.4) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
    setTimeout(() => ctx.close(), 500)
  } catch {}
}

function tripleBeep() {
  beep(880, 0.08, 0.5)
  setTimeout(() => beep(880, 0.08, 0.5), 200)
  setTimeout(() => beep(1320, 0.3, 0.6), 400)
}

function pad(n: number) { return String(n).padStart(2, '0') }
function formatTime(s: number) {
  if (s < 0) s = 0
  const m = Math.floor(s / 60)
  return `${pad(m)}:${pad(s % 60)}`
}

function NumberInput({ label, value, onChange, min = 0, max = 99 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, width: 40, height: 36, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronUp size={18} />
      </button>
      <input
        type="number"
        value={value}
        onChange={e => {
          const v = parseInt(e.target.value) || 0
          onChange(Math.max(min, Math.min(max, v)))
        }}
        style={{
          width: 72, textAlign: 'center', background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
          color: '#fff', fontSize: 28, fontWeight: 700, padding: '8px 0',
          outline: 'none', fontVariantNumeric: 'tabular-nums',
          fontFamily: '"SF Mono", "Fira Code", monospace',
        }}
      />
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, width: 40, height: 36, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronDown size={18} />
      </button>
    </div>
  )
}

export function TimerView() {
  const [mode, setMode] = useState<Mode>('countdown')
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [muted, setMuted] = useState(false)

  // Config
  const [cdMins, setCdMins] = useState(5)
  const [cdSecs, setCdSecs] = useState(0)
  const [workSecs, setWorkSecs] = useState(40)
  const [restSecs, setRestSecs] = useState(20)
  const [totalRounds, setTotalRounds] = useState(8)

  // Runtime
  const [elapsed, setElapsed] = useState(0)
  const [phaseTime, setPhaseTime] = useState(0)
  const [phase, setPhase] = useState<Phase>('work')
  const [currentRound, setCurrentRound] = useState(1)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const soundRef = useRef(muted)
  soundRef.current = muted

  const countdownTotal = cdMins * 60 + cdSecs

  // Derived display
  let displayTime = 0
  let phaseLabel = ''
  let progressPct = 0

  if (mode === 'countdown') {
    displayTime = Math.max(0, countdownTotal - elapsed)
    progressPct = countdownTotal > 0 ? ((countdownTotal - displayTime) / countdownTotal) * 100 : 0
  } else if (mode === 'stopwatch') {
    displayTime = elapsed
  } else {
    const phaseDuration = phase === 'work' ? workSecs : restSecs
    displayTime = Math.max(0, phaseDuration - phaseTime)
    phaseLabel = phase === 'work' ? 'TRABAJO' : 'DESCANSO'
    progressPct = phaseDuration > 0 ? (phaseTime / phaseDuration) * 100 : 0
  }

  // Warning: <= 30s remaining on countdown / interval
  const warningTime = mode === 'countdown' ? displayTime : mode === 'interval' ? displayTime : Infinity
  const isWarning = warningTime <= 10 && warningTime > 0 && timerState === 'running'
  const isFinished = timerState === 'finished'
  const timerColor = isFinished ? '#EF4444' : isWarning ? '#F97316' : '#fff'

  const tick = useCallback(() => {
    setElapsed(prev => {
      const next = prev + 1

      if (mode === 'countdown' && next >= countdownTotal) {
        if (!soundRef.current) tripleBeep()
        setTimerState('finished')
        return countdownTotal
      }

      return next
    })

    if (mode === 'interval') {
      setPhaseTime(prev => {
        const phaseDuration = phase === 'work' ? workSecs : restSecs
        const next = prev + 1

        if (next >= phaseDuration) {
          const nextPhase: Phase = phase === 'work' ? 'rest' : 'work'
          if (nextPhase === 'work') {
            setCurrentRound(r => {
              const nr = r + 1
              if (nr > totalRounds) {
                if (!soundRef.current) tripleBeep()
                setTimerState('finished')
                return r
              }
              if (!soundRef.current) beep(660, 0.15, 0.5)
              return nr
            })
          } else {
            if (!soundRef.current) beep(440, 0.12, 0.4)
          }
          setPhase(nextPhase)
          return 0
        }

        const remaining = phaseDuration - next
        if (remaining <= 3 && remaining > 0 && !soundRef.current) beep(440, 0.05, 0.3)
        return next
      })
    }
  }, [mode, countdownTotal, phase, workSecs, restSecs, totalRounds])

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerState, tick])

  // Keyboard shortcuts
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (timerState === 'running') setTimerState('paused')
        else if (!isFinished) start()
      }
      if (e.code === 'KeyR') { e.preventDefault(); reset() }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [timerState, isFinished])

  function start() {
    if (mode === 'countdown' && countdownTotal === 0) return
    if (timerState === 'idle' && !muted) beep(880, 0.15, 0.5)
    setTimerState('running')
  }

  function reset() {
    setTimerState('idle')
    setElapsed(0)
    setPhaseTime(0)
    setPhase('work')
    setCurrentRound(1)
  }

  const showConfig = timerState === 'idle'

  return (
    <div style={{
      position: 'fixed',
      // On desktop: offset by sidebar width; on mobile: full screen via CSS
      top: 0, right: 0, bottom: 0,
      left: 'var(--sidebar-width)',
      zIndex: 100,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
    }}
      className="eb-timer-fullscreen"
    >
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none' as any }}>
          {(['countdown', 'stopwatch', 'interval'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); reset() }}
              disabled={timerState === 'running'}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', flexShrink: 0,
                fontSize: 12, fontWeight: 700, cursor: timerState === 'running' ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                background: mode === m ? '#fff' : 'rgba(255,255,255,0.08)',
                color: mode === m ? '#000' : 'rgba(255,255,255,0.5)',
                opacity: timerState === 'running' && mode !== m ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
            >
              {m === 'countdown' ? 'Regresiva' : m === 'stopwatch' ? 'Cronómetro' : 'Intervalos'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMuted(m => !m)}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>

        {/* Config panel — only on idle */}
        {showConfig && (
          <div style={{
            display: 'flex', gap: 32, alignItems: 'flex-end', marginBottom: 48,
            padding: '24px 32px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
          }}>
            {mode === 'countdown' && (
              <>
                <NumberInput label="Minutos" value={cdMins} onChange={setCdMins} min={0} max={99} />
                <div style={{ fontSize: 36, fontWeight: 700, color: 'rgba(255,255,255,0.3)', paddingBottom: 12 }}>:</div>
                <NumberInput label="Segundos" value={cdSecs} onChange={setCdSecs} min={0} max={59} />
              </>
            )}

            {mode === 'stopwatch' && (
              <div style={{ textAlign: 'center', padding: '8px 16px' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  El cronómetro contará hacia arriba sin límite.
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                  Presiona espacio o el botón para iniciar.
                </p>
              </div>
            )}

            {mode === 'interval' && (
              <>
                <NumberInput label="Trabajo (s)" value={workSecs} onChange={setWorkSecs} min={1} max={300} />
                <NumberInput label="Descanso (s)" value={restSecs} onChange={setRestSecs} min={0} max={300} />
                <NumberInput label="Rondas" value={totalRounds} onChange={setTotalRounds} min={1} max={99} />
              </>
            )}
          </div>
        )}

        {/* Phase / round label */}
        {!showConfig && (
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const,
            color: mode === 'interval'
              ? (phase === 'work' ? '#F97316' : '#60A5FA')
              : 'rgba(255,255,255,0.35)',
            marginBottom: 12, minHeight: 20, textAlign: 'center',
          }}>
            {isFinished ? '¡TIEMPO!' : mode === 'interval'
              ? `${phaseLabel}  ·  Ronda ${currentRound}/${totalRounds}`
              : mode === 'countdown'
              ? 'CUENTA REGRESIVA'
              : 'CRONÓMETRO'
            }
          </div>
        )}

        {showConfig && mode === 'interval' && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            {workSecs}s trabajo · {restSecs}s descanso · {totalRounds} rondas
          </div>
        )}

        {/* Big timer */}
        <div style={{
          fontSize: 'clamp(80px, 18vw, 160px)',
          fontWeight: 800,
          color: timerColor,
          letterSpacing: '-0.06em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.4s',
          textAlign: 'center',
          fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
          animation: isWarning ? 'timer-pulse 1s ease-in-out infinite' : 'none',
        }}>
          {formatTime(displayTime)}
        </div>

        {/* Progress bar */}
        {progressPct > 0 && !showConfig && (
          <div style={{ width: '100%', maxWidth: 480, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 28, overflow: 'hidden', padding: '0 40px', boxSizing: 'border-box' as const }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: isWarning ? '#F97316' : 'rgba(255,255,255,0.5)',
              width: `${progressPct}%`,
              transition: 'width 1s linear, background 0.4s',
            }} />
          </div>
        )}

        {/* Elapsed total for interval mode */}
        {mode === 'interval' && !showConfig && (
          <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
            TOTAL {formatTime(elapsed)}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 20, marginTop: 40, alignItems: 'center' }}>
          <button
            onClick={reset}
            style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          >
            <RotateCcw size={22} />
          </button>

          <button
            onClick={timerState === 'running' ? () => setTimerState('paused') : start}
            disabled={isFinished || (mode === 'countdown' && countdownTotal === 0 && timerState === 'idle')}
            style={{
              width: 88, height: 88, borderRadius: '50%',
              background: isFinished
                ? 'rgba(255,255,255,0.05)'
                : timerState === 'running'
                ? 'rgba(255,255,255,0.15)'
                : '#fff',
              border: 'none',
              cursor: isFinished ? 'not-allowed' : 'pointer',
              color: timerState === 'running' ? '#fff' : '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isFinished || timerState === 'running'
                ? 'none'
                : '0 0 0 14px rgba(255,255,255,0.06), 0 8px 32px rgba(255,255,255,0.15)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!isFinished) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
          >
            {timerState === 'running'
              ? <Pause size={34} fill="white" />
              : <Play size={34} fill={isFinished ? 'rgba(255,255,255,0.3)' : '#000'} style={{ marginLeft: 4 }} />
            }
          </button>

          {/* Spacer para centrar */}
          <div style={{ width: 54 }} />
        </div>

        {timerState === 'idle' && (
          <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
            ESPACIO para iniciar · R para reiniciar
          </p>
        )}
        {timerState === 'paused' && (
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
            PAUSADO · Espacio para continuar
          </p>
        )}
      </div>
    </div>
  )
}
