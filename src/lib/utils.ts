import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { bn, enUS, hi, ta, te } from 'date-fns/locale'
import type { Language } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id') {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}

export function todayISO(date = new Date()) {
  return format(date, 'yyyy-MM-dd')
}

export function isoDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return todayISO(d)
}

export function isoDaysAhead(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

export function toDate(iso: string) {
  return parseISO(iso)
}

export function prettyDate(iso: string) {
  return format(parseISO(iso), 'EEE, d MMM')
}

const locales = { en: enUS, hi, ta, te, bn, mr: hi }

export function dateLocale(language: Language) {
  return locales[language] ?? enUS
}

export function longDate(date = new Date(), language: Language = 'en') {
  return format(date, 'EEEE, d MMMM yyyy', { locale: dateLocale(language) })
}

export function shortWeekday(dateISO: string, language: Language = 'en') {
  return format(parseISO(dateISO), 'EEE', { locale: dateLocale(language) })
}

export function weekdayShort(iso: string) {
  return format(parseISO(iso), 'EEE')
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function formatClock(totalSec: number) {
  const safe = Math.max(0, Math.round(totalSec))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function percent(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minutesToTime(total: number) {
  const h = Math.floor(total / 60) % 24
  const m = Math.round(total % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function addMinutesToTime(time: string, minutes: number) {
  return minutesToTime(timeToMinutes(time) + minutes)
}

export function greetingKey(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'dashboard.greetingMorning'
  if (h < 17) return 'dashboard.greetingAfternoon'
  if (h < 21) return 'dashboard.greetingEvening'
  return 'dashboard.greetingNight'
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function subjectColor(index: number) {
  const palette = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6']
  return palette[index % palette.length]
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function hashString(value: string) {
  let hash = 5381
  for (let i = 0; i < value.length; i++) hash = (hash * 33) ^ value.charCodeAt(i)
  return (hash >>> 0).toString(36)
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

export function downloadFile(name: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
