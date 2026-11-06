import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideClose?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, hideClose, size = 'md', ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card text-card-foreground shadow-lift outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:duration-200 data-[state=open]:duration-300',
          'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0',
          sizes[size],
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground opacity-80 transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
)
DialogContent.displayName = DialogPrimitive.Content.displayName

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 px-5 pb-2 pt-4 sm:px-6 sm:pt-6', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-auto flex flex-col-reverse gap-2 border-t border-border bg-card px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:rounded-b-2xl sm:px-6',
        className,
      )}
      {...props}
    />
  )
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('font-display text-xl font-semibold', className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1 overflow-y-auto px-5 py-3 sm:px-6', className)} {...props} />
  ),
)
DialogBody.displayName = 'DialogBody'

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
