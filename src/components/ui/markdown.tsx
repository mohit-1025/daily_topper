import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-foreground underline-highlighter">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = content.split('\n')
  const blocks: ReactNode[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushList = () => {
    if (!list) return
    const items = list.items.map((item, index) => (
      <li key={index} className="leading-relaxed">
        {inline(item)}
      </li>
    ))
    blocks.push(
      list.type === 'ul' ? (
        <ul key={`list-${blocks.length}`} className="my-2.5 ml-5 list-disc space-y-1.5 text-base leading-8 text-muted-foreground">
          {items}
        </ul>
      ) : (
        <ol key={`list-${blocks.length}`} className="my-2.5 ml-5 list-decimal space-y-1.5 text-base leading-8 text-muted-foreground">
          {items}
        </ol>
      ),
    )
    list = null
  }

  lines.forEach((raw, index) => {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flushList()
      return
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      flushList()
      const level = heading[1].length
      const text = heading[2]
      const cls =
        level === 1
          ? 'mt-5 mb-2 font-display text-xl font-bold'
          : level === 2
            ? 'mt-5 mb-2 font-display text-lg font-semibold text-foreground'
            : 'mt-4 mb-1.5 font-display text-base font-semibold text-foreground'
      blocks.push(
        <p key={index} className={cls}>
          {inline(text)}
        </p>,
      )
      return
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      if (!list || list.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(bullet[1])
      return
    }
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (numbered) {
      if (!list || list.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(numbered[1])
      return
    }
    flushList()
    blocks.push(
      <p key={index} className="my-1.5 text-base leading-8 text-muted-foreground">
        {inline(line)}
      </p>,
    )
  })
  flushList()

  return <div className={cn('space-y-0.5', className)}>{blocks}</div>
}
