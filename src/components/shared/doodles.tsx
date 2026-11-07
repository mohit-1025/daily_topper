import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

type DoodleProps = SVGProps<SVGSVGElement> & { className?: string }

function Doodle({ className, children, ...props }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('size-5', className)}
      {...props}
    >
      {children}
    </svg>
  )
}

export function PencilDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M4.2 19.6c1.6-.4 3.9-.9 5.2-1.6L19 8.4c.9-.9.8-2.2-.1-3.1-1-1-2.2-1-3.1-.1L6.2 15c-.7 1.3-1.3 3.5-2 4.6Z" />
      <path d="M14.8 6.2c1.1 1 2 1.9 3 2.9" />
      <path d="M6.2 15c1 .8 1.9 1.7 2.8 2.7" />
    </Doodle>
  )
}

export function TickDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M4.4 12.7c1.5 1.2 2.7 2.6 3.9 4.2 2.7-4.2 6-7.7 10.9-10.1" />
    </Doodle>
  )
}

export function StarDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M12 3.4c.7 2.4 1.6 4.4 2.7 6.1 2 .2 3.9.5 5.7 1-1.6 1.5-3 3-4.2 4.6.3 2 .7 3.9 1.2 5.7-1.9-.8-3.7-1.4-5.4-1.8-1.7.6-3.5 1.2-5.3 2 .4-1.9.7-3.8.8-5.8-1.3-1.6-2.7-3-4.3-4.4 1.9-.6 3.8-1 5.7-1.4A30 30 0 0 0 12 3.4Z" />
    </Doodle>
  )
}

export function CalendarDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M4.3 8.1c0-1.6-.1-3.2.1-3.6.3-.5 3.9-.4 5.1-.4 2.3 0 7.1-.2 9.9.1.4 0 .4 3.7.4 5.2 0 3.2.1 7.4-.1 10.1-.1.7-4.8.5-7.5.5-2.6 0-6.9.2-7.7-.2-.4-.2-.3-5.1-.3-6.4" />
      <path d="M4.4 7.9c4.7-.4 10.5-.4 15.3 0M8.3 3.4v3.2M15.8 3.3v3.3M7.7 11.5c1 .1 2 .1 3 0M13.4 11.5c1.1.1 2.2.1 3.3 0M7.8 15.2c1.1.1 2.2.1 3.3 0M13.5 15.2c1 .1 2 .1 3 0" />
    </Doodle>
  )
}

export function CircleCrossDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M20.1 12c-.2-4.2-3.5-7.6-7.9-7.6-4.5 0-8.1 3.7-8 8.2.1 4.4 3.8 7.8 8.2 7.5 4.2-.2 7.6-3.7 7.7-8.1Z" />
      <path d="M8.9 9.1c2.1 2 4 3.9 6 6M15.1 9.2c-2.1 1.9-4.2 3.9-6.2 5.9" />
    </Doodle>
  )
}

export function ArrowDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M3.8 12.2c4.9-.2 10.5-.3 16.4-.2M15.2 6.8c1.8 1.8 3.5 3.5 5.2 5.1-1.8 1.6-3.6 3.4-5.3 5.2" />
    </Doodle>
  )
}

export function BookDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M3.7 5.5c2.9-.5 5.6-.4 8 .4 2.7-.9 5.5-1 8.6-.5.2 4.4.2 8.7 0 12.9-2.9-.4-5.7-.3-8.6.5-2.5-.8-5.2-1-8-.5-.2-4.3-.2-8.5 0-12.8Z" />
      <path d="M11.7 5.9c-.1 4.3-.1 8.5.1 12.7" />
    </Doodle>
  )
}

export function NoteDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M6.1 3.9c3.9-.2 8-.2 11.8 0 .3 5.3.2 10.8-.2 16.1-3.8.2-7.6.2-11.4 0-.3-5.4-.4-10.7-.2-16.1Z" />
      <path d="M9 8.2c1.7-.1 3.7-.1 5.9 0M9 12c1.7-.1 3.7-.1 5.9 0M9 15.8c1.2-.1 2.7-.1 4.2 0" />
    </Doodle>
  )
}
