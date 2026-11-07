import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BookOpen, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { BookDoodle, NoteDoodle, StarDoodle } from '@/components/shared/doodles'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Progress, RatingStars, EmptyState } from '@/components/ui/misc'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAppStore } from '@/store/useAppStore'
import { percent } from '@/lib/utils'

const ratingLabels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong']

export function SubjectsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const uploads = useAppStore((state) => state.uploads)
  const generated = useAppStore((state) => state.generated)
  const addSubject = useAppStore((state) => state.addSubject)

  const [open, setOpen] = useState(searchParams.get('add') === '1')
  const [name, setName] = useState('')
  const [rating, setRating] = useState(3)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const closeDialog = (value: boolean) => {
    setOpen(value)
    if (!value) {
      setName('')
      setRating(3)
      setError('')
      if (searchParams.get('add')) {
        searchParams.delete('add')
        setSearchParams(searchParams, { replace: true })
      }
    }
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t('subjects.nameLabel'))
      return
    }
    try {
      const subject = addSubject(trimmed, rating)
      closeDialog(false)
      navigate(`/subjects/${subject.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.duplicateSubject'))
    }
  }

  const visible = subjects.filter((subject) => subject.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('subjects.title')}
        subtitle={t('subjects.subtitle')}
        eyebrow={`${subjects.length} ${t('common.subjects').toLowerCase()}`}
        actions={
          <>
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('common.search')}
                className="w-44 pl-9"
                aria-label={t('common.search')}
              />
            </div>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> {t('subjects.addSubject')}
            </Button>
          </>
        }
      />

      {subjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title={t('subjects.emptyTitle')}
            description={t('subjects.emptyDesc')}
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" /> {t('subjects.addSubject')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="border-t-2 border-dashed border-border">
          {visible.map((subject) => {
            const subjectTopics = topics.filter((topic) => topic.subjectId === subject.id)
            const covered = subjectTopics.filter((topic) => topic.status === 'covered').length
            const uploadCount = uploads.filter((upload) => upload.subjectId === subject.id).length
            const generatedCount = generated.filter((item) => item.subjectId === subject.id).length
            const coveredPercent = percent(covered, Math.max(1, subjectTopics.length))
            return (
              <Link
                key={subject.id}
                to={`/subjects/${subject.id}`}
                className="group flex flex-col gap-3 border-b-2 border-dashed border-border py-4 sm:flex-row sm:items-start"
              >
                <span className="flex size-12 shrink-0 items-center justify-center border-2 border-foreground font-display text-lg leading-none">
                  {subject.name.slice(0, 2).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="flex items-center gap-2 font-display text-2xl leading-tight">
                      {subject.name}
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </h2>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {covered}/{subjectTopics.length} topics · {uploadCount} {uploadCount === 1 ? 'upload' : 'uploads'}
                      {generatedCount > 0 ? ` · ${generatedCount} ${generatedCount === 1 ? 'note' : 'notes'}` : ''}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <RatingStars value={subject.selfRating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {ratingLabels[subject.selfRating - 1]} · {t('subjects.rating')}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={coveredPercent} className="h-3 flex-1" />
                    <span className="w-12 shrink-0 text-right font-display text-xl leading-none">{coveredPercent}%</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('subjects.topicsCovered', { percent: coveredPercent })}
                    {coveredPercent >= 60 && (
                      <span className="ml-2 inline-flex items-center gap-1 font-semibold text-foreground">
                        <StarDoodle className="size-3.5 fill-[hsl(var(--highlighter-hsl))]" /> On track
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {subjects.length > 0 && visible.length === 0 && (
        <Card>
          <EmptyState
            icon={Search}
            title="No subjects match your search"
            description="Try a different name, or add the subject to your plan."
            action={
              <Button variant="outline" onClick={() => setQuery('')}>
                {t('common.close')}
              </Button>
            }
          />
        </Card>
      )}

      {subjects.length > 0 && (
        <section className="flex flex-col gap-3 border-l-4 border-[var(--margin-line)] pl-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <NoteDoodle className="mt-1 size-6 shrink-0" />
            <div>
              <p className="font-display text-lg">One folder for everything</p>
              <p className="max-w-[60ch] text-sm leading-7 text-muted-foreground">
                Keep chapter PDFs, class notes and recordings together. Generated notes and practice sets sit beside
                them, so revision starts from one page.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to={`/subjects/${subjects[0].id}`}>
              {t('common.open')} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      )}

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent size="sm" className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <BookDoodle className="size-7" />
              <DialogTitle>{t('subjects.addTitle')}</DialogTitle>
              <DialogDescription>{t('subjects.addDesc')}</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject-name">{t('subjects.nameLabel')}</Label>
                <Input
                  id="subject-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setError('')
                  }}
                  placeholder={t('subjects.namePlaceholder')}
                  autoFocus
                  aria-invalid={Boolean(error)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('subjects.ratingLabel')}</Label>
                <div className="border-2 border-dashed border-border p-3">
                  <RatingStars value={rating} onChange={setRating} size="lg" showLabel />
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>{t('subjects.veryWeak')}</span>
                    <span>{ratingLabels[rating - 1]}</span>
                    <span>{t('subjects.veryStrong')}</span>
                  </div>
                </div>
              </div>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                <Plus className="size-4" /> {t('subjects.addSubject')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
