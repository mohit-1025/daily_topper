import { create } from 'zustand'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type {
  AppData,
  AppSession,
  Exam,
  GeneratedContent,
  GeneratedType,
  Language,
  Profile,
  QuizAttempt,
  RevisionSheet,
  Settings,
  Subject,
  ThemeId,
  Toast,
  ToastKind,
  Topic,
  Upload,
  UploadKind,
} from '@/types'
import { repo, localAuth, type SignUpResult } from '@/services/repository'
import { clerkDeleteUser, clerkEnabled, clerkSignOut } from '@/services/clerk'
import { aiService } from '@/services/aiService'
import {
  generatePlan,
  absorbBacklog,
  presetStudyWindow,
  roundClockToFive,
  slotEndMinutes,
} from '@/services/plannerService'
import { createSeedData, seedAssetBlobs } from '@/services/seed'
import { topicsForSubjectName } from '@/services/knowledge'
import { saveUploadFile, removeUploadFile, wipeUploadFiles } from '@/services/fileStore'
import { isoDaysAgo, subjectColor, todayISO, uid } from '@/lib/utils'
import { DEFAULT_THEME, isThemeId } from '@/lib/themes'

const GUEST_SESSION_KEY = 'dt-guest-session-v1'
const GUEST_DATA_KEY = 'dt-data-guest'
const THEME_KEY = 'dt-theme'

function initialTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') {
      const migrated: ThemeId = saved === 'dark' ? 'midnight' : 'paper'
      localStorage.setItem(THEME_KEY, migrated)
      return migrated
    }
    if (isThemeId(saved)) return saved
  } catch {
    /* storage blocked — use the default */
  }
  return DEFAULT_THEME
}

const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  studyHours: 4,
  preferredStudyTime: 'evening',
  studyStart: '17:00',
  studyEnd: '21:00',
  slotLength: 45,
  weeklyOffDay: 0,
  reminders: true,
  reminderTime: '19:30',
  sound: true,
}

function normalizeSettings(settings: Settings): Settings {
  const preset = presetStudyWindow(settings.preferredStudyTime)
  return {
    ...settings,
    studyStart: roundClockToFive(settings.studyStart || preset.start, preset.start),
    studyEnd: roundClockToFive(settings.studyEnd || preset.end, preset.end),
  }
}

function normalizeData(data: AppData): AppData {
  return { ...data, settings: normalizeSettings(data.settings) }
}

function emptyProfile(session: AppSession): Profile {
  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    dob: '',
    educationLevel: 'school',
    course: '',
    yearSemester: '',
    boardUniversity: '',
    institutionName: '',
    academicGoal: '',
    onboarded: false,
    createdAt: new Date().toISOString(),
  }
}

function emptyData(session: AppSession): AppData {
  return {
    profile: emptyProfile(session),
    settings: { ...DEFAULT_SETTINGS },
    subjects: [],
    topics: [],
    uploads: [],
    generated: [],
    slots: [],
    attempts: [],
    revisionSheets: [],
    exams: [],
    examMode: { active: false, exams: [], archive: [] },
    timer: null,
  }
}

function snapshot(state: AppStore): AppData {
  return {
    profile: state.profile,
    settings: state.settings,
    subjects: state.subjects,
    topics: state.topics,
    uploads: state.uploads,
    generated: state.generated,
    slots: state.slots,
    attempts: state.attempts,
    revisionSheets: state.revisionSheets,
    exams: state.exams,
    examMode: state.examMode,
    timer: state.timer,
  }
}

function starterTopics(name: string, subjectId: string): Topic[] {
  const seeds = topicsForSubjectName(name)
  const names = seeds
    ? seeds.slice(0, 5).map((seed) => ({ name: seed.topic, difficulty: seed.difficulty }))
    : [
        { name: 'Core Concepts', difficulty: 'easy' as const },
        { name: 'Key Definitions', difficulty: 'easy' as const },
        { name: 'Standard Problems', difficulty: 'medium' as const },
        { name: 'Applications', difficulty: 'medium' as const },
        { name: 'Revision Essentials', difficulty: 'hard' as const },
      ]
  return names.map((topic) => ({
    id: uid('topic'),
    subjectId,
    name: topic.name,
    difficulty: topic.difficulty,
    status: 'pending' as const,
  }))
}

function uploadKind(file: File): UploadKind {
  const type = file.type
  if (type.includes('pdf')) return 'pdf'
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('audio/')) return 'audio'
  if (type.startsWith('video/')) return 'video'
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext ?? '')) return 'image'
  if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext ?? '')) return 'audio'
  if (['mp4', 'webm', 'mov', 'mkv'].includes(ext ?? '')) return 'video'
  return 'note'
}

