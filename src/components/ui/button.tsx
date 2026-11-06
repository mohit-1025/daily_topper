import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-glow',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-card hover:bg-muted/70',
        ghost: 'hover:bg-muted hover:text-foreground',
        destructive: 'bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90',
        success: 'bg-success text-white shadow-soft hover:bg-success/90',
        accent: 'bg-accent text-accent-foreground shadow-soft hover:bg-accent/90',
        link: 'text-primary underline-offset-4 hover:underline',
        soft: 'bg-primary-soft text-primary hover:bg-primary/15',
      },
      size: {
        default: 'h-11',
        sm: 'h-9 min-h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'h-11 w-11 px-0',
        'icon-sm': 'h-9 w-9 min-h-9 rounded-lg px-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    if (asChild) {
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Comp>
      )
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" /> : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
