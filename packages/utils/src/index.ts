// ============================================
// ENTRE BARRAS — Shared Utilities
// ============================================

import type { WodType, SessionStatus, AthleteStatus, SportLevel } from '@entrebarras/types'

// --- Class merging ---
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// --- Date helpers ---
export function formatDate(date: string | Date, locale = 'es-CL'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(date: string | Date, locale = 'es-CL'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  })
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function daysAgo(date: string | null): number | null {
  if (!date) return null
  const diff = Date.now() - new Date(date).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// --- Name helpers ---
export function fullName(first: string, last: string): string {
  return `${first} ${last}`
}

export function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

// --- WOD helpers ---
export const WOD_TYPE_LABELS: Record<WodType, string> = {
  amrap: 'AMRAP',
  emom: 'EMOM',
  for_time: 'For Time',
  tabata: 'Tabata',
  chipper: 'Chipper',
  intervals: 'Intervalos',
  custom: 'Personalizado',
}

export function getWodTypeLabel(type: WodType): string {
  return WOD_TYPE_LABELS[type]
}

// --- Status labels ---
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Programado',
  started: 'En progreso',
  completed: 'Completado',
  skipped: 'Omitido',
}

export const ATHLETE_STATUS_LABELS: Record<AthleteStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  prospect: 'Prospecto',
}

export const SPORT_LEVEL_LABELS: Record<SportLevel, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  competitive: 'Competitivo',
}

// --- Number helpers ---
export function formatWeight(kg: number | null): string {
  if (kg === null) return '—'
  return `${kg} kg`
}

export function calculateBMI(weight_kg: number, height_cm: number): number {
  const h = height_cm / 100
  return Math.round((weight_kg / (h * h)) * 10) / 10
}

// --- Compliance helpers ---
export function getChurnRisk(daysSinceLastWorkout: number | null): 'high' | 'medium' | 'low' | 'none' {
  if (daysSinceLastWorkout === null) return 'none'
  if (daysSinceLastWorkout >= 14) return 'high'
  if (daysSinceLastWorkout >= 7) return 'medium'
  if (daysSinceLastWorkout >= 4) return 'low'
  return 'none'
}

export function getCompliancePercent(completed: number, scheduled: number): number {
  if (scheduled === 0) return 0
  return Math.round((completed / scheduled) * 100)
}
