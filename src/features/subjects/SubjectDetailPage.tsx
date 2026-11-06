import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
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
import type { LucideIcon } from 'lucide-react'
import { FileIcon } from '@/components/shared/file-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress, RatingStars, Skeleton } from '@/components/ui/misc'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Markdown } from '@/components/ui/markdown'
import { useAppStore } from '@/store/useAppStore'
import { extractUploadText, getUploadUrl, downloadUpload } from '@/lib/extract'
import { cn, formatBytes, percent, prettyDate } from '@/lib/utils'
import type { GeneratedContent, GeneratedType, Upload } from '@/types'

const typeLabels: Record<GeneratedType, string> = {
  summary: 'Summary',
  notes: 'Study notes',
  flashcards: 'Flashcards',
  questions: 'Practice questions',
  revision: 'Revision sheet',
}

const typeIcons: Record<GeneratedType, LucideIcon> = {
  summary: Sparkles,
  notes: BookOpen,
  flashcards: FolderOpen,
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
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : upload.kind === 'note' ? (
            <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
              {upload.noteText ?? 'No text preview available.'}
            </pre>
          ) : upload.kind === 'image' && url ? (
            <div className="flex max-h-[55vh] items-center justify-center overflow-auto rounded-xl bg-muted/40 p-3">
              <img src={url} alt={upload.name} className="max-h-[50vh] rounded-lg object-contain" />
            </div>
          ) : upload.kind === 'pdf' && url ? (
            <iframe title={upload.name} src={url} className="h-[55vh] w-full rounded-xl border border-border" />
          ) : upload.kind === 'audio' && url ? (
            <div className="rounded-xl bg-muted/40 p-6">
              <audio controls src={url} className="w-full" />
            </div>
          ) : upload.kind === 'video' && url ? (
            <video controls src={url} className="max-h-[55vh] w-full rounded-xl bg-black" />
          ) : (
            <p className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
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
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="violet">
              <Sparkles className="size-3" /> {typeLabels[item.type]}
            </Badge>
            <span className="text-[11px] text-muted-foreground">{prettyDate(item.createdAt)}</span>
          </div>
          <DialogTitle className="pr-8">{item.title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="print-area rounded-xl border border-border bg-background/60 p-4">
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
          <BookOpen className="mx-auto size-8 text-muted-foreground/50" />
          <h2 className="mt-3 font-display text-lg font-bold">{t('common.notFound')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">This subject may have been deleted.</p>
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
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate('/subjects')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {t('subjects.detailBack')}
      </button>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm"
            style={{ backgroundColor: subject.color }}
          >
            {subject.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{subject.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <RatingStars value={subject.selfRating} size="sm" />
              <span className="text-[11px] text-muted-foreground">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t('common.topics'), value: `${coveredCount}/${subjectTopics.length}` },
          { label: t('subjects.uploadCta').split(' ')[0], value: subjectUploads.length },
          { label: 'AI content', value: subjectGenerated.length },
          { label: 'Upcoming slots', value: futureSlots },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-xl font-extrabold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">{t('subjects.uploads')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('subjects.uploadsDesc')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
              <Plus className="size-3.5" /> {t('common.upload')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
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
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors',
                dragging ? 'border-primary bg-primary-soft' : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-primary-soft/40',
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
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                {uploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
              </span>
              <p className="mt-2 text-sm font-semibold">{uploading ? 'Extracting text and finding topics…' : t('subjects.dropHint')}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t('subjects.dropFormats')}</p>
            </div>
            {uploadError && <p className="text-xs font-medium text-destructive">{uploadError}</p>}

            {subjectUploads.length === 0 ? (
              <div className="rounded-xl bg-muted/30 px-4 py-6 text-center">
                <FileText className="mx-auto size-6 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">{t('subjects.noUploads')}</p>
                <p className="text-xs text-muted-foreground">{t('subjects.noUploadsDesc')}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {subjectUploads.map((upload) => (
                  <li
                    key={upload.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5"
                  >
                    <FileIcon kind={upload.kind} className="size-9 rounded-lg [&_svg]:size-4" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{upload.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatBytes(upload.size)} · {prettyDate(upload.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => setPreviewUpload(upload)}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={t('common.preview')}
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadUpload(upload, guest)}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={t('common.download')}
                      >
                        <Download className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteUploadTarget(upload)}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">{t('subjects.aiFolder')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('subjects.aiFolderDesc')}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setGenerateOpen(true)}>
              <Sparkles className="size-3.5" /> {t('common.generate')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {subjectGenerated.length === 0 ? (
              <div className="rounded-xl bg-muted/30 px-4 py-8 text-center">
                <Sparkles className="mx-auto size-6 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">{t('subjects.noGenerated')}</p>
                <p className="text-xs text-muted-foreground">{t('subjects.noGeneratedDesc')}</p>
                <Button size="sm" className="mt-3" onClick={() => setGenerateOpen(true)}>
                  <Sparkles className="size-3.5" /> {t('subjects.generateCta')}
                </Button>
              </div>
            ) : (
              subjectGenerated.map((item) => {
                const Icon = typeIcons[item.type]
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                      <Icon className="size-4" />
                    </span>
                    <button type="button" onClick={() => setPreviewGenerated(item)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-xs font-semibold">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {typeLabels[item.type]} · {prettyDate(item.createdAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void regenerate(item)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t('common.regenerate')}
                    >
                      <RefreshCw className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewGenerated(item)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t('common.view')}
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGenerated(item.id)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">{t('subjects.topicsTitle')}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('subjects.topicsCovered', { percent: coveredPercent })} · tap a topic to mark it covered
            </p>
          </div>
          <Badge variant="success">
            <Check className="size-3" /> {coveredCount}/{subjectTopics.length}
          </Badge>
        </CardHeader>
        <CardContent>
          <Progress value={coveredPercent} className="mb-4" indicatorClassName="bg-success" />
          <div className="grid gap-2 sm:grid-cols-2">
            {subjectTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopicCovered(topic.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  topic.status === 'covered'
                    ? 'border-success/25 bg-success/5'
                    : 'border-border bg-background/60 hover:bg-muted/50',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border',
                    topic.status === 'covered'
                      ? 'border-success bg-success text-white'
                      : 'border-border bg-card text-transparent',
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-xs font-semibold', topic.status === 'covered' && 'text-success')}>
                    {topic.name}
                  </span>
                  <span className="text-[10px] capitalize text-muted-foreground">{topic.difficulty}</span>
                </span>
                <ChevronRight className="size-3.5 text-muted-foreground/50" />
              </button>
            ))}
          </div>
          {subjectTopics.length === 0 && (
            <p className="rounded-xl bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">
              Upload a chapter or create a quiz to add topics.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">
          {t('subjects.editRatingDesc')} · {t('tasks.startHint')}
        </p>
        <Button variant="soft" size="sm" asChild>
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
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <RatingStars value={rating} onChange={setRating} size="lg" showLabel />
              <div className="mt-2 flex justify-between text-[10px] font-medium text-muted-foreground">
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
            <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <Sparkles className="size-5" />
            </div>
            <DialogTitle>{t('subjects.generateTitle')}</DialogTitle>
            <DialogDescription>{t('subjects.generateDesc', { subject: subject.name })}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {(['summary', 'notes', 'flashcards', 'questions', 'revision'] as GeneratedType[]).map((type) => {
              const Icon = typeIcons[type]
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGenerateType(type)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                    generateType === type ? 'border-primary bg-primary-soft' : 'border-border hover:bg-muted/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-lg',
                      generateType === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{typeLabels[type]}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {type === 'flashcards'
                        ? 'Question and answer cards for active recall.'
                        : type === 'questions'
                          ? 'Exam-style MCQs with explained answers.'
                          : type === 'revision'
                            ? 'Key points, definitions, mnemonics and mistakes.'
                            : 'Grounded in your uploads and topics.'}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border',
                      generateType === type ? 'border-primary bg-primary text-white' : 'border-border',
                    )}
                  >
                    {generateType === type && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
            {generating && (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
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
              {!generating && <Sparkles className="size-4" />}
              {t('common.generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteUploadTarget)}
        onOpenChange={(open) => !open && setDeleteUploadTarget(null)}
        title={`Delete ${deleteUploadTarget?.name ?? 'this upload'}?`}
        description="The file will be removed from this device. AI content generated from it stays in your folder."
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
