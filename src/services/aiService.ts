import { z } from 'zod'
import type {
  AIReport,
  Difficulty,
  GeneratedType,
  Language,
  Question,
  QuizAttempt,
  Subject,
  Topic,
} from '@/types'
import { findKnowledge, genericKnowledge, topicsForSubjectName, topicSeeds } from '@/services/knowledge'
import { hashString, uid } from '@/lib/utils'

const CACHE_KEY = 'dt-ai-cache-v1'
const CACHE_LIMIT = 160
const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === 'true'
const AI_ENDPOINT = (import.meta.env.VITE_AI_ENDPOINT as string | undefined) ?? '/api/ai'

type CacheMap = Record<string, unknown>

function readCache(): CacheMap {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as CacheMap
  } catch {
    return {}
  }
}

function writeCache(cache: CacheMap) {
  const keys = Object.keys(cache)
  if (keys.length > CACHE_LIMIT) {
    for (const key of keys.slice(0, keys.length - CACHE_LIMIT)) delete cache[key]
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* storage full — caching is best effort */
  }
}

export function clearAICache() {
  localStorage.removeItem(CACHE_KEY)
}

const H = (language: Language, en: string, hi: string) => (language === 'hi' ? hi : en)

function seededRandom(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const rand = seededRandom(seed)
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function requestAI<T>(
  kind: string,
  payload: Record<string, unknown>,
  schema: z.ZodType<T>,
  mock: () => T,
  cacheKey?: string,
): Promise<T> {
  const key = `v2:${kind}:${cacheKey ?? hashString(JSON.stringify(payload))}`
  const cache = readCache()
  if (cache[key] !== undefined) {
    const parsed = schema.safeParse(cache[key])
    if (parsed.success) return parsed.data
  }

  if (AI_ENABLED) {
    const system = `You are Daily Topper, an expert Indian study coach. Respond with ONLY valid JSON. No markdown fences, no prose outside JSON. Match this shape exactly: ${JSON.stringify(
      z.toJSONSchema(schema),
    )}`
    const user = JSON.stringify(payload)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(AI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ system, user }),
        })
        if (!res.ok) break
        const data = (await res.json()) as { text?: string }
        const text = (data.text ?? '').replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
        if (!text) continue
        const parsed = schema.safeParse(JSON.parse(text))
        if (parsed.success) {
          cache[key] = parsed.data
          writeCache(cache)
          return parsed.data
        }
      } catch {
        /* retry, then fall back to mock */
      }
    }
  }

  const fallback = schema.parse(mock())
  cache[key] = fallback
  writeCache(cache)
  return fallback
}

/* ------------------------------------------------------------------ */
/* Schemas                                                             */
/* ------------------------------------------------------------------ */

const topicSchema = z.object({
  name: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  reason: z.string().optional().default(''),
})

const extractedTopicsSchema = z.object({ topics: z.array(topicSchema).min(1).max(8) })

const studyContentSchema = z.object({ title: z.string(), body: z.string() })

const slotContentSchema = z.object({
  title: z.string(),
  explainer: z.string(),
  keyPoints: z.array(z.string()).min(1),
  practice: z.string(),
})

const questionSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  topicName: z.string(),
  question: z.string(),
  options: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
})

const quizSchema = z.object({ questions: z.array(questionSchema).min(1) })

const reportSchema = z.object({
  summary: z.string(),
  weakTopics: z.array(
    z.object({ topicId: z.string(), topic: z.string(), accuracy: z.number() }),
  ),
  solutions: z.array(
    z.object({ questionId: z.string(), title: z.string(), steps: z.array(z.string()).min(1) }),
  ),
  tips: z.array(z.string()).min(1),
  nextSteps: z.array(z.string()).min(1),
  encouragement: z.string(),
})

const revisionSchema = z.object({
  title: z.string(),
  keyPoints: z.array(z.string()).min(1),
  definitions: z.array(z.object({ term: z.string(), meaning: z.string() })).min(1),
  mnemonics: z.array(z.string()).min(1),
  commonMistakes: z.array(z.string()).min(1),
})

