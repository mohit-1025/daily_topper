import { FileAudio, FileImage, FileText, FileVideo, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UploadKind } from '@/types'

const config = {
  pdf: { icon: FileText, tone: 'bg-red-500/10 text-red-500' },
  audio: { icon: FileAudio, tone: 'bg-amber-500/10 text-amber-600' },
  video: { icon: FileVideo, tone: 'bg-fuchsia-500/10 text-fuchsia-500' },
  image: { icon: FileImage, tone: 'bg-emerald-500/10 text-emerald-600' },
  note: { icon: StickyNote, tone: 'bg-blue-500/10 text-blue-500' },
} satisfies Record<UploadKind, { icon: typeof FileText; tone: string }>

export function FileIcon({ kind, className }: { kind: UploadKind; className?: string }) {
  const { icon: Icon, tone } = config[kind]
  return (
    <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', tone, className)}>
      <Icon className="size-5" />
    </span>
  )
}
