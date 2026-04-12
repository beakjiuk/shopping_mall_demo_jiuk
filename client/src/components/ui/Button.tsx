import type { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variantClass: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
  outline: 'border border-border bg-transparent text-foreground hover:bg-secondary/50',
  ghost: 'bg-transparent text-foreground hover:bg-secondary/50',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-11 px-5 text-base rounded-xl',
  icon: 'h-10 w-10 p-0 rounded-full',
}

export default function Button({
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string
  variant?: Variant
  size?: Size
}) {
  return (
    <button
      {...props}
      className={[
        'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClass[size],
        variantClass[variant],
        className,
      ].join(' ')}
    />
  )
}

