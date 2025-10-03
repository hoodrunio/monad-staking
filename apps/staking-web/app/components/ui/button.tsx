import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-border bg-secondary px-5 py-3 font-display text-xs uppercase tracking-[0.18em] text-foreground shadow-[6px_6px_0_rgba(0,0,0,0.55)] transition-transform duration-150 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:shadow-[6px_6px_0_rgba(255,75,84,0.4)] active:translate-x-[2px] active:translate-y-[2px]",
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground hover:shadow-[8px_8px_0_rgba(108,246,255,0.6)]',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground hover:shadow-[8px_8px_0_rgba(255,107,107,0.6)]',
        outline:
          'border-border bg-transparent text-foreground shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:bg-secondary/40',
        secondary:
          'border-border bg-secondary text-secondary-foreground hover:shadow-[8px_8px_0_rgba(48,29,96,0.6)]',
        ghost:
          'border-transparent bg-transparent text-primary hover:text-accent hover:shadow-[6px_6px_0_rgba(255,92,244,0.45)]',
        link: 'border-transparent bg-transparent text-primary underline underline-offset-4 hover:text-accent',
        accent: 'border-accent bg-accent text-accent-foreground hover:shadow-[8px_8px_0_rgba(255,92,244,0.6)]',
      },
      size: {
        default: 'min-h-[2.75rem] px-5',
        sm: 'min-h-[2.25rem] gap-1 px-4 text-[10px]',
        lg: 'min-h-[3.5rem] px-8 text-sm',
        icon: 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
