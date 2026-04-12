import type { InputHTMLAttributes } from 'react'

export default function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60',
        className,
      ].join(' ')}
    />
  )
}

