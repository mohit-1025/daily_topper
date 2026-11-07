import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { FileIcon } from '@/components/shared/file-icon'
import { BookDoodle, NoteDoodle, PencilDoodle, TickDoodle } from '@/components/shared/doodles'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress, RatingStars, Skeleton } from '@/components/ui/misc'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Markdown } from '@/components/ui/markdown'
import { useAppStore } from '@/store/useAppStore'
import { extractUploadText, getUploadUrl, downloadUpload } from '@/lib/extract'
import { cn, formatBytes, percent, prettyDate } from '@/lib/utils'
import type { GeneratedContent, GeneratedType, Upload } from '@/types'

type IconComponent = (props: { className?: string }) => ReactNode

const typeLabels: Record<GeneratedType, string> = {
  summary: 'Summary',
  notes: 'Study notes',
  flashcards: 'Flashcards',
  questions: 'Practice questions',
  revision: 'Revision sheet',
}

const typeIcons: Record<GeneratedType, IconComponent> = {
  summary: PencilDoodle,
  notes: BookDoodle,
  flashcards: NoteDoodle,
  questions: ClipboardList,
  revision: FileText,
}

const ratingLabels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong']

function UploadPreview({ upload, onClose }: { upload: Upload; onClose: () => void }) {
  const { t } = useTranslation()
  const guest = useAppStore((state) => Boolean(state.session?.guest))
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let created: string | null = null
    setLoading(true)
    getUploadUrl(upload, guest)
      .then((value) => {
        created = value
        if (active) setUrl(value)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [upload, guest])

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="pr-8">{upload.name}</DialogTitle>
          <DialogDescription>
            {upload.kind.toUpperCase()} · {formatBytes(upload.size)} · {prettyDate(upload.createdAt)}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : upload.kind === 'note' ? (
            <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap border-2 border-dashed border-border p-4 text-base leading-8 text-muted-foreground">
              {upload.noteText ?? 'No text preview available.'}
            </pre>
          ) : upload.kind === 'image' && url ? (
            <div className="flex max-h-[55vh] items-center justify-center overflow-auto border-2 border-dashed border-border p-3">
              <img src={url} alt={upload.name} className="max-h-[50vh] object-contain" />
            </div>
          ) : upload.kind === 'pdf' && url ? (
            <iframe title={upload.name} src={url} className="h-[55vh] w-full border-2 border-dashed border-border" />
          ) : upload.kind === 'audio' && url ? (
            <div className="border-2 border-dashed border-border p-6">
              <audio controls src={url} className="w-full" />
            </div>
          ) : upload.kind === 'video' && url ? (
            <video controls src={url} className="max-h-[55vh] w-full border-2 border-dashed border-border bg-foreground" />
          ) : (
            <p className="border-2 border-dashed border-border p-6 text-center text-base text-muted-foreground">
              Preview is unavailable for this file. Download it to open on your device.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button onClick={() => downloadUpload(upload, guest)}>
            <Download className="size-4" /> {t('common.download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GeneratedPreview({ item, onClose }: { item: GeneratedContent; onClose: () => void }) {
  const { t } = useTranslation()
  const pushToast = useAppStore((state) => state.pushToast)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.body)
      pushToast(t('common.copySuccess'), undefined, 'success')
    } catch {
      pushToast(t('errors.generic'), undefined, 'error')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{typeLabels[item.type]}</Badge>
            <span className="text-sm text-muted-foreground">{prettyDate(item.createdAt)}</span>
          </div>
          <DialogTitle className="pr-8">{item.title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="print-area border-2 border-dashed border-border p-4">
            <Markdown content={item.body} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={copy}>
            <Copy className="size-4" /> {t('common.copy')}
          </Button>
          <Button onClick={() => window.print()}>
            <FileText className="size-4" /> {t('common.print')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SubjectDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const uploads = useAppStore((state) => state.uploads)
  const generated = useAppStore((state) => state.generated)
  const slots = useAppStore((state) => state.slots)
  const session = useAppStore((state) => state.session)
  const settings = useAppStore((state) => state.settings)
  const updateSubjectRating = useAppStore((state) => state.updateSubjectRating)
  const deleteSubject = useAppStore((state) => state.deleteSubject)
  const addUpload = useAppStore((state) => state.addUpload)
  const deleteUpload = useAppStore((state) => state.deleteUpload)
  const generateContent = useAppStore((state) => state.generateContent)
  const deleteGenerated = useAppStore((state) => state.deleteGenerated)
  const toggleTopicCovered = useAppStore((state) => state.toggleTopicCovered)
  const pushToast = useAppStore((state) => state.pushToast)
  const guest = Boolean(session?.guest)

  const subject = subjects.find((item) => item.id === id)
  const subjectTopics = useMemo(() => topics.filter((topic) => topic.subjectId === id), [topics, id])
  const subjectUploads = useMemo(
    () => uploads.filter((upload) => upload.subjectId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [uploads, id],
  )
  const subjectGenerated = useMemo(
    () => generated.filter((item) => item.subjectId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [generated, id],
  )
  const coveredCount = subjectTopics.filter((topic) => topic.status === 'covered').length

  const [previewUpload, setPreviewUpload] = useState<Upload | null>(null)
  const [deleteUploadTarget, setDeleteUploadTarget] = useState<Upload | null>(null)
  const [previewGenerated, setPreviewGenerated] = useState<GeneratedContent | null>(null)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [rating, setRating] = useState(subject?.selfRating ?? 3)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateType, setGenerateType] = useState<GeneratedType>('summary')
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (subject) setRating(subject.selfRating)
  }, [subject])

  if (!subject) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <BookDoodle className="mx-auto size-8 text-muted-foreground/50" />
          <h2 className="mt-3 font-display text-2xl">{t('common.notFound')}</h2>
          <p className="mt-1 text-base text-muted-foreground">This subject may have been deleted.</p>
          <Button className="mt-4" asChild>
            <Link to="/subjects">
              <ArrowLeft className="size-4" /> {t('subjects.detailBack')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (!list.length) return
    setUploadError('')
    setUploading(true)
    try {
      for (const file of list) {
        if (file.size > 25 * 1024 * 1024) {
          pushToast(t('errors.fileTooLarge'), file.name, 'error')
          continue
        }
        const kind = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
          ? 'pdf'
          : file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('audio/')
              ? 'audio'
              : file.type.startsWith('video/')
                ? 'video'
                : 'note'
        const text = await extractUploadText(file, kind, settings.language)
        await addUpload(subject.id, file, { extractedText: text })
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('errors.generic'))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const saveRating = () => {
    updateSubjectRating(subject.id, rating)
    setRatingOpen(false)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    await deleteSubject(subject.id)
    navigate('/subjects', { replace: true })
  }

  const runGenerate = async () => {
    setGenerating(true)
    try {
      await generateContent(subject.id, generateType)
      setGenerateOpen(false)
    } catch (error) {
      pushToast(t('errors.generic'), error instanceof Error ? error.message : undefined, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const regenerate = async (item: GeneratedContent) => {
    try {
      await generateContent(subject.id, item.type)
      deleteGenerated(item.id)
    } catch {
      pushToast(t('errors.generic'), undefined, 'error')
    }
  }

  const futureSlots = slots.filter((slot) => slot.subjectId === subject.id && slot.status === 'scheduled').length
  const coveredPercent = percent(coveredCount, Math.max(1, subjectTopics.length))

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/subjects')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground underline decoration-[var(--rule)] decoration-2 underline-offset-4 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {t('subjects.detailBack')}
      </button>

      <div className="flex flex-col gap-4 border-b-2 border-foreground pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center border-2 border-foreground font-display text-xl leading-none">
            {subject.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-3xl leading-tight">{subject.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <RatingStars value={subject.selfRating} size="sm" />
              <span className="text-sm text-muted-foreground">
                {ratingLabels[subject.selfRating - 1]} · {t('subjects.rating')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setRatingOpen(true)}>
            <Pencil className="size-3.5" /> {t('subjects.editRating')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="size-3.5" /> {t('subjects.generateCta')}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteOpen(true)} aria-label={t('subjects.deleteSubject')}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 border-y-2 border-dashed border-border py-3 sm:grid-cols-4">
        {[
          { label: t('common.topics'), value: `${coveredCount}/${subjectTopics.length}` },
          { label: t('subjects.uploadCta').split(' ')[0], value: subjectUploads.length },
          { label: 'Saved notes', value: subjectGenerated.length },
          { label: 'Upcoming slots', value: futureSlots },
        ].map((stat) => (
          <div key={stat.label} className="px-1">
            <p className="font-display text-2xl leading-none">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="tape">
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl leading-tight">
                  <FolderOpen className="size-5" /> {t('subjects.uploads')}
                </h2>
                <p className="mt-1 text-base leading-8 text-muted-foreground">{t('subjects.uploadsDesc')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
                <Plus className="size-3.5" /> {t('common.upload')}
              </Button>
            </div>
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                void handleFiles(event.dataTransfer.files)
              }}
              onClick={() => fileInput.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') fileInput.current?.click()
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-4 py-7 text-center transition-colors',
                dragging
                  ? 'border-foreground bg-[hsl(var(--highlighter-hsl)/0.35)]'
                  : 'border-foreground/40 hover:border-foreground hover:bg-[hsl(var(--highlighter-hsl)/0.2)]',
              )}
            >
              <input
                ref={fileInput}
                type="file"
                multiple
                className="sr-only"
                accept=".pdf,.txt,.md,image/*,audio/*,video/*"
                onChange={(event) => event.target.files && void handleFiles(event.target.files)}
              />
              {uploading ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-7" />}
              <p className="mt-2 text-base font-semibold">
                {uploading ? 'Reading the file and finding topics…' : t('subjects.dropHint')}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{t('subjects.dropFormats')}</p>
            </div>
            {uploadError && <p className="text-sm font-medium text-destructive">{uploadError}</p>}

            {subjectUploads.length === 0 ? (
              <div className="border-2 border-dashed border-border px-4 py-6 text-center">
                <FileText className="mx-auto size-6 text-muted-foreground/60" />
                <p className="mt-2 text-base font-semibold">{t('subjects.noUploads')}</p>
                <p className="text-sm text-muted-foreground">{t('subjects.noUploadsDesc')}</p>
              </div>
            ) : (
              <ul>
                {subjectUploads.map((upload) => (
                  <li
                    key={upload.id}
                    className="flex items-center gap-3 border-b-2 border-dashed border-border py-2.5 last:border-0"
                  >
                    <FileIcon kind={upload.kind} className="size-9 shrink-0 [&_svg]:size-4" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{upload.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(upload.size)} · {prettyDate(upload.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => setPreviewUpload(upload)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label={t('common.preview')}
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadUpload(upload, guest)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label={t('common.download')}
                      >
                        <Download className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteUploadTarget(upload)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <section className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-display text-2xl leading-tight">
                <NoteDoodle className="size-5" /> {t('subjects.aiFolder')}
              </h2>
              <p className="mt-1 text-base leading-8 text-muted-foreground">{t('subjects.aiFolderDesc')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setGenerateOpen(true)}>
              <PencilDoodle className="size-3.5" /> {t('common.generate')}
            </Button>
          </div>
          <div className="mt-3">
            {subjectGenerated.length === 0 ? (
              <div className="border-2 border-dashed border-border px-4 py-8 text-center">
                <NoteDoodle className="mx-auto size-6 text-muted-foreground/60" />
                <p className="mt-2 text-base font-semibold">{t('subjects.noGenerated')}</p>
                <p className="mt-0.5 text-sm leading-7 text-muted-foreground">{t('subjects.noGeneratedDesc')}</p>
                <Button size="sm" className="mt-3" onClick={() => setGenerateOpen(true)}>
                  <PencilDoodle className="size-3.5" /> {t('subjects.generateCta')}
                </Button>
              </div>
            ) : (
              <ul>
                {subjectGenerated.map((item) => {
                  const Icon = typeIcons[item.type]
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 border-b-2 border-dashed border-border py-2.5 first:border-t-2 last:border-b-0"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center border-2 border-foreground">
                        <Icon className="size-4" />
                      </span>
                      <button type="button" onClick={() => setPreviewGenerated(item)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {typeLabels[item.type]} · {prettyDate(item.createdAt)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => void regenerate(item)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label={t('common.regenerate')}
                      >
                        <RefreshCw className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewGenerated(item)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label={t('common.view')}
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGenerated(item.id)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl leading-tight">{t('subjects.topicsTitle')}</h2>
            <p className="mt-1 text-base leading-8 text-muted-foreground">
              {t('subjects.topicsCovered', { percent: coveredPercent })} · tap a topic to mark it covered
            </p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold">
            <TickDoodle className="size-4" /> {coveredCount}/{subjectTopics.length}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Progress value={coveredPercent} className="h-4 flex-1" />
          <span className="w-14 text-right font-display text-2xl leading-none">{coveredPercent}%</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {subjectTopics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => toggleTopicCovered(topic.id)}
              className={cn(
                'flex items-center gap-2.5 border-b-2 border-dashed border-border px-1 py-2.5 text-left transition-colors',
                topic.status === 'covered'
                  ? 'bg-[hsl(var(--highlighter-hsl)/0.28)]'
                  : 'hover:bg-[hsl(var(--highlighter-hsl)/0.16)]',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center border-2',
                  topic.status === 'covered' ? 'border-foreground bg-foreground text-primary-foreground' : 'border-foreground/50',
                )}
              >
                {topic.status === 'covered' ? <TickDoodle className="size-3.5" /> : <Check className="size-3.5 text-transparent" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate text-base', topic.status === 'covered' && 'missed-strike')}>
                  {topic.name}
                </span>
                <span className="text-sm capitalize text-muted-foreground">{topic.difficulty}</span>
              </span>
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
            </button>
          ))}
        </div>
        {subjectTopics.length === 0 && (
          <p className="border-b-2 border-dashed border-border py-4 text-center text-base text-muted-foreground">
            Upload a chapter or create a quiz to add topics.
          </p>
        )}
      </section>

      <div className="flex flex-col items-start justify-between gap-3 border-l-4 border-[var(--margin-line)] pl-3 sm:flex-row sm:items-center">
        <p className="max-w-[60ch] text-sm leading-7 text-muted-foreground">
          {t('subjects.editRatingDesc')} · {t('tasks.startHint')}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/tasks">
            {t('plan.openTasks')} <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent size="sm" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('subjects.editRating')}</DialogTitle>
            <DialogDescription>{t('subjects.editRatingDesc')}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="border-2 border-dashed border-border p-4">
              <RatingStars value={rating} onChange={setRating} size="lg" stretch />
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>{t('subjects.veryWeak')}</span>
                <span>{ratingLabels[rating - 1]}</span>
                <span>{t('subjects.veryStrong')}</span>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={saveRating}>
              <Check className="size-4" /> {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generateOpen} onOpenChange={(open) => !generating && setGenerateOpen(open)}>
        <DialogContent size="md">
          <DialogHeader>
            <NoteDoodle className="size-7" />
            <DialogTitle>{t('subjects.generateTitle')}</DialogTitle>
            <DialogDescription>{t('subjects.generateDesc', { subject: subject.name })}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-2">
            {(['summary', 'notes', 'flashcards', 'questions', 'revision'] as GeneratedType[]).map((type) => {
              const Icon = typeIcons[type]
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGenerateType(type)}
                  className={cn(
                    'flex w-full items-center gap-3 border-2 px-3 py-2.5 text-left transition-colors',
                    generateType === type
                      ? 'border-foreground bg-[hsl(var(--highlighter-hsl)/0.35)]'
                      : 'border-transparent hover:bg-[hsl(var(--highlighter-hsl)/0.15)]',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center border-2',
                      generateType === type ? 'border-foreground' : 'border-border',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-base font-semibold">{typeLabels[type]}</span>
                    <span className="block text-sm leading-6 text-muted-foreground">
                      {type === 'flashcards'
                        ? 'Question and answer cards for active recall.'
                        : type === 'questions'
                          ? 'Exam-style MCQs with explained answers.'
                          : type === 'revision'
                            ? 'Key points, definitions, mnemonics and mistakes.'
                            : 'Written from your uploads and topic list.'}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center border-2',
                      generateType === type ? 'border-foreground bg-foreground text-primary-foreground' : 'border-border',
                    )}
                  >
                    {generateType === type && <TickDoodle className="size-3" />}
                  </span>
                </button>
              )
            })}
            {generating && (
              <div className="space-y-2 border-2 border-dashed border-border p-3">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> {t('subjects.generating')}
                </p>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)} disabled={generating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={runGenerate} loading={generating}>
              {!generating && <PencilDoodle className="size-4" />}
              {t('common.generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteUploadTarget)}
        onOpenChange={(open) => !open && setDeleteUploadTarget(null)}
        title={`Delete ${deleteUploadTarget?.name ?? 'this upload'}?`}
        description="The file will be removed from this device. Any notes generated from it stay in your folder."
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={() => {
          if (deleteUploadTarget) void deleteUpload(deleteUploadTarget.id)
          setDeleteUploadTarget(null)
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('subjects.deleteTitle', { subject: subject.name })}
        description={t('subjects.deleteDesc')}
        confirmLabel={t('subjects.deleteSubject')}
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />

      {previewUpload && <UploadPreview upload={previewUpload} onClose={() => setPreviewUpload(null)} />}
      {previewGenerated && <GeneratedPreview item={previewGenerated} onClose={() => setPreviewGenerated(null)} />}
    </div>
  )
}
