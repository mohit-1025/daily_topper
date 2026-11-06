import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import type { ToastKind } from '@/types'

const icons: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const tones: Record<ToastKind, string> = {
  success: 'text-success bg-success/10 border-success/20',
  error: 'text-destructive bg-destructive/10 border-destructive/20',
  info: 'text-info bg-info/10 border-info/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
}

export function Toaster() {
  const toasts = useAppStore((state) => state.toasts)
  const dismiss = useAppStore((state) => state.dismissToast)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:items-end sm:px-5">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.kind]
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-border bg-popover/95 p-3.5 shadow-lift backdrop-blur-xl sm:w-96"
              role="status"
            >
              <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border', tones[toast.kind])}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
