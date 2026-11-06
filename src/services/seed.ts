import { addDays, format, subDays } from 'date-fns'
import type {
  AIReport,
  AppData,
  GeneratedContent,
  QuizAttempt,
  RevisionSheet,
  StudySlot,
  Subject,
  Topic,
  Upload,
} from '@/types'
import { topicSeeds } from '@/services/knowledge'
import { findKnowledge } from '@/services/knowledge'
import { generatePlan } from '@/services/plannerService'
import { mockAI } from '@/services/aiService'
import { formatDuration, isoDaysAgo, isoDaysAhead, subjectColor, todayISO, uid } from '@/lib/utils'

const SLUG: Record<string, string> = {
  Physics: 'phy',
  Chemistry: 'chem',
  Mathematics: 'math',
  Biology: 'bio',
  English: 'eng',
}

function makeSubjects(): Subject[] {
  const list: [string, number][] = [
    ['Physics', 2],
    ['Chemistry', 4],
    ['Mathematics', 3],
    ['Biology', 5],
    ['English', 4],
  ]
  return list.map(([name, rating], index) => ({
    id: `sub_${SLUG[name]}`,
    name,
    selfRating: rating,
    color: subjectColor(index),
    createdAt: subDays(new Date(), 30).toISOString(),
  }))
}

function makeTopics(subjects: Subject[]): Topic[] {
  const map: Record<string, keyof typeof topicSeeds> = {
    Physics: 'physics',
    Chemistry: 'chemistry',
    Mathematics: 'mathematics',
    Biology: 'biology',
    English: 'english',
  }
  const covered: Record<string, number> = {
    'Work Energy & Power': 9,
    Optics: 15,
    Equilibrium: 12,
    'Quadratic Equations': 17,
    Trigonometry: 6,
    Photosynthesis: 2,
    'Cell Structure': 8,
    'Human Digestive System': 5,
    'Grammar Essentials': 11,
  }
  const topics: Topic[] = []
  subjects.forEach((subject) => {
    const seeds = topicSeeds[map[subject.name]]
    seeds.forEach((seed, index) => {
      const isCovered = covered[seed.topic] !== undefined
      topics.push({
        id: `t_${SLUG[subject.name]}_${index + 1}`,
        subjectId: subject.id,
        name: seed.topic,
        difficulty: seed.difficulty,
        status: isCovered ? 'covered' : 'pending',
        coveredAt: isCovered ? isoDaysAgo(covered[seed.topic]) : undefined,
      })
    })
  })
  return topics
}

function makeUploads(): Upload[] {
  return [
    {
      id: 'up_laws_note',
      subjectId: 'sub_phy',
      name: 'Laws of Motion — class notes.txt',
      kind: 'note',
      mime: 'text/plain',
      size: 4820,
      createdAt: subDays(new Date(), 2).toISOString(),
      noteText:
        'Newton’s laws — key points\n\n1. First law (inertia): a body continues in its state of rest or uniform motion unless a net external force acts on it.\n2. Second law: F = ma. Acceleration is in the direction of the net force.\n3. Third law: every action has an equal and opposite reaction acting on a different body.\n\nTypes of friction: static (adjusts to match applied force), kinetic (constant while sliding), rolling (much smaller).\n\nWorked example: a 3 kg block is pushed with 12 N on a frictionless surface. a = F/m = 4 m/s².\n\nCommon mistakes: action–reaction pairs never act on the same body; mass and weight are not the same thing.',
    },
    {
      id: 'up_bonding_pdf',
      subjectId: 'sub_chem',
      name: 'Chemical Bonding — previous year questions.pdf',
      kind: 'pdf',
      mime: 'application/pdf',
      size: 684_032,
      createdAt: subDays(new Date(), 5).toISOString(),
      noteText:
        'EXTRACTED TEXT — Chemical Bonding PYQs\n\nQ1. Why does NaCl conduct electricity in molten state but not in solid state?\nQ2. Predict the shape of NH3 using VSEPR theory. Explain the lone-pair effect.\nQ3. Compare the bond order of O2, O2- and O2^2-.\nQ4. Arrange HF, HCl, HBr and HI in order of increasing bond polarity.\nQ5. Explain hydrogen bonding in water and its effect on boiling point.\n\nTopics covered: ionic bonds, covalent bonds, VSEPR, bond order, polarity, hydrogen bonding.',
    },
    {
      id: 'up_photosynthesis_svg',
      subjectId: 'sub_bio',
      name: 'Photosynthesis — labelled diagram.svg',
      kind: 'image',
      mime: 'image/svg+xml',
      size: 82_400,
      createdAt: subDays(new Date(), 8).toISOString(),
      noteText:
        'Diagram notes: light reactions occur in the thylakoid membranes, producing ATP and NADPH and releasing oxygen from water. The Calvin cycle occurs in the stroma and fixes CO₂ into glucose.',
    },
    {
      id: 'up_integration_note',
      subjectId: 'sub_math',
      name: 'Integration — formula sheet.txt',
      kind: 'note',
      mime: 'text/plain',
      size: 3110,
      createdAt: subDays(new Date(), 1).toISOString(),
      noteText:
        'Integration formula sheet\n\n∫ xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ −1)\n∫ dx/x = ln|x| + C\n∫ eˣ dx = eˣ + C\n∫ sin x dx = −cos x + C\n∫ cos x dx = sin x + C\n∫ sec²x dx = tan x + C\n\nDefinite integral: ∫ₐᵇ f(x) dx = F(b) − F(a).\n\nTechniques: substitution (reverse chain rule), integration by parts, partial fractions.',
    },
  ]
}

