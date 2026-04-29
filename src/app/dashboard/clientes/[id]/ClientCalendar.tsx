'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Client, Wod } from '@/lib/wod-types'
import { WOD_COLORS } from '@/lib/wod-types'

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return getLocalDateStr(d)
}

function formatWeekRange(mondayStr: string): string {
  const mon = new Date(mondayStr + 'T12:00:00')
  const sun = new Date(mondayStr + 'T12:00:00')
  sun.setDate(sun.getDate() + 6)
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${mon.getDate()} ${months[mon.getMonth()]} — ${sun.getDate()} ${months[sun.getMonth()]}`
}

function getLocalDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getThisMonday(): string {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return getLocalDateStr(d)
}

function isToday(dateStr: string): boolean {
  return dateStr === getLocalDateStr()
}

export default function ClientCalendar({
  client,
  initialWods,
}: {
  client: Client
  initialWods: Wod[]
  weekStart?: string
}) {
  const [currentMonday, setCurrentMonday] = useState(() => getThisMonday())
  const [wods] = useState<Wod[]>(initialWods)

  // Get dates for current week (Mon–Sun)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(currentMonday, i))

  // WODs indexed by date
  const wodsByDate: Record<string, Wod[]> = {}
  for (const wod of wods) {
    if (!wodsByDate[wod.scheduled_date]) wodsByDate[wod.scheduled_date] = []
    wodsByDate[wod.scheduled_date].push(wod)
  }

  function prevWeek() { setCurrentMonday(addDays(currentMonday, -7)) }
  function nextWeek() { setCurrentMonday(addDays(currentMonday, 7)) }

  return (
    <div className="space-y-4 pb-24">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevWeek}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#141414] border border-[#2A2A2A] text-[#AAA] hover:text-white transition-colors active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div className="text-center">
          <p className="text-white font-bold text-sm">{formatWeekRange(currentMonday)}</p>
          <p className="text-[#555] text-xs">Semana de entrenamiento</p>
        </div>

        <button
          onClick={nextWeek}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#141414] border border-[#2A2A2A] text-[#AAA] hover:text-white transition-colors active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Calendar days */}
      <div className="space-y-2">
        {weekDates.map((date, idx) => {
          const dayWods = wodsByDate[date] ?? []
          const today = isToday(date)

          return (
            <div
              key={date}
              className={`rounded-2xl border overflow-hidden ${
                today ? 'border-[#CC2B2B]/50 bg-[#CC2B2B]/5' : 'border-[#2A2A2A] bg-[#141414]'
              }`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex flex-col items-center justify-center ${
                    today ? 'bg-[#CC2B2B]' : 'bg-[#1E1E1E]'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase ${today ? 'text-white' : 'text-[#666]'}`}>
                      {DAY_LABELS[idx]}
                    </span>
                    <span className={`text-xs font-black leading-none ${today ? 'text-white' : 'text-[#AAA]'}`}>
                      {new Date(date + 'T12:00:00').getDate()}
                    </span>
                  </div>
                  {today && (
                    <span className="text-[10px] font-bold text-[#CC2B2B] uppercase tracking-wider">Hoy</span>
                  )}
                </div>

                {/* Add WOD button */}
                <Link
                  href={`/dashboard/clientes/${client.id}/wod/nuevo?fecha=${date}`}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1E1E1E] text-[#555] hover:text-[#CC2B2B] hover:bg-[#CC2B2B]/10 transition-colors active:scale-95"
                  aria-label={`Agregar WOD el ${date}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </Link>
              </div>

              {/* WODs for this day */}
              {dayWods.length > 0 && (
                <div className="px-3 pb-3 space-y-2">
                  {dayWods.map(wod => (
                    <WodCard key={wod.id} wod={wod} clientId={client.id} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WodCard({ wod, clientId }: { wod: Wod; clientId: string }) {
  const color = WOD_COLORS[wod.type] ?? '#666'
  const exerciseCount = wod.wod_exercises?.length ?? 0

  return (
    <Link
      href={`/dashboard/clientes/${clientId}/wod/${wod.id}`}
      className="flex items-center gap-3 bg-[#0A0A0A] rounded-xl p-3 active:scale-[0.99] transition-transform min-h-[56px]"
    >
      {/* Type badge */}
      <div
        className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
        style={{ backgroundColor: color + '20', color }}
      >
        {wod.type}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className="text-white font-bold text-sm truncate">{wod.title}</p>
        <p className="text-[#555] text-xs">
          {exerciseCount > 0 ? `${exerciseCount} ejercicio${exerciseCount !== 1 ? 's' : ''}` : 'Sin ejercicios'}
          {wod.duration_min ? ` · ${wod.duration_min} min` : ''}
          {wod.rounds ? ` · ${wod.rounds} rondas` : ''}
        </p>
      </div>

      {/* Completed badge */}
      {wod.completed ? (
        <span className="shrink-0 w-6 h-6 rounded-full bg-[#2BAF6A]/20 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2BAF6A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </Link>
  )
}
