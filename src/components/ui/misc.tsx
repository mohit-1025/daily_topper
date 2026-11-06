import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { Check, Star, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn('h-full w-full flex-1 rounded-full bg-primary transition-all duration-700', indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer size-5 shrink-0 rounded-md border-2 border-input bg-card ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="size-3.5" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton h-4 w-full', className)} {...props} />
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex size-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square size-full', className)} {...props} />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('flex size-full items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary', className)}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('h-px w-full bg-border', className)} role="separator" {...props} />
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="size-7" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function RatingStars({
  value,
  onChange,
  size = 'md',
  showLabel = false,
}: {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}) {
  const dimensions = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-7' : 'size-5'
  const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong']
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={`Self rating ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= value
          return onChange ? (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === value}
              aria-label={`${star} — ${labels[star - 1]}`}
              onClick={() => onChange(star)}
              className="flex size-8 items-center justify-center rounded-lg transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn(dimensions, active ? 'fill-accent text-accent' : 'text-muted-foreground/40')}
              />
            </button>
          ) : (
            <Star key={star} className={cn(dimensions, active ? 'fill-accent text-accent' : 'text-muted-foreground/30')} />
          )
        })}
      </div>
      {showLabel && value > 0 && <span className="text-xs font-medium text-muted-foreground">{labels[value - 1]}</span>}
    </div>
  )
}

export {
  Progress,
  Switch,
  Checkbox,
  Skeleton,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Separator,
  EmptyState,
  RatingStars,
}
