'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveWodResult, SCALE_LABELS, SCALE_COLORS, formatResultTime } from '@/lib/queries/wod-results'

interface WodData {
  name: string
  type: string
  time_cap_s: number | null
  rounds: number | null
  work_s: number | null
  rest_s: number | null
  movements: { name: string; reps?: string | null; weight_kg?: number | null; distance_m?: number | null; calories?: number | null }[]
}

type Phase = 'work' | 'rest'
type State = 'idle' | 'running' | 'paused' | 'finished'

const TYPE_COLORS: Record<string, { accent: string; bg: string }> = {
  amrap:     { accent: '#3B82F6', bg: '#1E3A5F' },
  emom:      { accent: '#8B5CF6', bg: '#2D1B69' },
  for_time:  { accent: '#F97316', bg: '#431407' },
  tabata:    { accent: '#EC4899', bg: '#500724' },
  chipper:   { accent: '#10B981', bg: '#064E3B' },
  intervals: { accent: '#F59E0B', bg: '#451A03' },
  custom:    { accent: '#94A3B8', bg: '#1E293B' },
}

const TYPE_LABELS: Record<string, string> = {
  amrap: 'AMRAP', emom: 'EMOM', for_time: 'FOR TIME',
  tabata: 'TABATA', chipper: 'CHIPPER', intervals: 'INTERVALOS', custom: 'CUSTOM',
}

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
  const sec = s % 60
  return `${pad(m)}:${pad(sec)}`
}