function makeGeneratedContent(): GeneratedContent[] {
  const laws = findKnowledge('Laws of Motion')!
  const bonding = findKnowledge('Chemical Bonding')!
  const photosynthesis = findKnowledge('Photosynthesis')!
  return [
    {
      id: 'gen_phy_notes',
      subjectId: 'sub_phy',
      type: 'notes',
      title: 'Laws of Motion — AI study notes',
      topicIds: ['t_phy_1'],
      sourceUploadIds: ['up_laws_note'],
      createdAt: subDays(new Date(), 2).toISOString(),
      body: `## Overview\n${laws.summary}\n\n## Key points\n${laws.keyPoints
        .map((p) => `- ${p}`)
        .join('\n')}\n\n## Definitions\n${laws.definitions
        .map((d) => `- **${d.term}:** ${d.meaning}`)
        .join('\n')}\n\n## Common mistakes\n${laws.mistakes.map((m) => `- ${m}`).join('\n')}`,
    },
    {
      id: 'gen_chem_summary',
      subjectId: 'sub_chem',
      type: 'summary',
      title: 'Chemical Bonding — quick summary',
      topicIds: ['t_chem_1'],
      sourceUploadIds: ['up_bonding_pdf'],
      createdAt: subDays(new Date(), 4).toISOString(),
      body: `${bonding.summary}\n\n${bonding.keyPoints.map((p) => `- ${p}`).join('\n')}`,
    },
    {
      id: 'gen_bio_flashcards',
      subjectId: 'sub_bio',
      type: 'flashcards',
      title: 'Photosynthesis — flashcards',
      topicIds: ['t_bio_1'],
      sourceUploadIds: ['up_photosynthesis_svg'],
      createdAt: subDays(new Date(), 7).toISOString(),
      body: photosynthesis.definitions
        .map((d, i) => `### Card ${i + 1}\n**${d.term}?**\n\n${d.meaning}`)
        .join('\n\n'),
    },
    {
      id: 'gen_math_questions',
      subjectId: 'sub_math',
      type: 'questions',
      title: 'Integration — practice set',
      topicIds: ['t_math_5'],
      sourceUploadIds: ['up_integration_note'],
      createdAt: subDays(new Date(), 1).toISOString(),
      body: findKnowledge('Integration')!.questions
        .map(
          (q, i) =>
            `${i + 1}. **${q.q}**\n${q.options.map((o, j) => `   ${String.fromCharCode(65 + j)}. ${o}`).join('\n')}\n   Answer: ${String.fromCharCode(65 + q.answerIndex)} — ${q.explanation}`,
        )
        .join('\n\n'),
    },
  ]
}

