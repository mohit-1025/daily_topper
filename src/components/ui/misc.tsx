import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { Check } from 'lucide-react'
import { StarDoodle } from '@/components/shared/doodles'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-3 w-full overflow-hidden rounded-[2px_7px_3px_6px] border-2 border-foreground bg-card', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn('h-full w-full flex-1 progress-striped transition-all duration-700', indicatorClassName)}
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
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-[4px_9px_5px_8px] border-2 border-foreground bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-[2px] border border-foreground bg-foreground shadow-none transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5 data-[state=checked]:bg-primary-foreground" />
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
      'peer size-5 shrink-0 rounded-[3px_6px_4px_5px] border-2 border-input bg-card ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
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
  icon: React.ElementType
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-4 flex size-16 rotate-[-1.5deg] items-center justify-center rounded-[8px_18px_10px_15px] border-2 border-foreground bg-transparent text-foreground">
        <Icon className="size-7" strokeWidth={1.8} />
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-base leading-8 text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function RatingStars({
  value,
  onChange,
  size = 'md',
  showLabel = false,
  stretch = false,
}: {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  stretch?: boolean
}) {
  const dimensions = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-7' : 'size-5'
  const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong']
  return (
    <div className={cn('flex items-center gap-2', stretch && 'w-full')}>
      <div
        className={cn('flex items-center gap-0.5', stretch && 'w-full justify-between')}
        role={onChange ? 'radiogroup' : 'img'}
        aria-label={`Self rating ${value} out of 5`}
      >
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
              className="flex size-8 items-center justify-center rounded-lg transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <StarDoodle
                className={cn(
                  dimensions,
                  active ? 'fill-[hsl(var(--highlighter-hsl))] text-foreground' : 'text-muted-foreground/40',
                )}
              />
            </button>
          ) : (
            <StarDoodle
              key={star}
              className={cn(
                dimensions,
                active ? 'fill-[hsl(var(--highlighter-hsl))] text-foreground' : 'text-muted-foreground/30',
              )}
            />
          )
        })}
      </div>
      {showLabel && value > 0 && <span className="text-sm font-medium text-muted-foreground">{labels[value - 1]}</span>}
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
