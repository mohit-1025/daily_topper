import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[4px_9px_5px_8px] border-2 px-2.5 py-0.5 text-sm font-semibold',
  {
    variants: {
      variant: {
        default: 'border-primary/60 bg-primary-soft text-primary',
        secondary: 'border-primary/40 bg-secondary text-secondary-foreground',
        outline: 'border-primary/60 bg-transparent text-muted-foreground',
        success: 'border-success/50 bg-success/10 text-success',
        warning: 'border-warning/50 bg-warning/10 text-warning',
        destructive: 'border-destructive/50 bg-destructive/10 text-destructive',
        info: 'border-info/50 bg-info/10 text-info',
        accent: 'border-primary/40 bg-accent/50 text-accent-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