function reportFor(attempt: QuizAttempt): AIReport {
  const weakTopics = attempt.perTopic
    .map((t) => ({
      topicId: t.topicId,
      topic: t.topicName,
      accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
  const wrong = attempt.questions.filter((q) => attempt.answers[q.id] !== q.answerIndex)
  return {
    summary:
      attempt.scorePercent >= 80
        ? `${attempt.scorePercent}% on ${attempt.title}. Strong recall — keep the momentum with a short spaced revision.`
        : attempt.scorePercent >= 50
          ? `${attempt.scorePercent}% on ${attempt.title}. The concepts are familiar, but application is leaking marks. Work through each error below.`
          : `${attempt.scorePercent}% on ${attempt.title}. Treat this as a diagnostic: clear the definitions first, then retry the wrong questions.`,
    weakTopics,
    solutions: wrong.map((q) => ({
      questionId: q.id,
      title: q.question,
      steps: [
        `Concept tested: ${q.topicName}.`,
        `Correct answer: ${q.options[q.answerIndex]}.`,
        q.explanation,
        'Re-attempt a similar question tomorrow without notes.',
      ],
    })),
    tips: [
      'Close your notes and write what you remember before checking — active recall beats re-reading.',
      'Revisit this topic after 1 day, 3 days and 7 days to lock it in.',
      'Explain the hardest idea aloud; gaps show up immediately.',
    ],
    nextSteps: [
      `Revise ${weakTopics.slice(0, 2).map((w) => w.topic).join(' and ') || 'the weakest topics'} next.`,
      'Attempt 10 mixed questions at medium difficulty within 48 hours.',
      'Open the revision sheet for each weak topic and update your flashcards.',
    ],
    encouragement: 'Every attempt is data, not a verdict. Small, consistent revisions win this exam.',
  }
}

function makeAttempt(options: {
  id: string
  title: string
  subjectId: string
  topicNames: string[]
  topics: Topic[]
  correctCount: number
  dayOffset: number
  minuteOfDay: number
  slotId?: string
  now: Date
}): QuizAttempt {
  const topicObjs = options.topics
    .filter((t) => t.subjectId === options.subjectId && options.topicNames.includes(t.name))
    .map((t) => ({ id: t.id, name: t.name }))
  const questions = mockAI.makeQuestions(topicObjs, 5, 'adaptive', 'en', options.id)
  const answers: Record<string, number> = {}
  questions.forEach((q, index) => {
    const shouldBeCorrect = index < options.correctCount
    answers[q.id] =
      q.answerIndex === 0
        ? shouldBeCorrect
          ? 0
          : 1
        : shouldBeCorrect
          ? q.answerIndex
          : (q.answerIndex + 1) % 4
  })
  const perTopicMap = new Map<string, { topicId: string; topicName: string; correct: number; total: number }>()
  questions.forEach((q) => {
    const entry = perTopicMap.get(q.topicId) ?? {
      topicId: q.topicId,
      topicName: q.topicName,
      correct: 0,
      total: 0,
    }
    entry.total += 1
    if (answers[q.id] === q.answerIndex) entry.correct += 1
    perTopicMap.set(q.topicId, entry)
  })
  const correctCount = questions.filter((q) => answers[q.id] === q.answerIndex).length
  const date = subDays(options.now, options.dayOffset)
  const started = new Date(date)
  started.setHours(Math.floor(options.minuteOfDay / 60), options.minuteOfDay % 60, 0, 0)
  const submitted = new Date(started.getTime() + 1000 * 60 * 7 + 1000 * 34)
  const attempt: QuizAttempt = {
    id: options.id,
    title: options.title,
    subjectIds: [options.subjectId],
    topicIds: topicObjs.map((t) => t.id),
    questions,
    answers,
    marked: [],
    correctCount,
    total: questions.length,
    scorePercent: Math.round((correctCount / questions.length) * 100),
    startedAt: started.toISOString(),
    submittedAt: submitted.toISOString(),
    timeTakenSec: 7 * 60 + 34,
    difficulty: 'adaptive',
    timerMode: 'none',
    perTopic: [...perTopicMap.values()],
    slotId: options.slotId,
  }
  attempt.report = reportFor(attempt)
  return attempt
}

function makeHistory(topics: Topic[], attempts: QuizAttempt[], now: Date) {
  const history: StudySlot[] = []
  const statuses: StudySlot['status'][][] = [
    ['done', 'done', 'done'],
    ['done', 'skipped', 'done'],
    ['done', 'done', 'missed'],
    ['done', 'missed', 'done'],
    ['done', 'done', 'skipped'],
    ['done', 'done', 'missed'],
    ['skipped', 'done', 'done'],
  ]
  for (let offset = 1; offset <= 21; offset++) {
    const date = subDays(now, offset)
    const latestSix = offset <= 5
    const restDay = offset === 6 || offset % 7 === 0
    const dayStatuses: StudySlot['status'][] = latestSix
      ? ['done', 'done', 'done']
      : restDay
        ? ['skipped', 'missed', 'skipped']
        : statuses[offset % statuses.length]
    const count = latestSix ? 2 : 3
    for (let i = 0; i < count; i++) {
      const subject = ['sub_phy', 'sub_chem', 'sub_math', 'sub_bio', 'sub_eng'][(offset + i) % 5]
      const subjectTopics = topics.filter((t) => t.subjectId === subject)
      const picked = [subjectTopics[(offset + i) % subjectTopics.length], subjectTopics[(offset + i + 2) % subjectTopics.length]]
      const status: StudySlot['status'] = dayStatuses[i % dayStatuses.length]
      const startMinutes = [7 * 60 + 30, 15 * 60, 18 * 60 + 30][i]
      const linkedAttempt =
        status === 'done'
          ? attempts.find(
              (a) =>
                a.subjectIds.includes(subject) &&
                Math.abs(new Date(a.submittedAt).getDate() - date.getDate()) === 0,
            )
          : undefined
      history.push({
        id: `hist_${offset}_${i}`,
        date: format(date, 'yyyy-MM-dd'),
        start: `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`,
        duration: i === 2 ? 60 : 45,
        subjectId: subject,
        topicIds: picked.filter(Boolean).map((t) => t.id),
        status,
        source: i === 2 && offset % 4 === 0 ? 'revision' : 'normal',
        skipReason: status === 'skipped' ? 'Family event — will catch up tomorrow.' : undefined,
        completedAt: status === 'done' ? new Date(date.setHours(18, 12, 0, 0)).toISOString() : undefined,
        quizAttemptId: linkedAttempt?.id,
      })
    }
  }
  return history
}

function makeTodaySlots(attempts: QuizAttempt[], now: Date): StudySlot[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const today = todayISO(now)
  const doneStart = Math.max(6 * 60, nowMinutes - 150)
  const slots: StudySlot[] = [
    {
      id: 'slot_today_done',
      date: today,
      start: `${String(Math.floor(doneStart / 60)).padStart(2, '0')}:${String(doneStart % 60).padStart(2, '0')}`,
      duration: 45,
      subjectId: 'sub_phy',
      topicIds: ['t_phy_2'],
      status: 'done',
      source: 'normal',
      completedAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
      quizAttemptId: attempts[0]?.id,
    },
  ]
  const firstStart = Math.max(7 * 60, nowMinutes + 25)
  if (firstStart + 45 <= 23 * 60 + 15) {
    slots.push({
      id: 'slot_today_next',
      date: today,
      start: `${String(Math.floor(firstStart / 60)).padStart(2, '0')}:${String(firstStart % 60).padStart(2, '0')}`,
      duration: 45,
      subjectId: 'sub_chem',
      topicIds: ['t_chem_1', 't_chem_2'],
      status: 'scheduled',
      source: 'normal',
    })
  }
  if (firstStart + 120 <= 23 * 60 + 15) {
    slots.push({
      id: 'slot_today_later',
      date: today,
      start: `${String(Math.floor((firstStart + 120) / 60)).padStart(2, '0')}:${String((firstStart + 120) % 60).padStart(2, '0')}`,
      duration: 60,
      subjectId: 'sub_math',
      topicIds: ['t_math_5', 't_math_7'],
      status: 'scheduled',
      source: 'normal',
    })
  }
  return slots
}

export function createSeedData(now = new Date()): AppData {
  const subjects = makeSubjects()
  const topics = makeTopics(subjects)
  const uploads = makeUploads()
  const generated = makeGeneratedContent()

  const attempts: QuizAttempt[] = [
    makeAttempt({
      id: 'attempt_today',
      title: 'Physics — Work Energy & Power check-in',
      subjectId: 'sub_phy',
      topicNames: ['Work Energy & Power', 'Laws of Motion'],
      topics,
      correctCount: 4,
      dayOffset: 0,
      minuteOfDay: Math.max(360, now.getHours() * 60 + now.getMinutes() - 90),
      slotId: 'slot_today_done',
      now,
    }),
    makeAttempt({
      id: 'attempt_1',
      title: 'Physics — Rotational Motion quiz',
      subjectId: 'sub_phy',
      topicNames: ['Rotational Motion', 'Laws of Motion'],
      topics,
      correctCount: 2,
      dayOffset: 1,
      minuteOfDay: 18 * 60 + 20,
      now,
    }),
    makeAttempt({
      id: 'attempt_2',
      title: 'Biology — Photosynthesis revision',
      subjectId: 'sub_bio',
      topicNames: ['Photosynthesis', 'Cell Structure'],
      topics,
      correctCount: 4,
      dayOffset: 3,
      minuteOfDay: 16 * 60 + 40,
      now,
    }),
    makeAttempt({
      id: 'attempt_3',
      title: 'Mathematics — Quadratic Equations drill',
      subjectId: 'sub_math',
      topicNames: ['Quadratic Equations', 'Sequences & Series'],
      topics,
      correctCount: 5,
      dayOffset: 4,
      minuteOfDay: 17 * 60 + 15,
      now,
    }),
    makeAttempt({
      id: 'attempt_4',
      title: 'Chemistry — Chemical Bonding practice',
      subjectId: 'sub_chem',
      topicNames: ['Chemical Bonding', 'Equilibrium'],
      topics,
      correctCount: 3,
      dayOffset: 6,
      minuteOfDay: 15 * 60 + 10,
      now,
    }),
    makeAttempt({
      id: 'attempt_5',
      title: 'Physics — Work Energy & Power',
      subjectId: 'sub_phy',
      topicNames: ['Work Energy & Power'],
      topics,
      correctCount: 4,
      dayOffset: 8,
      minuteOfDay: 17 * 60 + 30,
      now,
    }),
  ]

  const photosynthesis = findKnowledge('Photosynthesis')!
  const revisionSheets: RevisionSheet[] = [
    {
      id: 'rev_bio_photosynthesis',
      subjectId: 'sub_bio',
      topicId: 't_bio_1',
      title: 'Photosynthesis — Revision Sheet',
      keyPoints: photosynthesis.keyPoints,
      definitions: photosynthesis.definitions,
      mnemonics: photosynthesis.mnemonics,
      commonMistakes: photosynthesis.mistakes,
      createdAt: subDays(now, 2).toISOString(),
    },
  ]

  const todaySlots = makeTodaySlots(attempts, now)
  const history = makeHistory(topics, attempts, now)
  const settings: AppData['settings'] = {
    language: 'en',
    theme: 'system',
    studyHours: 4,
    preferredStudyTime: 'evening',
    slotLength: 45,
    weeklyOffDay: 0,
    reminders: true,
    reminderTime: '19:30',
    sound: true,
  }

  const tomorrowMorning = addDays(now, 1)
  tomorrowMorning.setHours(6, 0, 0, 0)
  const future = generatePlan({
    subjects,
    topics,
    settings,
    examMode: { active: false, exams: [], archive: [] },
    attempts,
    now: tomorrowMorning,
    days: 12,
  })

  const exams = [
    {
      id: 'exam_phy',
      subjectId: 'sub_phy',
      date: isoDaysAhead(12),
      time: '10:30',
      syllabusTopics: ['Laws of Motion', 'Work Energy & Power', 'Rotational Motion', 'Electrostatics', 'Current Electricity', 'Optics'],
    },
    {
      id: 'exam_chem',
      subjectId: 'sub_chem',
      date: isoDaysAhead(16),
      time: '10:00',
      syllabusTopics: ['Chemical Bonding', 'Equilibrium', 'Organic Chemistry Basics', 'Electrochemistry', 'Coordination Compounds'],
    },
    {
      id: 'exam_math',
      subjectId: 'sub_math',
      date: isoDaysAhead(20),
      time: '14:00',
      syllabusTopics: ['Quadratic Equations', 'Sequences & Series', 'Trigonometry', 'Differentiation', 'Integration', 'Probability'],
    },
    {
      id: 'exam_bio',
      subjectId: 'sub_bio',
      date: isoDaysAhead(25),
      time: '10:30',
      syllabusTopics: ['Photosynthesis', 'Human Digestive System', 'Genetics', 'Cell Structure', 'Ecology', 'Nervous System'],
    },
  ]

  return {
    profile: {
      id: 'demo-riya',
      name: 'Riya Sharma',
      email: 'riya.sharma@example.com',
      dob: '2008-04-12',
      gender: 'Female',
      city: 'Jaipur',
      state: 'Rajasthan',
      educationLevel: 'school',
      course: 'Class 12 — Science (PCB)',
      yearSemester: 'Class 12',
      boardUniversity: 'CBSE',
      institutionName: "St. Xavier's Senior Secondary School",
      academicGoal: 'Score 95%+ in CBSE boards and crack NEET with 650+.',
      onboarded: true,
      createdAt: subDays(now, 30).toISOString(),
    },
    settings,
    subjects,
    topics,
    uploads,
    generated,
    slots: [...history, ...todaySlots, ...future.filter((slot) => slot.date !== todayISO(now))],
    attempts,
    revisionSheets,
    exams,
    examMode: { active: false, exams: [], archive: [] },
    timer: null,
  }
}

export function seedAssetBlobs(): { id: string; blob: Blob }[] {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ecfdf5"/><stop offset="1" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="900" height="620" fill="url(#bg)"/>
  <text x="450" y="58" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#065f46" text-anchor="middle">Photosynthesis — labelled diagram</text>
  <text x="450" y="88" font-family="Arial, sans-serif" font-size="17" fill="#047857" text-anchor="middle">Light energy + 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</text>
  <path d="M450 470 C260 440 190 300 250 150 C420 170 540 280 450 470Z" fill="url(#leaf)" opacity="0.95"/>
  <path d="M450 470 C640 440 710 300 650 150 C480 170 360 280 450 470Z" fill="#10b981" opacity="0.9"/>
  <path d="M450 470 L450 180" stroke="#065f46" stroke-width="5" opacity="0.7"/>
  <path d="M450 380 L350 300 M450 320 L360 240 M450 260 L390 200 M450 380 L550 300 M450 320 L540 240 M450 260 L510 200" stroke="#065f46" stroke-width="3" opacity="0.5"/>
  <rect x="620" y="430" width="210" height="110" rx="16" fill="#ffffff" opacity="0.9"/>
  <text x="640" y="462" font-family="Arial, sans-serif" font-size="15" fill="#065f46">☀ Light reactions — thylakoid</text>
  <text x="640" y="488" font-family="Arial, sans-serif" font-size="15" fill="#065f46">💧 Water split → O₂ released</text>
  <text x="640" y="514" font-family="Arial, sans-serif" font-size="15" fill="#065f46">⚡ ATP + NADPH produced</text>
  <rect x="70" y="430" width="210" height="110" rx="16" fill="#ffffff" opacity="0.9"/>
  <text x="90" y="462" font-family="Arial, sans-serif" font-size="15" fill="#065f46">🌿 Calvin cycle — stroma</text>
  <text x="90" y="488" font-family="Arial, sans-serif" font-size="15" fill="#065f46">CO₂ fixed using ATP + NADPH</text>
  <text x="90" y="514" font-family="Arial, sans-serif" font-size="15" fill="#065f46">Glucose (C₆H₁₂O₆) formed</text>
  <line x1="280" y1="470" x2="260" y2="360" stroke="#0f766e" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="620" y1="470" x2="640" y2="360" stroke="#0f766e" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="450" cy="180" r="8" fill="#f59e0b"/>
  <text x="450" y="145" font-family="Arial, sans-serif" font-size="15" fill="#b45309" text-anchor="middle">Chlorophyll absorbs red &amp; blue light</text>
</svg>`
  return [{ id: 'up_photosynthesis_svg', blob: new Blob([svg], { type: 'image/svg+xml' }) }]
}

export const seedMeta = { formatDuration, uid }
