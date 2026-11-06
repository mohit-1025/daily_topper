import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { Upload } from '@/types'
import { loadUploadFile } from '@/services/fileStore'

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data }).promise
  const pages: string[] = []
  const pageCount = Math.min(doc.numPages, 24)
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    let pageText = ''
    for (const item of content.items) {
      if ('str' in item) {
        pageText += item.str
        pageText += item.hasEOL ? '\n' : ' '
      }
    }
    pages.push(pageText.trim())
  }
  return pages.filter(Boolean).join('\n\n').slice(0, 12_000)
}

const TOPIC_WORDS = [
  'laws of motion',
  'work energy',
  'thermodynamics',
  'chemical bonding',
  'equilibrium',
  'organic chemistry',
  'electrochemistry',
  'quadratic equations',
  'trigonometry',
  'integration',
  'differentiation',
  'probability',
  'photosynthesis',
  'cell structure',
  'genetics',
  'ecology',
  'grammar',
  'comprehension',
]

function mockTranscript(file: File): string {
  const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
  const matched = TOPIC_WORDS.filter((topic) => name.toLowerCase().includes(topic.split(' ')[0]))
  const focus = matched[0] ?? 'the chapter overview'
  return `Transcribed recording — ${name}

The teacher begins by recapping ${focus} and why it appears frequently in exams. Three ideas are emphasised:
1. The core definition, written precisely as the examiner expects it.
2. A worked example, with each step justified rather than memorised.
3. Two common mistakes that cost easy marks.

Class notes: revise the derivation first, then attempt the practice set without notes. The session closes with a quick oral quiz and a reminder that this topic will be revisited through spaced revision.

Topics mentioned: ${[...new Set([focus, ...matched.slice(1, 4)])].join(', ')}.`
}

export async function transcribeMedia(file: File, language = 'en'): Promise<string> {
  const endpoint = import.meta.env.VITE_TRANSCRIBE_ENDPOINT as string | undefined
  if (endpoint) {
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('language', language)
      const response = await fetch(endpoint, { method: 'POST', body })
      if (response.ok) {
        const data = (await response.json()) as { text?: string }
        if (data.text) return data.text
      }
    } catch {
      /* fall through to mock transcript */
    }
  }
  return mockTranscript(file)
}

export async function extractUploadText(file: File, kind: Upload['kind'], language = 'en'): Promise<string | undefined> {
  try {
    if (kind === 'pdf') return await extractPdfText(file)
    if (kind === 'audio' || kind === 'video') return await transcribeMedia(file, language)
    if (kind === 'note' || file.type.startsWith('text/')) return (await file.text()).slice(0, 12_000)
  } catch {
    return undefined
  }
  return undefined
}

export async function getUploadUrl(upload: Upload, guest: boolean): Promise<string | null> {
  const blob = await loadUploadFile(upload.id, guest)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

export async function downloadUpload(upload: Upload, guest: boolean) {
  const url = await getUploadUrl(upload, guest)
  if (!url) return
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = upload.name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