function maxPlanDays(exams: Exam[]) {
  const today = new Date()
  const future = exams
    .map((exam) => differenceInCalendarDays(parseISO(exam.date), today))
    .filter((days) => days >= 0)
  if (!future.length) return 14
  return Math.max(1, Math.min(21, Math.max(...future)))
}

export interface OnboardingSubjects {
  name: string
  selfRating: number
}

export interface LeaveResult {
  skipped: number
  carriedTopics: number
  addedSlots: number
  unscheduledTopics: number
}

export interface OnboardingPayload {
  profile: Partial<Profile>
  settings: Partial<Settings>
  subjects: OnboardingSubjects[]
}

export interface AppStore extends AppData {
  session: AppSession | null
  hydrated: boolean
  toasts: Toast[]
  lastInsight: string
  theme: ThemeId
  hydrate: () => Promise<void>
  hydrateWithClerk: (user: { userId: string; name: string; email: string }) => Promise<void>
  hydrateForGuest: () => Promise<void>
  startGuest: () => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<AppSession>
  resendConfirmation: (email: string) => Promise<void>
  logout: () => Promise<void>
  resetDemo: () => Promise<void>
  resetAllData: () => Promise<void>
  deleteAccount: () => Promise<void>
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>
  updateProfile: (partial: Partial<Profile>) => void
  updateSettings: (partial: Partial<Settings>) => void
  addSubject: (name: string, selfRating: number) => Subject
  updateSubjectRating: (subjectId: string, rating: number) => void
  deleteSubject: (subjectId: string) => Promise<void>
  addTopicsFromNames: (subjectId: string, names: string[]) => Topic[]
  addUpload: (
    subjectId: string,
    file: File,
    options?: { extractedText?: string; keepTopics?: boolean },
  ) => Promise<Upload>
  deleteUpload: (uploadId: string) => Promise<void>
  generateContent: (subjectId: string, type: GeneratedType) => Promise<GeneratedContent>
  deleteGenerated: (id: string) => void
  toggleTopicCovered: (topicId: string) => void
  prioritiseTopics: (topicIds: string[]) => void
  regeneratePlan: () => void
  replan: () => void
  startSlot: (slotId: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  finishTimer: () => void
  stopTimer: () => void
  skipSlot: (slotId: string, reason?: string) => void
  takeLeaveToday: () => LeaveResult
  submitAttempt: (attempt: QuizAttempt, slotId?: string) => void
  processMissedSlots: (silent?: boolean) => void
  getRevisionSheet: (subjectId: string, topicId: string) => Promise<RevisionSheet>
  enterExamMode: (exams: Exam[]) => void
  exitExamMode: () => void
  syncExamMode: () => void
  pushToast: (title: string, description?: string, kind?: ToastKind) => void
  dismissToast: (id: string) => void
  setLanguage: (language: Language) => void
  setTheme: (theme: ThemeId) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...emptyData({ userId: '', name: '', email: '', guest: false }),
  session: null,
  hydrated: false,
  toasts: [],
  lastInsight: '',
  theme: initialTheme(),

  hydrate: async () => {
    // Clerk resolves the session asynchronously; ClerkGate calls
    // hydrateWithClerk / hydrateForGuest once it is loaded.
    if (clerkEnabled) return
    try {
      const session = await localAuth?.getSession() ?? null
      if (session) {
        try {
          localStorage.removeItem(GUEST_SESSION_KEY)
        } catch {
          /* storage blocked — nothing to clear */
        }
        const loaded = await repo.loadData(session.userId)
        const data = loaded ? normalizeData(loaded) : emptyData(session)
        set({ ...data, session, hydrated: true })
        return
      }
      let guestRaw: string | null = null
      try {
        guestRaw = localStorage.getItem(GUEST_SESSION_KEY)
      } catch {
        guestRaw = null
      }
      if (guestRaw) {
        const guestSession = JSON.parse(guestRaw) as AppSession
        const raw = localStorage.getItem(GUEST_DATA_KEY)
        const data = normalizeData(raw ? (JSON.parse(raw) as AppData) : createSeedData())
        set({ ...data, session: guestSession, hydrated: true })
        return
      }
      set({ hydrated: true })
    } catch (error) {
      console.error('Failed to hydrate app', error)
      set({ hydrated: true })
    }
  },

  hydrateWithClerk: async ({ userId, name, email }) => {
    const current = get()
    if (current.session?.userId === userId && !current.session.guest) {
      if (!current.hydrated) set({ hydrated: true })
      return
    }
    try {
      localStorage.removeItem(GUEST_SESSION_KEY)
    } catch {
      /* storage blocked — nothing to clear */
    }
    const session: AppSession = { userId, name, email, guest: false }
    try {
      const loaded = await repo.loadData(userId)
      const data = loaded ? normalizeData(loaded) : emptyData(session)
      set({ ...data, session, hydrated: true })
    } catch (error) {
      console.error('Failed to load Clerk account data', error)
      set({ ...emptyData(session), session, hydrated: true })
    }
  },

  hydrateForGuest: async () => {
    const current = get()
    if (current.session?.guest) {
      set({ hydrated: true })
      return
    }
    try {
      const raw = localStorage.getItem(GUEST_SESSION_KEY)
      if (raw) {
        const guestSession = JSON.parse(raw) as AppSession
        const dataRaw = localStorage.getItem(GUEST_DATA_KEY)
        const data = normalizeData(dataRaw ? (JSON.parse(dataRaw) as AppData) : createSeedData())
        set({ ...data, session: guestSession, hydrated: true })
        return
      }
    } catch {
      /* storage blocked — start signed out */
    }
    set({
      ...emptyData({ userId: '', name: '', email: '', guest: false }),
      session: null,
      hydrated: true,
    })
  },

  startGuest: async () => {
    const data = createSeedData()
    const session: AppSession = {
      userId: 'guest',
      name: data.profile?.name ?? 'Riya Sharma',
      email: 'guest@dailytopper.app',
      guest: true,
    }
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session))
    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data))
    for (const asset of seedAssetBlobs()) {
      await saveUploadFile(asset.id, asset.blob, true)
    }
    set({ ...data, session, hydrated: true, lastInsight: '' })
    get().pushToast('Demo profile loaded', 'Welcome, Riya — everything is pre-populated for you.', 'success')
  },

  signUp: async (name, email, password) => {
    if (!localAuth) throw new Error('Accounts are managed by Clerk in this build.')
    const result = await localAuth.signUp(name, email, password)
    if (!result.session) return result
    localStorage.removeItem(GUEST_SESSION_KEY)
    const data = emptyData(result.session)
    data.profile = { ...data.profile!, name }
    await repo.saveData(result.session.userId, data)
    set({ ...data, session: result.session, hydrated: true })
    return result
  },

  signIn: async (email, password) => {
    if (!localAuth) throw new Error('Accounts are managed by Clerk in this build.')
    const session = await localAuth.signIn(email, password)
    localStorage.removeItem(GUEST_SESSION_KEY)
    const loaded = await repo.loadData(session.userId)
    const data = loaded ? normalizeData(loaded) : emptyData(session)
    set({ ...data, session, hydrated: true })
    return session
  },

  resendConfirmation: async (email) => {
    await localAuth?.resendConfirmation(email)
  },

  logout: async () => {
    const session = get().session
    if (clerkEnabled && session && !session.guest) {
      await clerkSignOut()
    } else if (!clerkEnabled) {
      await localAuth?.signOut()
    }
    localStorage.removeItem(GUEST_SESSION_KEY)
    set({
      ...emptyData({ userId: '', name: '', email: '', guest: false }),
      session: null,
      hydrated: true,
      toasts: [],
    })
  },

  resetDemo: async () => {
    const data = createSeedData()
    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data))
    await wipeUploadFiles()
    for (const asset of seedAssetBlobs()) {
      await saveUploadFile(asset.id, asset.blob, true)
    }
    set({ ...data, lastInsight: '' })
    get().pushToast('Demo data reset', 'Riya’s profile, streak and plan are fresh again.', 'success')
  },

  resetAllData: async () => {
    const state = get()
    if (!state.session) return
    await wipeUploadFiles()
    if (state.session.guest) localStorage.removeItem(GUEST_DATA_KEY)
    set({ ...emptyData(state.session), hydrated: true, lastInsight: '' })
    get().pushToast('All data reset', 'Your workspace is empty — start fresh with a new setup.', 'success')
  },

  deleteAccount: async () => {
    const session = get().session
    if (!session) return
    if (session.guest) {
      localStorage.removeItem(GUEST_SESSION_KEY)
      localStorage.removeItem(GUEST_DATA_KEY)
    } else {
      await repo.deleteAccount(session.userId)
      if (clerkEnabled) {
        try {
          await clerkDeleteUser()
        } catch (error) {
          console.warn('Clerk account deletion failed', error)
        }
        /* user.delete() already revoked the session; signing out again can throw. */
        await clerkSignOut().catch(() => undefined)
      } else await localAuth?.signOut()
    }
    await wipeUploadFiles()
    set({
      ...emptyData({ userId: '', name: '', email: '', guest: false }),
      session: null,
      hydrated: true,
      toasts: [],
    })
    get().pushToast('Account deleted', 'Your account and saved data have been removed.', 'info')
  },

  completeOnboarding: async (payload) => {
    const state = get()
    if (!state.profile || !state.session) return
    const subjects: Subject[] = payload.subjects.map((subject, index) => ({
      id: uid('sub'),
      name: subject.name.trim(),
      selfRating: subject.selfRating,
      color: subjectColor(state.subjects.length + index),
      createdAt: new Date().toISOString(),
    }))
    const topics = subjects.flatMap((subject) => starterTopics(subject.name, subject.id))
    set({
      profile: { ...state.profile, ...payload.profile, onboarded: true },
      settings: { ...state.settings, ...payload.settings },
      subjects,
      topics,
      slots: [],
    })
    get().replan()
    await repo.saveData(state.session.userId, snapshot(get()))
    get().pushToast('You’re all set!', 'Your first study plan is ready on the dashboard.', 'success')
  },

  updateProfile: (partial) => {
    const profile = get().profile
    if (!profile) return
    set({ profile: { ...profile, ...partial } })
  },

  updateSettings: (partial) => {
    const previous = get().settings
    set({ settings: { ...previous, ...partial } })
    const replanKeys: (keyof Settings)[] = [
      'studyHours',
      'preferredStudyTime',
      'studyStart',
      'studyEnd',
      'slotLength',
      'weeklyOffDay',
    ]
    if (replanKeys.some((key) => key in partial)) get().replan()
  },

  addSubject: (name, selfRating) => {
    const state = get()
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Subject name is required')
    if (state.subjects.some((subject) => subject.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('That subject already exists — try a different name.')
    }
    const subject: Subject = {
      id: uid('sub'),
      name: trimmed,
      selfRating,
      color: subjectColor(state.subjects.length),
      createdAt: new Date().toISOString(),
    }
    const topics = starterTopics(trimmed, subject.id)
    set({ subjects: [...state.subjects, subject], topics: [...state.topics, ...topics] })
    get().replan()
    get().pushToast('Subject added', `${trimmed} is now part of your plan.`, 'success')
    return subject
  },

  updateSubjectRating: (subjectId, rating) => {
    set({
      subjects: get().subjects.map((subject) =>
        subject.id === subjectId ? { ...subject, selfRating: rating } : subject,
      ),
    })
    get().replan()
    get().pushToast('Self-rating updated', 'Your plan has been re-balanced around this rating.', 'success')
  },

  deleteSubject: async (subjectId) => {
    const state = get()
    const subject = state.subjects.find((s) => s.id === subjectId)
    if (!subject) return
    const uploads = state.uploads.filter((u) => u.subjectId === subjectId)
    await Promise.all(uploads.map((upload) => removeUploadFile(upload.id, Boolean(state.session?.guest))))
    const examMode: AppData['examMode'] = state.examMode.active
      ? {
          ...state.examMode,
          exams: state.examMode.exams.filter((exam) => exam.subjectId !== subjectId),
        }
      : state.examMode
    if (examMode.active && examMode.exams.length === 0) {
      examMode.active = false
      examMode.archive = [
        ...examMode.archive,
        {
          enteredAt: state.examMode.enteredAt ?? new Date().toISOString(),
          exitedAt: new Date().toISOString(),
          exams: state.examMode.exams,
          reason: 'manual',
        },
      ]
    }
    const timerSlot = state.timer ? state.slots.find((s) => s.id === state.timer!.slotId) : undefined
    set({
      subjects: state.subjects.filter((s) => s.id !== subjectId),
      topics: state.topics.filter((t) => t.subjectId !== subjectId),
      uploads: state.uploads.filter((u) => u.subjectId !== subjectId),
      generated: state.generated.filter((g) => g.subjectId !== subjectId),
      revisionSheets: state.revisionSheets.filter((r) => r.subjectId !== subjectId),
      slots: state.slots.filter(
        (slot) => slot.subjectId !== subjectId || !['scheduled', 'running'].includes(slot.status),
      ),
      exams: state.exams.filter((exam) => exam.subjectId !== subjectId),
      examMode,
      timer: timerSlot?.subjectId === subjectId ? null : state.timer,
    })
    get().replan()
    get().pushToast('Subject deleted', `${subject.name} and its future slots were removed.`, 'info')
  },

  addTopicsFromNames: (subjectId, names) => {
    const state = get()
    const existing = new Set(
      state.topics.filter((topic) => topic.subjectId === subjectId).map((topic) => topic.name.toLowerCase()),
    )
    const created: Topic[] = []
    for (const raw of names) {
      const name = raw.trim()
      if (!name || existing.has(name.toLowerCase())) continue
      existing.add(name.toLowerCase())
      created.push({
        id: uid('topic'),
        subjectId,
        name,
        difficulty: 'medium',
        status: 'pending',
      })
    }
    if (created.length) set({ topics: [...state.topics, ...created] })
    return created
  },

  addUpload: async (subjectId, file, options) => {
    const state = get()
    const id = uid('upload')
    const kind = uploadKind(file)
    let noteText = options?.extractedText
    if (!noteText && (kind === 'note' || file.type.startsWith('text/'))) {
      try {
        noteText = await file.text()
      } catch {
        noteText = undefined
      }
    }
    await saveUploadFile(id, file, Boolean(state.session?.guest))
    const upload: Upload = {
      id,
      subjectId,
      name: file.name,
      kind,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      createdAt: new Date().toISOString(),
      noteText,
    }
    set({ uploads: [upload, ...get().uploads] })
    const subject = get().subjects.find((s) => s.id === subjectId)
    if (subject && !options?.keepTopics) {
      const existing = get().topics.filter((topic) => topic.subjectId === subjectId).map((t) => t.name)
      try {
        const result = await aiService.extractTopics({
          subjectName: subject.name,
          fileName: file.name,
          text: noteText,
          existing,
          language: get().settings.language,
        })
        const created = get().addTopicsFromNames(subjectId, result.topics.map((t) => t.name))
        if (created.length) {
          get().pushToast(
            `${created.length} topics found`,
            `${file.name} added to ${subject.name}. New topics are queued in your plan.`,
            'success',
          )
          get().replan()
        } else {
          get().pushToast('Upload added', `${file.name} is now in ${subject.name}.`, 'success')
        }
      } catch {
        get().pushToast('Upload added', `${file.name} is now in ${subject.name}.`, 'success')
      }
    } else {
      get().pushToast('Upload added', `${file.name} is now in ${subject?.name ?? 'your subject'}.`, 'success')
    }
    return upload
  },

  deleteUpload: async (uploadId) => {
    const state = get()
    const upload = state.uploads.find((u) => u.id === uploadId)
    if (!upload) return
    await removeUploadFile(uploadId, Boolean(state.session?.guest))
    set({
      uploads: state.uploads.filter((u) => u.id !== uploadId),
      generated: state.generated.map((item) => ({
        ...item,
        sourceUploadIds: item.sourceUploadIds.filter((id) => id !== uploadId),
      })),
    })
    get().pushToast('Upload deleted', `${upload.name} was removed.`, 'info')
  },

  generateContent: async (subjectId, type) => {
    const state = get()
    const subject = state.subjects.find((s) => s.id === subjectId)
    if (!subject) throw new Error('Subject not found')
    const subjectTopics = state.topics.filter((topic) => topic.subjectId === subjectId)
    const topicNames = (subjectTopics.length ? subjectTopics.slice(0, 3) : [])
      .map((topic) => topic.name)
    const uploads = state.uploads.filter((upload) => upload.subjectId === subjectId)
    const result = await aiService.generateStudyContent({
      subjectName: subject.name,
      topics: topicNames.length ? topicNames : [`${subject.name}: core concepts`],
      type,
      language: state.settings.language,
      sourceText: uploads.map((u) => u.noteText).filter(Boolean).join('\n\n').slice(0, 4000),
    })
    const item: GeneratedContent = {
      id: uid('gen'),
      subjectId,
      type,
      title: result.title,
      body: result.body,
      topicIds: subjectTopics.slice(0, 3).map((topic) => topic.id),
      sourceUploadIds: uploads.map((upload) => upload.id),
      createdAt: new Date().toISOString(),
    }
    set({ generated: [item, ...get().generated] })
    get().pushToast('Notes ready', `${result.title} was added to ${subject.name}.`, 'success')
    return item
  },

  deleteGenerated: (id) => {
    set({ generated: get().generated.filter((item) => item.id !== id) })
    get().pushToast('Content deleted', 'The generated item has been removed.', 'info')
  },

  toggleTopicCovered: (topicId) => {
    set({
      topics: get().topics.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              status: topic.status === 'covered' ? 'pending' : 'covered',
              coveredAt: topic.status === 'covered' ? undefined : new Date().toISOString(),
            }
          : topic,
      ),
    })
    get().replan()
  },

  prioritiseTopics: (topicIds) => {
    const ids = new Set(topicIds)
    if (!ids.size) return
    set({
      topics: get().topics.map((topic) =>
        ids.has(topic.id) ? { ...topic, status: 'pending', coveredAt: undefined } : topic,
      ),
    })
    get().replan()
    get().pushToast(
      'Weak topics queued',
      'The planner will revisit them in your next slots.',
      'success',
    )
  },

  replan: () => {
    const state = get()
    if (!state.profile?.onboarded || !state.subjects.length) {
      set({ slots: state.slots })
      return
    }
    const today = todayISO()
    const leaveToday = state.slots.some((slot) => slot.date === today && slot.leave)
    const backlogTopicIds = state.slots
      .filter(
        (slot) =>
          ['skipped', 'missed'].includes(slot.status) &&
          differenceInCalendarDays(parseISO(today), parseISO(slot.date)) <= 10,
      )
      .flatMap((slot) => slot.topicIds)
    const days = state.examMode.active ? maxPlanDays(state.examMode.exams) : 14
    const generated = generatePlan({
      subjects: state.subjects,
      topics: state.topics,
      settings: state.settings,
      examMode: state.examMode,
      attempts: state.attempts,
      backlogTopicIds,
      days,
      startOffset: leaveToday ? 1 : 0,
      busySlots: state.slots.filter(
        (slot) => slot.date >= today && (slot.status === 'done' || slot.status === 'running'),
      ),
    })
    const preserved = state.slots.filter(
      (slot) =>
        !(
          slot.date >= today &&
          (slot.status === 'scheduled' || (slot.date === today && slot.status === 'missed'))
        ),
    )
    const timer = state.timer
    const merged = [...preserved]
    for (const slot of generated) {
      if (
        timer &&
        slot.date === today &&
        slot.start === state.slots.find((s) => s.id === timer.slotId)?.start
      ) {
        continue
      }
      merged.push(slot)
    }
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const withElapsed = merged.map((slot) =>
      slot.status === 'scheduled' && slot.date === today && slotEndMinutes(slot) < nowMinutes
        ? { ...slot, status: 'missed' as const }
        : slot,
    )
    const absorbed = absorbBacklog({
      slots: withElapsed.sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
      topics: state.topics,
      settings: state.settings,
      examMode: state.examMode,
    })
    set({
      slots: absorbed.slots,
      lastInsight:
        state.settings.language === 'hi'
          ? `आपके ${state.subjects.length} विषयों, कमज़ोरी और बैकलॉग के आधार पर योजना बनाई गई।`
          : `Plan rebuilt across ${state.subjects.length} subjects, weighting weakness, backlog and exam proximity.`,
    })
  },

  regeneratePlan: () => {
    get().replan()
    get().pushToast('Plan regenerated', 'Fresh slots are ready on Daily Tasks and the calendar.', 'success')
  },

  startSlot: (slotId) => {
    const state = get()
    const slot = state.slots.find((s) => s.id === slotId)
    if (!slot) return
    const totalSec = slot.duration * 60
    set({
      slots: state.slots.map((s) => (s.id === slotId ? { ...s, status: 'running' } : s)),
      timer: {
        slotId,
        totalSec,
        endsAt: Date.now() + totalSec * 1000,
        remainingSec: null,
        paused: false,
      },
    })
  },

  pauseTimer: () => {
    const timer = get().timer
    if (!timer || timer.paused || !timer.endsAt) return
    set({
      timer: {
        ...timer,
        paused: true,
        remainingSec: Math.max(0, Math.round((timer.endsAt - Date.now()) / 1000)),
        endsAt: null,
      },
    })
  },

  resumeTimer: () => {
    const timer = get().timer
    if (!timer || !timer.paused) return
    const remaining = timer.remainingSec ?? 0
    set({
      timer: {
        ...timer,
        paused: false,
        endsAt: Date.now() + remaining * 1000,
        remainingSec: null,
      },
    })
  },

  finishTimer: () => {
    const timer = get().timer
    if (!timer) return
    set({
      timer: { ...timer, paused: true, endsAt: null, remainingSec: 0 },
    })
  },

  stopTimer: () => {
    const state = get()
    const timer = state.timer
    if (!timer) return
    set({
      timer: null,
      slots: state.slots.map((slot) =>
        slot.id === timer.slotId && slot.status === 'running'
          ? { ...slot, status: 'scheduled' }
          : slot,
      ),
    })
  },

  skipSlot: (slotId, reason) => {
    const state = get()
    const slot = state.slots.find((s) => s.id === slotId)
    if (!slot) return
    const marked = state.slots.map((s) =>
      s.id === slotId ? { ...s, status: 'skipped' as const, skipReason: reason || undefined } : s,
    )
    const absorbed = absorbBacklog({
      slots: marked,
      topics: state.topics,
      settings: state.settings,
      examMode: state.examMode,
    })
    set({
      slots: absorbed.slots,
      timer: state.timer?.slotId === slotId ? null : state.timer,
    })
    get().pushToast('Slot skipped', 'Its topics were re-queued into your upcoming slots.', 'warning')
  },

  takeLeaveToday: () => {
    const state = get()
    const today = todayISO()
    const openSlots = state.slots.filter((slot) => slot.date === today && slot.status === 'scheduled')
    if (!openSlots.length) {
      get().pushToast('Nothing to skip', 'Today has no unfinished sessions.', 'info')
      return { skipped: 0, carriedTopics: 0, addedSlots: 0, unscheduledTopics: 0 }
    }
    const ids = new Set(openSlots.map((slot) => slot.id))
    const marked = state.slots.map((slot) =>
      ids.has(slot.id) ? { ...slot, status: 'skipped' as const, leave: true } : slot,
    )
    const absorbed = absorbBacklog({
      slots: marked,
      topics: state.topics,
      settings: state.settings,
      examMode: state.examMode,
    })
    set({
      slots: absorbed.slots,
      timer: state.timer && ids.has(state.timer.slotId) ? null : state.timer,
    })
    get().pushToast(
      'Leave taken for today',
      `${openSlots.length} session${openSlots.length > 1 ? 's' : ''} moved into upcoming days — nothing extra today.`,
      'success',
    )
    return {
      skipped: openSlots.length,
      carriedTopics: absorbed.carriedTopicIds.length,
      addedSlots: absorbed.addedSlots,
      unscheduledTopics: absorbed.unscheduledTopicIds.length,
    }
  },

  submitAttempt: (attempt, slotId) => {    const state = get()
    const coveredIds = attempt.questions
      .filter((question) => attempt.answers[question.id] !== undefined)
      .map((question) => question.topicId)
    const coveredSet = new Set(coveredIds)
    const nowIso = new Date().toISOString()
    set({
      attempts: [attempt, ...state.attempts],
      topics: state.topics.map((topic) =>
        coveredSet.has(topic.id)
          ? { ...topic, status: 'covered', coveredAt: topic.coveredAt ?? nowIso }
          : topic,
      ),
      slots: slotId
        ? state.slots.map((slot) =>
            slot.id === slotId
              ? {
                  ...slot,
                  status: 'done',
                  completedAt: nowIso,
                  quizAttemptId: attempt.id,
                }
              : slot,
          )
        : state.slots,
      timer: state.timer?.slotId === slotId ? null : state.timer,
    })
    get().replan()
    if (slotId) {
      const slot = state.slots.find((s) => s.id === slotId)
      const subject = state.subjects.find((s) => s.id === slot?.subjectId)
      get().pushToast(
        'Slot complete!',
        `${subject?.name ?? 'Study'} logged — ${attempt.scorePercent}% on the check-in quiz.`,
        'success',
      )
    }
  },

  processMissedSlots: (silent) => {
    const state = get()
    const now = new Date()
    const today = todayISO(now)
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const missed = state.slots.filter((slot) => {
      if (slot.status !== 'scheduled') return false
      if (slot.date < today) return true
      if (slot.date !== today) return false
      const [h, m] = slot.start.split(':').map(Number)
      return h * 60 + m + slot.duration < nowMinutes
    })
    if (!missed.length) return
    const ids = new Set(missed.map((slot) => slot.id))
    const marked = state.slots.map((slot) =>
      ids.has(slot.id) ? { ...slot, status: 'missed' as const } : slot,
    )
    const absorbed = absorbBacklog({
      slots: marked,
      topics: state.topics,
      settings: state.settings,
      examMode: state.examMode,
    })
    set({ slots: absorbed.slots })
    if (!silent) {
      get().pushToast(
        `${missed.length} slot${missed.length > 1 ? 's' : ''} missed`,
        'Those topics were re-queued into your upcoming slots.',
        'warning',
      )
    }
  },

  getRevisionSheet: async (subjectId, topicId) => {
    const state = get()
    const existing = state.revisionSheets.find(
      (sheet) => sheet.topicId === topicId && sheet.subjectId === subjectId,
    )
    if (existing) return existing
    const subject = state.subjects.find((s) => s.id === subjectId)
    const topic = state.topics.find((t) => t.id === topicId)
    if (!subject || !topic) throw new Error('Subject or topic not found')
    const result = await aiService.generateRevisionSheet({
      subjectName: subject.name,
      topicName: topic.name,
      language: state.settings.language,
    })
    const sheet: RevisionSheet = {
      id: uid('rev'),
      subjectId,
      topicId,
      title: result.title,
      keyPoints: result.keyPoints,
      definitions: result.definitions,
      mnemonics: result.mnemonics,
      commonMistakes: result.commonMistakes,
      createdAt: new Date().toISOString(),
    }
    set({ revisionSheets: [sheet, ...get().revisionSheets] })
    return sheet
  },

  enterExamMode: (exams) => {
    const state = get()
    const normalized = exams
      .filter((exam) => exam.subjectId && exam.date)
      .map((exam) => ({
        ...exam,
        syllabusTopics: exam.syllabusTopics.filter(Boolean),
      }))
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    if (!normalized.length) throw new Error('Add at least one exam before entering Exam Mode.')
    const newTopics: Topic[] = []
    for (const exam of normalized) {
      const existing = new Set(
        [...state.topics, ...newTopics]
          .filter((topic) => topic.subjectId === exam.subjectId)
          .map((topic) => topic.name.toLowerCase()),
      )
      for (const name of exam.syllabusTopics) {
        if (!name.trim() || existing.has(name.toLowerCase())) continue
        existing.add(name.toLowerCase())
        newTopics.push({
          id: uid('topic'),
          subjectId: exam.subjectId,
          name: name.trim(),
          difficulty: 'medium',
          status: 'pending',
        })
      }
    }
    set({
      topics: [...state.topics, ...newTopics],
      exams: normalized,
      examMode: {
        active: true,
        enteredAt: new Date().toISOString(),
        exams: normalized,
        archive: state.examMode.archive,
      },
    })
    get().replan()
    const first = normalized[0]
    const subject = get().subjects.find((s) => s.id === first.subjectId)
    get().pushToast(
      'Exam Mode ON',
      `Plan rebuilt backwards from ${subject?.name ?? 'your exam'} on ${first.date}.`,
      'success',
    )
  },

  exitExamMode: () => {
    const state = get()
    if (!state.examMode.active) return
    const archive = [
      ...state.examMode.archive,
      {
        enteredAt: state.examMode.enteredAt ?? new Date().toISOString(),
        exitedAt: new Date().toISOString(),
        exams: state.examMode.exams,
        reason: 'manual' as const,
      },
    ]
    set({ examMode: { active: false, exams: [], archive }, exams: state.exams })
    get().replan()
    get().pushToast('Exam Mode off', 'Your normal study plan is back.', 'info')
  },

  syncExamMode: () => {
    const state = get()
    if (!state.examMode.active) return
    const today = todayISO()
    const remaining = state.examMode.exams.filter((exam) => exam.date >= today)
    const passed = state.examMode.exams.filter((exam) => exam.date < today)
    if (!remaining.length) {
      set({
        examMode: {
          active: false,
          exams: [],
          archive: [
            ...state.examMode.archive,
            {
              enteredAt: state.examMode.enteredAt ?? new Date().toISOString(),
              exitedAt: new Date().toISOString(),
              exams: state.examMode.exams,
              reason: 'all-passed' as const,
            },
          ],
        },
      })
      get().replan()
      get().pushToast('Exam Mode complete', 'All your exams have passed. Normal planning has resumed.', 'success')
      return
    }
    if (passed.length) {
      const names = passed
        .map((exam) => get().subjects.find((subject) => subject.id === exam.subjectId)?.name ?? 'Subject')
        .join(', ')
      set({ examMode: { ...state.examMode, exams: remaining } })
      get().replan()
      get().pushToast('Exam finished', `${names} was removed from your exam plan. Keep going.`, 'info')
    }
  },

  pushToast: (title, description, kind = 'info') => {
    const id = uid('toast')
    set({ toasts: [...get().toasts, { id, title, description, kind }] })
    window.setTimeout(() => {
      set({ toasts: get().toasts.filter((toast) => toast.id !== id) })
    }, 4800)
  },

  dismissToast: (id) => {
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) })
  },

  setLanguage: (language) => {
    set({ settings: { ...get().settings, language } })
    document.documentElement.lang = language
  },

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* private mode — theme still applies for this session */
    }
    set({ theme })
  },
}))

let saveTimer: number | undefined
useAppStore.subscribe((state, previous) => {
  if (!state.hydrated || !state.session) return
  const keys: (keyof AppData)[] = [
    'profile',
    'settings',
    'subjects',
    'topics',
    'uploads',
    'generated',
    'slots',
    'attempts',
    'revisionSheets',
    'exams',
    'examMode',
    'timer',
  ]
  const changed = keys.some((key) => state[key] !== previous[key])
  if (!changed) return
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    const current = useAppStore.getState()
    if (!current.session) return
    const data = snapshot(current)
    if (current.session.guest) {
      localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data))
    } else {
      void repo.saveData(current.session.userId, data)
    }
  }, 300)
})

export const defaultSettings = DEFAULT_SETTINGS
export const demoStreakHint = isoDaysAgo(0)
