import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex h-7 items-center justify-center gap-1 border-2 px-2.5 font-display text-[10px] uppercase tracking-[0.14em] text-foreground shadow-[4px_4px_0_rgba(0,0,0,0.45)] transition-transform duration-150 focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:shadow-[4px_4px_0_rgba(255,75,84,0.35)] active:translate-y-[1px] [&>svg]:size-3 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        destructive: 'border-destructive bg-destructive text-destructive-foreground',
        outline: 'border-border bg-transparent text-foreground shadow-none',
        accent: 'border-accent bg-accent text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
