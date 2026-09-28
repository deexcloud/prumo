import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-accent text-[#191a15] hover:bg-[#f3f4ba] shadow-[0_3px_12px_rgba(232,233,168,.10)]',
        secondary: 'bg-[#24251f] text-[#e5e6dc] hover:bg-[#2d2e27] border border-white/[0.04]',
        outline: 'border border-[#34352f] bg-transparent text-[#c9cbc0] hover:bg-white/[0.04] hover:text-white',
        ghost: 'text-[#92948a] hover:bg-white/[0.055] hover:text-[#f0f1e8]',
        destructive: 'bg-[#542a28] text-[#ffcfca] hover:bg-[#673431]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-xl px-5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />
}

export function Card({ className, ...props }) {
  return <section className={cn('rounded-2xl border border-line bg-panel', className)} {...props} />
}

export function Badge({ className, tone = 'neutral', ...props }) {
  const tones = {
    neutral: 'border-white/[0.07] bg-white/[0.045] text-[#aeb0a5]',
    yellow: 'border-[#e8e9a8]/15 bg-[#e8e9a8]/[0.09] text-[#e8e9a8]',
    green: 'border-[#92c7a2]/15 bg-[#92c7a2]/[0.09] text-[#a6d8b3]',
    blue: 'border-[#8db8dc]/15 bg-[#8db8dc]/[0.09] text-[#a7c9e6]',
    red: 'border-[#dd9991]/15 bg-[#dd9991]/[0.09] text-[#e5aaa2]',
  }
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none', tones[tone], className)} {...props} />
}

export function Input({ className, ...props }) {
  return <input className={cn('flex h-10 w-full rounded-lg border border-[#34352f] bg-[#11120f] px-3 text-sm text-[#e7e8df] placeholder:text-[#73756c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40', className)} {...props} />
}

export function Label({ className, ...props }) {
  return <label className={cn('text-xs font-medium text-[#bfc1b6]', className)} {...props} />
}
