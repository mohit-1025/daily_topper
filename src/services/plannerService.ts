import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns'
import type {
  ExamModeState,
  QuizAttempt,
  Settings,
  StudySlot,
  Subject,
  Topic,
} from '@/types'
import { uid, todayISO } from '@/lib/utils'

export interface PlannerInput {
  subjects: Subject[]
  topics: Topic[]
  settings: Settings
  examMode: ExamModeState
  attempts: QuizAttempt[]
  backlogTopicIds?: string[]
  days?: number
  now?: Date
  busySlots?: Pick<StudySlot, 'date' | 'start' | 'duration'>[]
}

export interface TopicPerformance {
  topicId: string
  topicName: string
  correct: number
  total: number
  accuracy: number
}

const DIFFICULTY_BONUS = { easy: 0.2, medium: 0.5, hard: 0.9 }
const START_HOURS: Record<Settings['preferredStudyTime'], number> = {
  morning: 7,
  afternoon: 13,
  evening: 17,
  night: 20,
}

export function slotEndMinutes(slot: Pick<StudySlot, 'start' | 'duration'>) {
  const [h, m] = slot.start.split(':').map(Number)
  return (h || 0) * 60 + (m || 0) + slot.duration
}

export function computeTopicPerformance(attempts: QuizAttempt[]): TopicPerformance[] {
  const map = new Map<string, TopicPerformance>()
  for (const attempt of attempts) {
    for (const stat of attempt.perTopic) {
      const entry = map.get(stat.topicId) ?? {
        topicId: stat.topicId,
        topicName: stat.topicName,
        correct: 0,
        total: 0,
        accuracy: 0,
      }
      entry.correct += stat.correct
      entry.total += stat.total
      entry.topicName = stat.topicName
      map.set(stat.topicId, entry)
    }
  }
  return [...map.values()].map((entry) => ({
    ...entry,
    accuracy: entry.total ? Math.round((entry.correct / entry.total) * 100) : 0,
  }))
}

export function subjectAccuracy(
  subjectId: string,
  topics: Topic[],
  performance: TopicPerformance[],
) {
  const ids = new Set(topics.filter((t) => t.subjectId === subjectId).map((t) => t.id))
  let correct = 0
  let total = 0
  for (const stat of performance) {
    if (ids.has(stat.topicId)) {
      correct += stat.correct
      total += stat.total
    }
  }
  return total ? Math.round((correct / total) * 100) : null
}

export function computeStreak(slots: StudySlot[], now = new Date()) {
  const doneDays = new Set(slots.filter((s) => s.status === 'done').map((s) => s.date))
  let cursor = startOfDay(now)
  if (!doneDays.has(format(cursor, 'yyyy-MM-dd'))) cursor = addDays(cursor, -1)
  let current = 0
  while (doneDays.has(format(cursor, 'yyyy-MM-dd'))) {
    current++
    cursor = addDays(cursor, -1)
  }
  const sorted = [...doneDays].sort()
  let best = 0
  let run = 0
  let previous: Date | null = null
  for (const day of sorted) {
    const date = parseISO(day)
    run = previous && differenceInCalendarDays(date, previous) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    previous = date
  }
  return { current, best, doneDays: sorted }
}

