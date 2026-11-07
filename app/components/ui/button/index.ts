import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-[.95rem] font-bold transition-all duration-200 outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[1.1em] [&_svg]:shrink-0 active:scale-[.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary shadow-[0_8px_22px_-10px_var(--primary)] hover:brightness-110 hover:shadow-[0_12px_28px_-10px_var(--primary)]',
        accent: 'bg-accent text-on-accent shadow-[0_8px_22px_-10px_var(--accent)] hover:brightness-105',
        soft: 'bg-primary/10 text-primary hover:bg-primary/16',
        outline: 'border-2 border-primary/35 bg-transparent text-primary hover:border-primary hover:bg-primary/8',
        glass: 'border border-white/60 bg-white/70 text-[#0e2a3b] backdrop-blur-md hover:bg-white/90',
        ghost: 'text-fg hover:bg-fg/8',
        destructive: 'bg-danger text-white hover:brightness-110',
      },
      size: { default: 'h-11 px-6', sm: 'h-9 px-4 text-sm', lg: 'h-13 px-8 text-base', icon: 'size-10' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
