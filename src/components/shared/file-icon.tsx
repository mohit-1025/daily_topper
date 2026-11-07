import { FileAudio, FileImage, FileText, FileVideo, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UploadKind } from '@/types'

const config = {
  pdf: { icon: FileText, tone: 'bg-[hsl(var(--margin-line-hsl)/0.18)] text-[var(--destructive)]' },
  audio: { icon: FileAudio, tone: 'bg-[hsl(var(--tape-hsl)/0.55)] text-foreground' },
  video: { icon: FileVideo, tone: 'bg-[hsl(var(--tape-hsl)/0.8)] text-foreground' },
  image: { icon: FileImage, tone: 'bg-[hsl(var(--rule-hsl)/0.35)] text-foreground' },
  note: { icon: StickyNote, tone: 'bg-[hsl(var(--highlighter-hsl)/0.5)] text-foreground' },
} satisfies Record<UploadKind, { icon: typeof FileText; tone: string }>

export function FileIcon({ kind, className }: { kind: UploadKind; className?: string }) {
  const { icon: Icon, tone } = config[kind]
  return (
    <span className={cn('flex size-11 shrink-0 items-center justify-center border-2 border-foreground', tone, className)}>
      <Icon className="size-5" />
    </span>
  )
}