const parsedScheduleSchema = z.object({
  exams: z.array(
    z.object({
      subjectName: z.string(),
      date: z.string(),
      time: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
})

const parsedSyllabusSchema = z.object({
  topics: z.array(z.object({ name: z.string(), difficulty: z.enum(['easy', 'medium', 'hard']) })).min(1),
})

const planSchema = z.object({
  insight: z.string(),
  priorities: z.array(
    z.object({ subjectId: z.string(), topicId: z.string(), score: z.number(), reason: z.string() }),
  ),
})

/* ------------------------------------------------------------------ */
/* Mock helpers                                                        */
/* ------------------------------------------------------------------ */

function knowledgeFor(topicName: string) {
  return findKnowledge(topicName) ?? genericKnowledge(topicName)
}

function makeQuestions(
  topics: { id: string; name: string }[],
  count: number,
  difficulty: Difficulty,
  language: Language,
  seed: string,
): Question[] {
  const pool: Question[] = []
  topics.forEach((topic, topicIndex) => {
    const knowledge = knowledgeFor(topic.name)
    knowledge.questions.forEach((q, qIndex) => {
      pool.push({
        id: `q_${hashString(`${seed}-${topic.id}-${qIndex}`)}`,
        topicId: topic.id,
        topicName: topic.name,
        question: q.q,
        options: q.options,
        answerIndex: q.answerIndex,
        explanation: q.explanation,
        difficulty: q.difficulty,
      })
    })
    knowledge.keyPoints.slice(0, 3).forEach((point, index) => {
      const otherTopic = topics[(topicIndex + 1) % Math.max(1, topics.length)]?.name ?? 'another topic'
      pool.push({
        id: `q_${hashString(`${seed}-${topic.id}-gen-${index}`)}`,
        topicId: topic.id,
        topicName: topic.name,
        question: H(
          language,
          `Which statement about ${topic.name} is correct?`,
          `${topic.name} के बारे में कौन-सा कथन सही है?`,
        ),
        options: shuffleWithSeed(
          [
            point,
            `${topic.name} has no practical applications`,
            `It is exactly the same as ${otherTopic}`,
            'It can be mastered without any practice',
          ],
          `${seed}-${topic.id}-${index}`,
        ),
        answerIndex: 0,
        explanation: H(
          language,
          `This is a core idea of ${topic.name}. ${point}`,
          `यह ${topic.name} का एक मुख्य विचार है। ${point}`,
        ),
        difficulty: index === 0 ? 'easy' : 'medium',
      })
    })
  })

  let filtered = pool.filter((q) => difficulty === 'adaptive' || q.difficulty === difficulty)
  if (filtered.length < count) filtered = pool
  const selected = shuffleWithSeed(filtered, `${seed}-select`).slice(0, count)
  return selected.map((q) => {
    const options = q.options
    const paired = options.map((text, index) => ({ text, correct: index === q.answerIndex }))
    const shuffled = shuffleWithSeed(paired, `${q.id}-options`)
    return {
      ...q,
      options: shuffled.map((o) => o.text),
      answerIndex: shuffled.findIndex((o) => o.correct),
    }
  })
}

function labelFor(type: GeneratedType, language: Language) {
  if (language === 'hi') {
    const map: Record<GeneratedType, string> = {
      summary: 'सारांश',
      notes: 'नोट्स',
      flashcards: 'फ्लैशकार्ड',
      questions: 'अभ्यास प्रश्न',
      revision: 'रिवीजन शीट',
    }
    return map[type]
  }
  const map: Record<GeneratedType, string> = {
    summary: 'Summary',
    notes: 'Study Notes',
    flashcards: 'Flashcards',
    questions: 'Practice Questions',
    revision: 'Revision Sheet',
  }
  return map[type]
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface ExtractTopicsInput {
  subjectName: string
  fileName?: string
  text?: string
  existing: string[]
  language: Language
}

export interface ExtractedTopic {
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  reason: string
}

export function extractTopics(input: ExtractTopicsInput) {
  return requestAI<{ topics: ExtractedTopic[] }>(
    'extractTopics',
    input as unknown as Record<string, unknown>,
    extractedTopicsSchema,
    () => {
      const existing = new Set(input.existing.map((t) => t.toLowerCase()))
      const known = topicsForSubjectName(input.subjectName)
      let candidates = known ?? topicSeeds.physics
      if (input.text) {
        const lower = input.text.toLowerCase()
        const matched = Object.keys(topicSeeds)
          .flatMap((subject) => topicSeeds[subject])
          .filter((seed) => lower.includes(seed.topic.toLowerCase().split(' ')[0]))
        if (matched.length >= 2) candidates = matched
      }
      if (known) {
        const start = (input.fileName?.length ?? 0) % Math.max(1, candidates.length - 4)
        candidates = [...candidates.slice(start), ...candidates.slice(0, start)]
      }
      const topics = candidates
        .filter((c) => !existing.has(c.topic.toLowerCase()))
        .slice(0, 5)
        .map((c) => ({
          name: c.topic,
          difficulty: c.difficulty,
          reason: H(
            input.language,
            `Frequently examined topic identified from ${input.fileName ?? 'your syllabus'}.`,
            `${input.fileName ?? 'आपके पाठ्यक्रम'} से पहचाना गया महत्वपूर्ण विषय।`,
          ),
        }))
      return {
        topics:
          topics.length > 0
            ? topics
            : [
                {
                  name: `${input.subjectName}: Core Concepts`,
                  difficulty: 'medium' as const,
                  reason: H(input.language, 'Foundational concepts to build on.', 'आगे बढ़ने के लिए बुनियादी अवधारणाएँ।'),
                },
              ],
      }
    },
  )
}

export interface StudyContentInput {
  subjectName: string
  topics: string[]
  type: GeneratedType
  language: Language
  sourceText?: string
}

export function generateStudyContent(input: StudyContentInput) {
  return requestAI<{ title: string; body: string }>(
    'generateStudyContent',
    input as unknown as Record<string, unknown>,
    studyContentSchema,
    () => {
      const language = input.language
      const knowledge = input.topics.map(knowledgeFor)
      const title = `${labelFor(input.type, language)} — ${input.topics.join(', ')}`
      const hindiHeadings: Record<string, string> = {
        Summary: 'सारांश',
        'Key points': 'मुख्य बिंदु',
        Definitions: 'परिभाषाएँ',
        Mnemonic: 'याद रखने की ट्रिक',
        'Common mistakes': 'सामान्य गलतियाँ',
        Overview: 'परिचय',
        Application: 'अनुप्रयोग',
        Answer: 'उत्तर',
        Question: 'प्रश्न',
      }
      const heading = (key: string) => H(language, key, hindiHeadings[key] ?? key)

      if (input.type === 'summary') {
        const body = knowledge
          .map(
            (k, index) =>
              `${index === 0 ? '' : '\n'}\n## ${heading('Summary')}: ${input.topics[index]}\n\n${k.summary}\n\n${k.keyPoints
                .slice(0, 3)
                .map((p) => `- ${p}`)
                .join('\n')}`,
          )
          .join('\n')
        return { title, body }
      }

      if (input.type === 'flashcards') {
        const cards = knowledge.flatMap((k, topicIndex) =>
          k.definitions.slice(0, 2).map(
            (d, index) =>
              `### ${heading('Question')} ${topicIndex + 1}.${index + 1}${'\n'}**${d.term}?**\n\n${heading('Answer')}: ${d.meaning}`,
          ),
        )
        return { title, body: cards.join('\n\n') }
      }

      if (input.type === 'questions') {
        const questions = knowledge
          .flatMap((k) => k.questions.slice(0, 2))
          .map(
            (q, index) =>
              `${index + 1}. **${q.q}**\n\n${q.options
                .map((o, i) => `   ${String.fromCharCode(65 + i)}. ${o}`)
                .join('\n')}\n\n   ${heading('Answer')}: ${String.fromCharCode(65 + q.answerIndex)} — ${q.explanation}`,
          )
        return { title, body: questions.join('\n\n') }
      }

      const sections = knowledge
        .map(
          (k, index) => `## ${input.topics[index]}
### ${heading('Overview')}
${k.summary}

### ${heading('Key points')}
${k.keyPoints.map((p) => `- ${p}`).join('\n')}

### ${heading('Definitions')}
${k.definitions.map((d) => `- **${d.term}:** ${d.meaning}`).join('\n')}

### ${heading('Mnemonic')}
${k.mnemonics.map((m) => `- ${m}`).join('\n')}

### ${heading('Common mistakes')}
${k.mistakes.map((m) => `- ${m}`).join('\n')}`,
        )
        .join('\n\n')
      return { title, body: sections }
    },
  )
}

export interface SlotContentInput {
  subjectName: string
  topics: string[]
  language: Language
  mode?: 'explain' | 'revision'
}

export function generateSlotContent(input: SlotContentInput) {
  return requestAI<{ title: string; explainer: string; keyPoints: string[]; practice: string }>(
    'generateSlotContent',
    input as unknown as Record<string, unknown>,
    slotContentSchema,
    () => {
      const knowledge = knowledgeFor(input.topics[0] ?? input.subjectName)
      return {
        title: `${input.subjectName}: ${input.topics.join(' · ')}`,
        explainer: knowledge.explainer,
        keyPoints: knowledge.keyPoints.slice(0, 4),
        practice: H(
          input.language,
          `Practice: explain ${input.topics[0]} in your own words, then solve one exam-style question without notes.`,
          `अभ्यास: ${input.topics[0]} को अपने शब्दों में समझाएँ, फिर बिना नोट्स के एक परीक्षा-शैली प्रश्न हल करें।`,
        ),
      }
    },
  )
}

export interface GenerateQuizInput {
  subjects: Subject[]
  topics: Topic[]
  count: number
  difficulty: Difficulty
  language: Language
}

export function generateQuiz(input: GenerateQuizInput) {
  return requestAI<{ questions: Question[] }>(
    'generateQuiz',
    {
      subjectNames: input.subjects.map((s) => s.name),
      topics: input.topics.map((t) => ({ id: t.id, name: t.name, subjectId: t.subjectId })),
      count: input.count,
      difficulty: input.difficulty,
      language: input.language,
    },
    quizSchema,
    () => ({
      questions: makeQuestions(
        input.topics.map((t) => ({ id: t.id, name: t.name })),
        Math.max(1, input.count),
        input.difficulty,
        input.language,
        input.topics.map((t) => t.name).join('|') + input.count + input.difficulty,
      ),
    }),
    `quiz-${input.topics.map((t) => t.id).join(',')}-${input.count}-${input.difficulty}-${input.language}`,
  )
}

export interface ImprovementReportInput {
  attempt: Pick<
    QuizAttempt,
    'questions' | 'answers' | 'perTopic' | 'correctCount' | 'total' | 'scorePercent' | 'timeTakenSec'
  >
  language: Language
  subjectNames: string[]
}

export function generateImprovementReport(input: ImprovementReportInput) {
  return requestAI<AIReport>(
    'generateImprovementReport',
    {
      subjectNames: input.subjectNames,
      correctCount: input.attempt.correctCount,
      total: input.attempt.total,
      scorePercent: input.attempt.scorePercent,
      timeTakenSec: input.attempt.timeTakenSec,
      perTopic: input.attempt.perTopic,
      wrongQuestions: input.attempt.questions
        .filter((q) => input.attempt.answers[q.id] !== q.answerIndex)
        .map((q) => ({ id: q.id, question: q.question, topic: q.topicName, explanation: q.explanation })),
      language: input.language,
    },
    reportSchema,
    () => {
      const perTopic = input.attempt.perTopic
      const weakTopics = perTopic
        .map((t) => ({
          topicId: t.topicId,
          topic: t.topicName,
          accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0,
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
      const weak = weakTopics.filter((t) => t.accuracy < 70)
      const wrong = input.attempt.questions.filter((q) => input.attempt.answers[q.id] !== q.answerIndex)
      const score = input.attempt.scorePercent
      const summary =
        score >= 80
          ? H(
              input.language,
              `Excellent work — ${score}% shows strong recall across ${input.subjectNames.join(', ')}. Lock in the remaining gaps with two focused revision sessions this week.`,
              `बहुत बढ़िया — ${score}% दर्शाता है कि ${input.subjectNames.join(', ')} में आपकी पकड़ मजबूत है। बाकी कमियों को इस हफ्ते दो फोकस्ड रिवीजन से पूरा करें।`,
            )
          : score >= 50
            ? H(
                input.language,
                `Solid foundation: ${score}%. You understand the basics of ${input.subjectNames.join(', ')} but lose marks on application. Turn each mistake into a worked example.`,
                `अच्छी शुरुआत: ${score}%. आप ${input.subjectNames.join(', ')} की बुनियादी बातें समझते हैं, लेकिन अनुप्रयोग में अंक कट रहे हैं। हर गलती को हल किए उदाहरण में बदलें।`,
              )
            : H(
                input.language,
                `This attempt scored ${score}%, which is a useful diagnostic rather than a setback. Revisit definitions first, then retry the wrong questions after a short break.`,
                `इस प्रयास में ${score}% मिले — इसे सीखने का संकेत मानें। पहले परिभाषाएँ दोहराएँ, फिर थोड़े विराम के बाद गलत प्रश्न दोबारा हल करें।`,
              )
      return {
        summary,
        weakTopics,
        solutions: wrong.map((q) => ({
          questionId: q.id,
          title: q.question,
          steps: [
            H(input.language, `Concept tested: ${q.topicName}.`, `परीक्षित अवधारणा: ${q.topicName}।`),
            H(input.language, `Correct answer: ${q.options[q.answerIndex]}.`, `सही उत्तर: ${q.options[q.answerIndex]}।`),
            q.explanation,
            H(
              input.language,
              'Write the rule in one line and re-attempt a similar question tomorrow.',
              'नियम को एक पंक्ति में लिखें और कल ऐसा ही प्रश्न दोबारा हल करें।',
            ),
          ],
        })),
        tips: [
          H(
            input.language,
            'Use active recall: close the notes and write what you remember before checking.',
            'सक्रिय स्मरण अपनाएँ: नोट्स बंद करके जो याद है लिखें, फिर जाँचें।',
          ),
          H(
            input.language,
            'Space your revisions: revisit this topic after 1 day, 3 days and 7 days.',
            'रिवीजन में अंतराल रखें: इस विषय को 1 दिन, 3 दिन और 7 दिन बाद दोहराएँ।',
          ),
          H(
            input.language,
            'Explain the hardest concept aloud to a friend — gaps show up instantly.',
            'सबसे कठिन अवधारणा किसी मित्र को ज़ोर से समझाएँ — कमियाँ तुरंत दिखेंगी।',
          ),
        ],
        nextSteps: [
          H(
            input.language,
            `Add ${weak.slice(0, 3).map((w) => w.topic).join(', ') || 'the weakest topics'} to the study plan.`,
            `${weak.slice(0, 3).map((w) => w.topic).join(', ') || 'सबसे कमज़ोर विषयों'} को अध्ययन योजना में जोड़ें।`,
          ),
          H(
            input.language,
            'Attempt 10 mixed questions at medium difficulty within 48 hours.',
            '48 घंटों के भीतर मध्यम कठिनाई के 10 मिश्रित प्रश्न हल करें।',
          ),
          H(
            input.language,
            'Review the revision sheet and update your flashcard deck.',
            'रिवीजन शीट देखें और फ्लैशकार्ड अपडेट करें।',
          ),
        ],
        encouragement: H(
          input.language,
          'Every attempt is data, not a verdict. Small, consistent revisions win this exam.',
          'हर प्रयास एक जानकारी है, फैसला नहीं। छोटे और नियमित रिवीजन परीक्षा जीतते हैं।',
        ),
      }
    },
  )
}

export interface RevisionSheetInput {
  subjectName: string
  topicName: string
  language: Language
}

export function generateRevisionSheet(input: RevisionSheetInput) {
  return requestAI<{
    title: string
    keyPoints: string[]
    definitions: { term: string; meaning: string }[]
    mnemonics: string[]
    commonMistakes: string[]
  }>(
    'generateRevisionSheet',
    input as unknown as Record<string, unknown>,
    revisionSchema,
    () => {
      const knowledge = knowledgeFor(input.topicName)
      return {
        title: `${input.topicName} — ${H(input.language, 'Revision Sheet', 'रिवीजन शीट')}`,
        keyPoints: knowledge.keyPoints,
        definitions: knowledge.definitions,
        mnemonics: knowledge.mnemonics,
        commonMistakes: knowledge.mistakes,
      }
    },
  )
}

export interface ParseScheduleInput {
  text: string
  language: Language
}

export function parseExamSchedule(input: ParseScheduleInput) {
  return requestAI<{
    exams: { subjectName: string; date: string; time: string; confidence: number }[]
  }>(
    'parseExamSchedule',
    input as unknown as Record<string, unknown>,
    parsedScheduleSchema,
    () => {
      const exams: { subjectName: string; date: string; time: string; confidence: number }[] = []
      const datePattern =
        /(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(?:at|,|-)?\s*(\d{1,2}:\d{2})?/gi
      const lines = input.text
        .split(/\n|;/)
        .map((line) => line.trim())
        .filter(Boolean)
      const knownSubjects = [...topicSeeds.physics, ...topicSeeds.chemistry, ...topicSeeds.mathematics, ...topicSeeds.biology, ...topicSeeds.english]
      for (const line of lines) {
        const match = [...line.matchAll(datePattern)][0]
        if (!match) continue
        let rawDate = match[1]
        if (rawDate.includes('/') || rawDate.includes('-')) {
          const parts = rawDate.split(/[/-]/).map(Number)
          if (parts[0] > 31) {
            rawDate = `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`
          } else {
            const year = parts[2] < 100 ? 2000 + parts[2] : parts[2]
            rawDate = `${year}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`
          }
        }
        const subjectName =
          line.match(/(physics|chemistry|mathematics|maths|math|biology|english)/i)?.[1] ??
          line
            .replace(match[0], '')
            .replace(/exam|test|paper|:-|—|–/gi, '')
            .replace(/[0-9]/g, '')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .join(' ') ??
          'Subject'
        exams.push({
          subjectName: subjectName.charAt(0).toUpperCase() + subjectName.slice(1),
          date: rawDate,
          time: match[2] ?? '10:00',
          confidence: knownSubjects.some((s) => s.topic.toLowerCase().includes(subjectName.toLowerCase())) ? 0.92 : 0.74,
        })
      }
      if (!exams.length) {
        const today = new Date()
        ;['Physics', 'Chemistry', 'Mathematics'].forEach((subject, index) => {
          const d = new Date(today)
          d.setDate(d.getDate() + 10 + index * 4)
          exams.push({
            subjectName: subject,
            date: d.toISOString().slice(0, 10),
            time: '10:00',
            confidence: 0.55,
          })
        })
      }
      return { exams }
    },
  )
}

export function parseSyllabus(input: { subjectName: string; text: string; language: Language }) {
  return requestAI<{ topics: { name: string; difficulty: 'easy' | 'medium' | 'hard' }[] }>(
    'parseSyllabus',
    input as unknown as Record<string, unknown>,
    parsedSyllabusSchema,
    () => {
      const cleaned = input.text
        .split(/\n|,|;|•|\u2022/)
        .map((t) => t.replace(/^[-*\d.]+\s*/, '').trim())
        .filter((t) => t.length > 2)
      const fallback = topicsForSubjectName(input.subjectName) ?? topicSeeds.physics
      const topics =
        cleaned.length >= 2
          ? cleaned.slice(0, 12).map((name, index) => ({
              name,
              difficulty: (['easy', 'medium', 'hard'] as const)[index % 3],
            }))
          : fallback.slice(0, 6).map((t) => ({ name: t.topic, difficulty: t.difficulty }))
      return { topics }
    },
  )
}

export interface PlanPriorityInput {
  items: { subjectId: string; topicId: string; subjectName: string; topicName: string; score: number }[]
  studyHours: number
  language: Language
}

export function refineDailyPlan(input: PlanPriorityInput) {
  return requestAI<{ insight: string; priorities: { subjectId: string; topicId: string; score: number; reason: string }[] }>(
    'generateDailyPlan',
    input as unknown as Record<string, unknown>,
    planSchema,
    () => ({
      insight: H(
        input.language,
        `I ranked ${input.items.length} topics by weakness, backlog and exam proximity. ${
          input.items[0] ? `${input.items[0].topicName} first is the highest-leverage choice today.` : ''
        }`,
        `मैंने ${input.items.length} विषयों को कमज़ोरी, बैकलॉग और परीक्षा की निकटता के आधार पर क्रमबद्ध किया। ${
          input.items[0] ? `${input.items[0].topicName} से शुरुआत आज सबसे फायदेमंद है।` : ''
        }`,
      ),
      priorities: input.items.slice(0, 8).map((item) => ({
        subjectId: item.subjectId,
        topicId: item.topicId,
        score: Math.round(item.score * 10) / 10,
        reason: H(input.language, 'High priority based on your current plan.', 'आपकी वर्तमान योजना के आधार पर उच्च प्राथमिकता।'),
      })),
    }),
  )
}

export const aiService = {
  extractTopics,
  generateStudyContent,
  generateSlotContent,
  generateQuiz,
  generateImprovementReport,
  generateRevisionSheet,
  parseExamSchedule,
  parseSyllabus,
  refineDailyPlan,
  clearCache: clearAICache,
}

export const mockAI = {
  makeQuestions,
  knowledgeFor,
  labelFor,
}
export const aiUid = uid