export function WodTimer({ wod, wodId, athletes, onClose, onResultSaved }: {
  wod: WodData
  wodId?: string
  athletes?: { id: string; first_name: string; last_name: string }[]
  onClose: () => void
  onResultSaved?: () => void
}) {
  const tc = TYPE_COLORS[wod.type] ?? TYPE_COLORS.custom
  const typeLabel = TYPE_LABELS[wod.type] ?? wod.type.toUpperCase()

  // Timer config derived from WOD type
  const workDuration = wod.work_s ?? (wod.type === 'tabata' ? 20 : 60)
  const restDuration = wod.rest_s ?? (wod.type === 'tabata' ? 10 : 0)
  const totalRounds = wod.rounds ?? (wod.type === 'emom' ? 10 : wod.type === 'tabata' ? 8 : 1)
  const timeCap = wod.time_cap_s

  // Determine timer mode
  // countdown: AMRAP (counts down from time_cap), EMOM (counts down within each minute)
  // stopwatch: FOR_TIME, CHIPPER, CUSTOM (counts up)
  // interval: TABATA, INTERVALS (alternates work/rest phases)
  const isInterval = ['tabata', 'intervals'].includes(wod.type)
  const isEMOM = wod.type === 'emom'
  const isAMRAP = wod.type === 'amrap'
  const isStopwatch = ['for_time', 'chipper', 'custom'].includes(wod.type)

  // State
  const [timerState, setTimerState] = useState<State>('idle')
  const [elapsed, setElapsed] = useState(0)           // total elapsed seconds
  const [phase, setPhase] = useState<Phase>('work')
  const [phaseTime, setPhaseTime] = useState(0)       // seconds within current phase
  const [currentRound, setCurrentRound] = useState(1)
  const [muted, setMuted] = useState(false)
  const [done, setDone] = useState<Set<number>>(new Set())

  // Result logging
  const qc = useQueryClient()
  const [showResult, setShowResult] = useState(false)
  const [resultForm, setResultForm] = useState({
    athlete_id: athletes?.[0]?.id ?? '',
    scale: 'rx' as string,
    time_s: null as number | null,
    rounds: null as number | null,
    reps: null as number | null,
    notes: '',
  })
  const saveMutation = useMutation({
    mutationFn: saveWodResult,
    onSuccess: () => {
      if (wodId) qc.invalidateQueries({ queryKey: ['wod-results', wodId] })
      onResultSaved?.()
      setShowResult(false)
    },
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const soundRef = useRef(muted)
  soundRef.current = muted

  // Derived display values
  let displayTime = 0
  let phaseLabel = ''
  let progressPct = 0

  if (isAMRAP && timeCap) {
    displayTime = Math.max(0, timeCap - elapsed)
    phaseLabel = 'AMRAP'
    progressPct = ((timeCap - displayTime) / timeCap) * 100
  } else if (isEMOM) {
    displayTime = Math.max(0, 60 - phaseTime)
    phaseLabel = `MINUTO ${currentRound} / ${totalRounds}`
    progressPct = (phaseTime / 60) * 100
  } else if (isInterval) {
    const phaseDuration = phase === 'work' ? workDuration : restDuration
    displayTime = Math.max(0, phaseDuration - phaseTime)
    phaseLabel = phase === 'work' ? 'TRABAJO' : 'DESCANSO'
    progressPct = (phaseTime / phaseDuration) * 100
  } else {
    // stopwatch
    displayTime = elapsed
    phaseLabel = timeCap ? `Límite: ${formatTime(timeCap)}` : ''
    progressPct = timeCap ? Math.min(100, (elapsed / timeCap) * 100) : 0
  }

  const tick = useCallback(() => {
    setElapsed(prev => {
      const next = prev + 1

      // AMRAP: check time cap
      if (isAMRAP && timeCap && next >= timeCap) {
        if (!soundRef.current) tripleBeep()
        setTimerState('finished')
        return timeCap
      }

      // FOR TIME with cap: check cap
      if (isStopwatch && timeCap && next >= timeCap) {
        if (!soundRef.current) tripleBeep()
        setTimerState('finished')
        return timeCap
      }

      return next
    })

    if (isEMOM) {
      setPhaseTime(prev => {
        const next = prev + 1
        if (next >= 60) {
          // New minute
          setCurrentRound(r => {
            const newRound = r + 1
            if (newRound > totalRounds) {
              if (!soundRef.current) tripleBeep()
              setTimerState('finished')
            } else {
              if (!soundRef.current) beep(660, 0.15, 0.5)
            }
            return newRound > totalRounds ? r : newRound
          })
          return 0
        }
        if (next === 55 && !soundRef.current) beep(440, 0.05, 0.3) // 5s warning
        return next
      })
    }

    if (isInterval) {
      setPhaseTime(prev => {
        const phaseDuration = phase === 'work' ? workDuration : restDuration
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
        if (remaining === 3 && !soundRef.current) beep(440, 0.05, 0.3)
        if (remaining === 2 && !soundRef.current) beep(440, 0.05, 0.3)
        if (remaining === 1 && !soundRef.current) beep(440, 0.05, 0.3)
        return next
      })
    }
  }, [isAMRAP, isEMOM, isInterval, isStopwatch, timeCap, totalRounds, workDuration, restDuration, phase])

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerState, tick])

  function start() {
    if (timerState === 'idle' && !muted) beep(880, 0.15, 0.5)
    setTimerState('running')
  }

  function pause() { setTimerState('paused') }

  function reset() {
    setTimerState('idle')
    setElapsed(0)
    setPhase('work')
    setPhaseTime(0)
    setCurrentRound(1)
    setDone(new Set())
  }

  // Accent color based on phase
  const accentColor = isInterval && phase === 'rest' ? '#94A3B8' : tc.accent
  const isFinished = timerState === 'finished'

  // Warning: <= 30s remaining on countdown modes, or stopwatch approaching time cap
  const warningSeconds = isStopwatch && timeCap
    ? timeCap - elapsed
    : isAMRAP || isEMOM || isInterval
      ? displayTime
      : Infinity
  const isWarning = warningSeconds <= 10 && warningSeconds > 0 && timerState === 'running'
  const timerColor = isFinished ? '#EF4444' : isWarning ? '#F97316' : '#fff'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 28px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            {wod.name}
          </h2>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            padding: '3px 9px', borderRadius: 20,
            background: `${accentColor}33`, color: accentColor,
            border: `1px solid ${accentColor}55`,
          }}>
            {typeLabel}
          </span>
          {isInterval && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              Ronda {currentRound}/{totalRounds}
            </span>
          )}
          {isEMOM && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {totalRounds} min
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setMuted(m => !m)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main timer area */}
      <div style={{ flex: 1, display: 'flex', gap: 0 }}>

        {/* Timer center */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>

          {/* Phase label */}
          <div style={{
            fontSize: 14, fontWeight: 700, letterSpacing: '0.15em',
            color: accentColor, marginBottom: 16, minHeight: 20, textAlign: 'center',
          }}>
            {isFinished ? '¡TIEMPO!' : phaseLabel}
          </div>

          {/* Timer display */}
          <div style={{
            fontSize: 'clamp(80px, 16vw, 140px)',
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
          {progressPct > 0 && (
            <div style={{ width: '100%', maxWidth: 400, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 24, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: accentColor,
                width: `${progressPct}%`,
                transition: 'width 1s linear, background 0.3s',
              }} />
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', gap: 14, marginTop: 40, alignItems: 'center' }}>
            <button
              onClick={reset}
              style={{
                width: 50, height: 50, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              <RotateCcw size={20} />
            </button>

            {/* Play/Pause big button */}
            <button
              onClick={timerState === 'running' ? pause : start}
              disabled={isFinished}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: isFinished ? 'rgba(255,255,255,0.05)' : accentColor,
                border: 'none', cursor: isFinished ? 'not-allowed' : 'pointer',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isFinished ? 'none' : `0 0 0 12px ${accentColor}22, 0 8px 24px ${accentColor}44`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!isFinished) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            >
              {timerState === 'running'
                ? <Pause size={32} fill="white" />
                : <Play size={32} fill="white" style={{ marginLeft: 4 }} />
              }
            </button>

            {/* Elapsed time for non-stopwatch modes */}
            {!isStopwatch && (
              <div style={{ width: 50, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 2 }}>TOTAL</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(elapsed)}
                </span>
              </div>
            )}
          </div>

          {/* Keyboard shortcut hint */}
          {timerState === 'idle' && (
            <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
              Presiona espacio para iniciar
            </p>
          )}

          {/* Finished — save result */}
          {isFinished && wodId && !showResult && (
            <button
              onClick={() => {
                const autoTime = isStopwatch ? elapsed : (isAMRAP && timeCap ? timeCap : null)
                setResultForm(f => ({ ...f, time_s: autoTime, rounds: isAMRAP ? null : null }))
                setShowResult(true)
              }}
              style={{
                marginTop: 24,
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#10B981', color: '#fff', border: 'none',
                borderRadius: 12, padding: '12px 24px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 0 0 8px rgba(16,185,129,0.15)',
              }}
            >
              <CheckCircle size={18} />
              Guardar mi resultado
            </button>
          )}

          {isFinished && wodId && showResult && (
            <div style={{
              marginTop: 20, background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16, padding: '20px 24px', maxWidth: 380, width: '100%',
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Guardar resultado
              </p>

              {/* Scale */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {(['rx', 'scaled', 'foundations'] as const).map(s => {
                  const sc = SCALE_COLORS[s]
                  const active = resultForm.scale === s
                  return (
                    <button key={s} onClick={() => setResultForm(f => ({ ...f, scale: s }))}
                      style={{
                        flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: `1px solid ${active ? sc.border : 'rgba(255,255,255,0.15)'}`,
                        background: active ? sc.bg : 'rgba(255,255,255,0.06)',
                        color: active ? sc.text : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {SCALE_LABELS[s]}
                    </button>
                  )
                })}
              </div>

              {/* Result fields based on WOD type */}
              {(isStopwatch || isAMRAP) && (
                <div style={{ display: 'grid', gridTemplateColumns: isAMRAP ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 10 }}>
                  {isStopwatch && (
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 4 }}>TIEMPO (segundos)</label>
                      <input type="number" value={resultForm.time_s ?? ''} onChange={e => setResultForm(f => ({ ...f, time_s: e.target.value ? parseInt(e.target.value) : null }))}
                        placeholder={elapsed ? String(elapsed) : '0'}
                        style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 13, color: '#fff', boxSizing: 'border-box', outline: 'none' }}
                      />
                      {resultForm.time_s && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{formatResultTime(resultForm.time_s)}</p>}
                    </div>
                  )}
                  {isAMRAP && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 4 }}>RONDAS</label>
                        <input type="number" value={resultForm.rounds ?? ''} onChange={e => setResultForm(f => ({ ...f, rounds: e.target.value ? parseInt(e.target.value) : null }))}
                          style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 13, color: '#fff', boxSizing: 'border-box', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 4 }}>+ REPS</label>
                        <input type="number" value={resultForm.reps ?? ''} onChange={e => setResultForm(f => ({ ...f, reps: e.target.value ? parseInt(e.target.value) : null }))}
                          style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 13, color: '#fff', boxSizing: 'border-box', outline: 'none' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Athlete selector if multiple athletes */}
              {athletes && athletes.length > 1 && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 4 }}>ATLETA</label>
                  <select value={resultForm.athlete_id} onChange={e => setResultForm(f => ({ ...f, athlete_id: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 13, color: '#fff', boxSizing: 'border-box', outline: 'none' }}
                  >
                    {athletes.map(a => <option key={a.id} value={a.id} style={{ color: '#000' }}>{a.first_name} {a.last_name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 4 }}>NOTAS</label>
                <input value={resultForm.notes} onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Unbroken, primer Rx, etc."
                  style={{ width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 13, color: '#fff', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowResult(false)}
                  style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 500 }}>
                  Cancelar
                </button>
                <button
                  disabled={saveMutation.isPending}
                  onClick={() => {
                    if (!wodId) return
                    saveMutation.mutate({
                      wod_id: wodId,
                      athlete_id: resultForm.athlete_id || null,
                      scale: resultForm.scale,
                      time_s: resultForm.time_s,
                      rounds: resultForm.rounds,
                      reps: resultForm.reps,
                      notes: resultForm.notes || undefined,
                    })
                  }}
                  style={{ flex: 2, padding: '9px', background: '#10B981', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', cursor: saveMutation.isPending ? 'not-allowed' : 'pointer' }}>
                  {saveMutation.isPending ? 'Guardando...' : '✓ Guardar resultado'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Movements sidebar */}
        {wod.movements.length > 0 && (
          <div style={{
            width: 260, background: 'rgba(0,0,0,0.2)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            padding: '24px 20px', overflowY: 'auto', flexShrink: 0,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              MOVIMIENTOS
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wod.movements.map((mv, i) => {
                const isDone = done.has(i)
                const specs = [
                  mv.reps ? `${mv.reps} reps` : null,
                  mv.weight_kg ? `${mv.weight_kg} kg` : null,
                  mv.distance_m ? `${mv.distance_m} m` : null,
                  mv.calories ? `${mv.calories} cal` : null,
                ].filter(Boolean).join(' · ')

                return (
                  <button
                    key={i}
                    onClick={() => setDone(prev => {
                      const next = new Set(prev)
                      isDone ? next.delete(i) : next.add(i)
                      return next
                    })}
                    style={{
                      background: isDone ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 10, padding: '10px 12px',
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      border: `2px solid ${isDone ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
                      background: isDone ? '#10B981' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {isDone && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 600,
                        color: isDone ? 'rgba(255,255,255,0.4)' : '#fff',
                        textDecoration: isDone ? 'line-through' : 'none',
                        marginBottom: specs ? 2 : 0,
                        transition: 'all 0.15s',
                      }}>
                        {mv.name}
                      </p>
                      {specs && (
                        <p style={{ fontSize: 11.5, color: isDone ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)' }}>
                          {specs}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard listener */}
      <KeyboardShortcuts
        onSpace={() => timerState === 'running' ? pause() : (!isFinished && start())}
        onR={reset}
      />
    </div>
  )
}

function KeyboardShortcuts({ onSpace, onR }: { onSpace: () => void; onR: () => void }) {
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); onSpace() }
      if (e.code === 'KeyR') { e.preventDefault(); onR() }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onSpace, onR])
  return null
}
