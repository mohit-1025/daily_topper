import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, FileStack, Layers, Plus, Search, Sparkles, Star } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((subject, index) => {
            const subjectTopics = topics.filter((topic) => topic.subjectId === subject.id)
            const covered = subjectTopics.filter((topic) => topic.status === 'covered').length
            const uploadCount = uploads.filter((upload) => upload.subjectId === subject.id).length
            const generatedCount = generated.filter((item) => item.subjectId === subject.id).length
            const coveredPercent = percent(covered, Math.max(1, subjectTopics.length))
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3) }}
              >
                <Link to={`/subjects/${subject.id}`} className="group block h-full">
                  <Card className="relative h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
                    <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: subject.color }} />
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: subject.color }}
                          >
                            {subject.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <h2 className="truncate font-display text-base font-bold">{subject.name}</h2>
                            <p className="text-[11px] text-muted-foreground">
                              {subjectTopics.length} {t('common.topics').toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">{t('subjects.rating')}</span>
                        <RatingStars value={subject.selfRating} size="sm" />
                      </div>
                      <p className="text-right text-[10px] text-muted-foreground">{ratingLabels[subject.selfRating - 1]}</p>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">{t('subjects.topicsCovered', { percent: coveredPercent })}</span>
                          <span className="font-semibold">{covered}/{subjectTopics.length}</span>
                        </div>
                        <Progress value={coveredPercent} className="h-1.5" indicatorClassName="bg-success" />
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                        <Badge variant="secondary">
                          <Layers className="size-3" /> {uploadCount} uploads
                        </Badge>
                        <Badge variant="violet">
                          <Sparkles className="size-3" /> {generatedCount} AI
                        </Badge>
                        {coveredPercent >= 60 && (
                          <Badge variant="success">
                            <Star className="size-3" /> On track
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
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
            action={<Button variant="outline" onClick={() => setQuery('')}>{t('common.close')}</Button>}
          />
        </Card>
      )}

      {subjects.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <FileStack className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">One folder for everything</p>
                <p className="text-xs text-muted-foreground">
                  Upload notes, recordings or chapter PDFs. AI turns them into summaries, flashcards and practice sets.
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to={`/subjects/${subjects[0].id}`}>
                {t('common.open')} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent size="sm" className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <BookOpen className="size-5" />
              </div>
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
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <RatingStars value={rating} onChange={setRating} size="lg" showLabel />
                  <div className="mt-2 flex justify-between text-[10px] font-medium text-muted-foreground">
                    <span>{t('subjects.veryWeak')}</span>
                    <span>{ratingLabels[rating - 1]}</span>
                    <span>{t('subjects.veryStrong')}</span>
                  </div>
                </div>
              </div>
              {error && <p className="text-xs font-medium text-destructive">{error}</p>}
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
