import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-[6px_14px_8px_12px] border-2 px-4 py-2 font-sans text-base font-semibold transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[hsl(var(--ring))] disabled:pointer-events-none disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border-primary bg-primary text-primary-foreground shadow-[3px_3px_0_hsl(var(--foreground)/0.45)] hover:bg-primary/90 hover:shadow-[4px_4px_0_hsl(var(--foreground)/0.45)]',
        secondary:
          'border-primary bg-transparent text-foreground shadow-[3px_3px_0_hsl(var(--foreground)/0.18)] hover:bg-highlighter/40 hover:shadow-[4px_4px_0_hsl(var(--foreground)/0.18)]',
        outline:
          'border-primary bg-transparent text-foreground shadow-[2px_2px_0_hsl(var(--foreground)/0.14)] hover:bg-primary-soft hover:shadow-[3px_3px_0_hsl(var(--foreground)/0.14)]',
        ghost: 'border-transparent bg-transparent shadow-none hover:bg-muted hover:text-foreground',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground shadow-[3px_3px_0_hsl(var(--foreground)/0.35)] hover:bg-destructive/90 hover:shadow-[4px_4px_0_hsl(var(--foreground)/0.35)]',
        success:
          'border-success bg-success text-primary-foreground shadow-[3px_3px_0_hsl(var(--foreground)/0.35)] hover:bg-success/90 hover:shadow-[4px_4px_0_hsl(var(--foreground)/0.35)]',
        accent:
          'border-primary bg-accent text-accent-foreground shadow-[3px_3px_0_hsl(var(--foreground)/0.3)] hover:bg-accent/90 hover:shadow-[4px_4px_0_hsl(var(--foreground)/0.3)]',
        link: 'border-transparent bg-transparent p-0 text-primary underline decoration-[var(--margin-line)] decoration-2 underline-offset-4 shadow-none hover:text-primary/80',
        soft:
          'border-primary bg-primary-soft text-primary shadow-[2px_2px_0_hsl(var(--foreground)/0.16)] hover:bg-accent/70 hover:shadow-[3px_3px_0_hsl(var(--foreground)/0.16)]',
      },
      size: {
        default: 'h-11',
        sm: 'h-9 min-h-9 rounded-[4px_10px_5px_9px] px-3 text-sm',
        lg: 'h-12 rounded-[8px_16px_7px_14px] px-6 text-lg',
        icon: 'h-11 w-11 px-0',
        'icon-sm': 'h-9 w-9 min-h-9 rounded-[4px_10px_5px_9px] px-0',
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
