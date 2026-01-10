import * as React from "react"
import { Button as BootstrapButton, ButtonProps as BootstrapButtonProps } from 'react-bootstrap'
import { cn } from "@/lib/utils"

export interface ButtonProps extends Omit<BootstrapButtonProps, 'variant' | 'size'> {
  asChild?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | string
  size?: 'default' | 'sm' | 'lg' | 'icon' | string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild, children, ...props }, ref) => {
    // Map to Bootstrap variants while keeping design
    let bootstrapVariant: string = 'primary'
    let additionalClasses = ''
    
    if (variant === 'default') {
      bootstrapVariant = 'primary'
    } else if (variant === 'destructive') {
      bootstrapVariant = 'danger'
    } else if (variant === 'ghost') {
      bootstrapVariant = 'outline-secondary'
      additionalClasses = 'border-0 bg-transparent hover:bg-slate-100 hover:text-slate-900 text-slate-600'
    } else if (variant === 'outline') {
      bootstrapVariant = 'outline-primary'
      additionalClasses = 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
    } else if (variant === 'secondary') {
      bootstrapVariant = 'secondary'
    } else if (variant === 'link') {
      bootstrapVariant = 'link'
      additionalClasses = 'text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline'
    } else {
      bootstrapVariant = variant
    }

    // Map sizes
    let sizeClasses = ''
    let iconStyle: React.CSSProperties | undefined
    
    if (size === 'icon') {
      sizeClasses = 'p-0'
      iconStyle = { width: '2.5rem', height: '2.5rem', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
    } else if (size === 'default') {
      sizeClasses = 'px-4 py-2'
    } else if (size === 'sm') {
      sizeClasses = 'px-3 text-sm'
    } else if (size === 'lg') {
      sizeClasses = 'px-8'
    }

    const customClasses = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
      size === 'default' && 'h-10',
      size === 'icon' && 'h-10 w-10',
      size === 'sm' && 'h-9',
      size === 'lg' && 'h-11',
      sizeClasses,
      additionalClasses,
      className
    )

    return (
      <BootstrapButton
        ref={ref}
        variant={bootstrapVariant as any}
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : undefined}
        className={customClasses}
        style={iconStyle}
        {...props}
      >
        {children}
      </BootstrapButton>
    )
  }
)
Button.displayName = "Button"

export { Button }
