export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr'
export type EducationLevel = 'school' | 'undergraduate' | 'postgraduate' | 'competitive'
export type StudyTime = 'morning' | 'afternoon' | 'evening' | 'night'
export type SlotLength = 25 | 45 | 60 | 90
export type Difficulty = 'easy' | 'medium' | 'hard' | 'adaptive'

export interface Profile {
  id: string
  name: string
  email: string
  dob: string
  gender?: string
  city?: string
  state?: string
  educationLevel: EducationLevel
  course: string
  yearSemester: string
  boardUniversity: string
  institutionName: string
  academicGoal: string
  onboarded: boolean
  createdAt: string
}

export interface Settings {
  language: Language
  studyHours: number
  preferredStudyTime: StudyTime
  slotLength: SlotLength
  weeklyOffDay: number
  reminders: boolean
  reminderTime: string
  sound: boolean
}

export interface Subject {
  id: string
  name: string
  selfRating: number
  color: string
  createdAt: string
}

export type TopicStatus = 'pending' | 'covered'

export interface Topic {
  id: string
  subjectId: string
  name: string
  status: TopicStatus
  coveredAt?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export type UploadKind = 'pdf' | 'audio' | 'video' | 'image' | 'note'

export interface Upload {
  id: string
  subjectId: string
  name: string
  kind: UploadKind
  mime: string
  size: number
  createdAt: string
  noteText?: string
}

export type GeneratedType = 'summary' | 'notes' | 'flashcards' | 'questions' | 'revision'

export interface GeneratedContent {
  id: string
  subjectId: string
  type: GeneratedType
  title: string
  body: string
  topicIds: string[]
  createdAt: string
  sourceUploadIds: string[]
}

export type SlotStatus = 'scheduled' | 'running' | 'done' | 'skipped' | 'missed'
export type SlotSource = 'normal' | 'revision' | 'exam'

export interface StudySlot {
  id: string
  date: string
  start: string
  duration: number
  subjectId: string
  topicIds: string[]
  status: SlotStatus
  source: SlotSource
  note?: string
  skipReason?: string
  completedAt?: string
  quizAttemptId?: string
}

export interface Question {
  id: string
  topicId: string
  topicName: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface QuizConfig {
  subjectIds: string[]
  topicIds: string[]
  count: number
  difficulty: Difficulty
  timerMode: 'none' | 'total' | 'per-question'
  timerSeconds: number
}

export interface TopicAccuracy {
  topicId: string
  topicName: string
  correct: number
  total: number
}

export interface AIReport {
  summary: string
  weakTopics: { topicId: string; topic: string; accuracy: number }[]
  solutions: { questionId: string; title: string; steps: string[] }[]
  tips: string[]
  nextSteps: string[]
  encouragement: string
}

export interface QuizAttempt {
  id: string
  title: string
  subjectIds: string[]
  topicIds: string[]
  questions: Question[]
  answers: Record<string, number>
  marked: string[]
  correctCount: number
  total: number
  scorePercent: number
  startedAt: string
  submittedAt: string
  timeTakenSec: number
  difficulty: Difficulty
  timerMode: QuizConfig['timerMode']
  perTopic: TopicAccuracy[]
  report?: AIReport
  slotId?: string
}

export interface RevisionSheet {
  id: string
  subjectId: string
  topicId: string
  title: string
  keyPoints: string[]
  definitions: { term: string; meaning: string }[]
  mnemonics: string[]
  commonMistakes: string[]
  createdAt: string
}

export interface Exam {
  id: string
  subjectId: string
  date: string
  time: string
  syllabusTopics: string[]
}

export interface ArchivedExamMode {
  enteredAt: string
  exitedAt: string
  exams: Exam[]
  reason: 'manual' | 'auto' | 'all-passed'
}

export interface ExamModeState {
  active: boolean
  enteredAt?: string
  exams: Exam[]
  archive: ArchivedExamMode[]
}

export interface TimerState {
  slotId: string
  totalSec: number
  endsAt: number | null
  remainingSec: number | null
  paused: boolean
}

export interface AppSession {
  userId: string
  name: string
  email: string
  guest: boolean
}

export interface AppData {
  profile: Profile | null
  settings: Settings
  subjects: Subject[]
  topics: Topic[]
  uploads: Upload[]
  generated: GeneratedContent[]
  slots: StudySlot[]
  attempts: QuizAttempt[]
  revisionSheets: RevisionSheet[]
  exams: Exam[]
  examMode: ExamModeState
  timer: TimerState | null
}

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  title: string
  description?: string
  kind: ToastKind
}