export function missedSlots(slots: StudySlot[], now = new Date()): StudySlot[] {
  const today = todayISO(now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return slots.filter((slot) => {
    if (slot.status !== 'scheduled') return false
    if (slot.date < today) return true
    return slot.date === today && slotEndMinutes(slot) < nowMinutes
  })
}

function nextStartMinutes(minutes: number) {
  return Math.ceil(minutes / 5) * 5
}

function daysUntil(dateISO: string, now: Date) {
  return differenceInCalendarDays(parseISO(dateISO), startOfDay(now))
}

interface ExamTopic {
  topicId: string
  name: string
  covered: boolean
  examDate: string
}

export function generatePlan(input: PlannerInput): StudySlot[] {
  const now = input.now ?? new Date()
  const {
    subjects,
    topics,
    settings,
    examMode,
    attempts,
    backlogTopicIds = [],
    days = 12,
    busySlots = [],
  } = input
  if (!subjects.length || !topics.length) return []

  const busyByDate = new Map<string, { start: number; end: number }[]>()
  busySlots.forEach((slot) => {
    const [hours, minutes] = slot.start.split(':').map(Number)
    const start = (hours || 0) * 60 + (minutes || 0)
    const list = busyByDate.get(slot.date) ?? []
    list.push({ start, end: start + slot.duration })
    busyByDate.set(slot.date, list)
  })

  const avoidBusy = (dateISO: string, from: number, duration: number) => {
    const busy = busyByDate.get(dateISO)
    if (!busy?.length) return from
    let start = from
    let guard = 0
    while (guard++ < 24) {
      const clash = busy.find((block) => start < block.end && start + duration > block.start)
      if (!clash) break
      start = nextStartMinutes(clash.end + 15)
    }
    return start
  }

  const performance = computeTopicPerformance(attempts)
  const backlog = new Set(backlogTopicIds)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const baseStart = START_HOURS[settings.preferredStudyTime] * 60
  const perDay = Math.max(1, Math.min(4, Math.round(settings.studyHours / (settings.slotLength / 60))))
  const topicsPerSlot = settings.slotLength <= 30 ? 1 : settings.slotLength >= 90 ? 3 : 2
  const daysToGenerate = Math.min(21, days)
  const today = todayISO(now)

  const examBySubject = new Map(
    examMode.active
      ? examMode.exams
          .filter((exam) => daysUntil(exam.date, now) >= 0)
          .map((exam) => [exam.subjectId, exam])
      : [],
  )

  const activeSubjects = examMode.active
    ? subjects.filter((subject) => examBySubject.has(subject.id))
    : subjects
  if (!activeSubjects.length) return []

  const topicNameToId = new Map<string, string>()
  topics.forEach((topic) => topicNameToId.set(topic.name.toLowerCase(), topic.id))

  function examTopicPool(subject: Subject): ExamTopic[] {
    const exam = examBySubject.get(subject.id)
    if (!exam) return []
    const resolved = exam.syllabusTopics
      .map((name) => {
        const id = topicNameToId.get(name.toLowerCase())
        return id ? topics.find((t) => t.id === id) : undefined
      })
      .filter((t): t is Topic => Boolean(t))
    const pool = resolved.length
      ? resolved
      : topics.filter((t) => t.subjectId === subject.id)
    return pool.map((t) => ({
      topicId: t.id,
      name: t.name,
      covered: t.status === 'covered',
      examDate: exam.date,
    }))
  }

  function subjectPriority(subject: Subject): number {
    const subjectTopics = topics.filter((t) => t.subjectId === subject.id)
    const pending = subjectTopics.filter((t) => t.status === 'pending')
    let score = (6 - subject.selfRating) * 1.15 + Math.min(2, pending.length * 0.35)
    const accuracy = subjectAccuracy(subject.id, topics, performance)
    if (accuracy !== null) score += Math.max(0, (90 - accuracy) / 25)
    const backlogCount = subjectTopics.filter((t) => backlog.has(t.id)).length
    score += Math.min(2.5, backlogCount * 0.6)
    const exam = examBySubject.get(subject.id)
    if (exam) {
      const until = daysUntil(exam.date, now)
      score += Math.max(0, 7 - until) * 0.9
      if (until <= 1) score += 3
    }
    const revisionDue = subjectTopics.filter(
      (t) =>
        t.status === 'covered' &&
        t.coveredAt &&
        differenceInCalendarDays(now, parseISO(t.coveredAt)) >= 3,
    ).length
    score += Math.min(1.5, revisionDue * 0.2)
    return score
  }

  const priorities = new Map(activeSubjects.map((subject) => [subject.id, subjectPriority(subject)]))
  const schedule: StudySlot[] = []
  const lastUsedTopicDay = new Map<string, string>()
  const lastUsedSubjectDay = new Map<string, string>()

  for (let dayIndex = 0; dayIndex < daysToGenerate; dayIndex++) {
    const date = addDays(now, dayIndex)
    const dateISO = format(date, 'yyyy-MM-dd')
    const isToday = dateISO === today
    const weekday = date.getDay()
    if (!examMode.active && weekday === settings.weeklyOffDay) continue

    const tomorrowExams = examMode.active
      ? examMode.exams.filter((exam) => daysUntil(exam.date, now) === dayIndex + 1)
      : []
    const daySubjectIds = tomorrowExams.length
      ? new Set(tomorrowExams.map((exam) => exam.subjectId))
      : null

    let start = isToday ? nextStartMinutes(Math.max(baseStart, nowMinutes + 15)) : baseStart
    let slotsToday = 0
    let lastSubjectId = ''
    const usedToday = new Set<string>()

    for (let slotIndex = 0; slotIndex < perDay; slotIndex++) {
      start = avoidBusy(dateISO, start, settings.slotLength)
      if (start + settings.slotLength > 23 * 60 + 45) break

      const candidates = activeSubjects
        .filter((subject) => !daySubjectIds || daySubjectIds.has(subject.id))
        .filter((subject) => {
          const exam = examBySubject.get(subject.id)
          if (exam && daysUntil(exam.date, now) === dayIndex) return false
          return true
        })
        .map((subject) => {
          let options: { topic: Topic; covered: boolean; repeatable: boolean }[] = []
          if (examMode.active) {
            options = examTopicPool(subject).map((t) => {
              const topic = topics.find((x) => x.id === t.topicId)!
              return { topic, covered: t.covered, repeatable: true }
            })
          } else {
            const subjectTopics = topics.filter((t) => t.subjectId === subject.id)
            const pending = subjectTopics
              .filter((t) => t.status === 'pending' && !usedToday.has(t.id))
              .sort((a, b) => DIFFICULTY_BONUS[b.difficulty] - DIFFICULTY_BONUS[a.difficulty])
            const revision = subjectTopics.filter(
              (t) =>
                t.status === 'covered' &&
                t.coveredAt &&
                differenceInCalendarDays(now, parseISO(t.coveredAt)) >= 2 &&
                !usedToday.has(t.id),
            )
            options = [...pending, ...revision].map((topic) => ({
              topic,
              covered: topic.status === 'covered',
              repeatable: false,
            }))
          }
          options = options.filter((option) => {
            const lastDay = lastUsedTopicDay.get(option.topic.id)
            if (!lastDay) return true
            return differenceInCalendarDays(parseISO(dateISO), parseISO(lastDay)) > 1
          })
          return { subject, options, score: priorities.get(subject.id) ?? 0 }
        })
        .filter((candidate) => candidate.options.length > 0)
        .sort((a, b) => b.score - a.score)

      if (!candidates.length) break
      // Keep every subject in rotation: prefer one that hasn't appeared in the
      // last two days, then fall back to raw priority.
      const rested = candidates.filter((candidate) => {
        const lastDay = lastUsedSubjectDay.get(candidate.subject.id)
        return !lastDay || differenceInCalendarDays(parseISO(dateISO), parseISO(lastDay)) > 1
      })
      let choice = (rested.length ? rested : candidates)[0]
      if (choice.subject.id === lastSubjectId && candidates.length > 1) {
        const alternate =
          candidates.find(
            (candidate) => candidate.subject.id !== lastSubjectId && rested.includes(candidate),
          ) ?? candidates.find((candidate) => candidate.subject.id !== lastSubjectId)
        if (alternate) choice = alternate
      }

      let picked = choice.options.slice(0, topicsPerSlot)
      if (
        daySubjectIds &&
        tomorrowExams[0] &&
        choice.subject.id === tomorrowExams[0].subjectId &&
        choice.options.length > topicsPerSlot
      ) {
        picked = choice.options.slice(0, topicsPerSlot)
      }
      const covered = picked.filter((p) => p.covered).length
      const source: StudySlot['source'] = examMode.active
        ? covered === picked.length
          ? 'revision'
          : 'exam'
        : covered === picked.length
          ? 'revision'
          : 'normal'

      schedule.push({
        id: uid('slot'),
        date: dateISO,
        start: format(setMinutes(setHours(date, Math.floor(start / 60)), start % 60), 'HH:mm'),
        duration: settings.slotLength,
        subjectId: choice.subject.id,
        topicIds: picked.map((p) => p.topic.id),
        status: 'scheduled',
        source,
      })

      picked.forEach((option) => {
        usedToday.add(option.topic.id)
        lastUsedTopicDay.set(option.topic.id, dateISO)
      })
      lastSubjectId = choice.subject.id
      lastUsedSubjectDay.set(choice.subject.id, dateISO)
      start += settings.slotLength + 15
      slotsToday++
      if (slotsToday >= perDay) break
    }
  }

  return schedule
}

export function isSlotToday(slot: StudySlot, now = new Date()) {
  return slot.date === todayISO(now)
}

export function slotsForDate(slots: StudySlot[], dateISO: string) {
  return slots
    .filter((slot) => slot.date === dateISO)
    .sort((a, b) => a.start.localeCompare(b.start))
}

export function studyMinutes(slots: StudySlot[]) {
  return slots.filter((s) => s.status === 'done').reduce((sum, slot) => sum + slot.duration, 0)
}

export function examDaysLeft(examDate: string, now = new Date()) {
  return differenceInCalendarDays(parseISO(examDate), startOfDay(now))
}
