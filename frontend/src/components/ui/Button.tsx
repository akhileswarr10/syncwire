import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'success' | 'warning' | 'error';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
        
        const baseStyles = "inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-root disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform active:scale-95";
        
        const variants: Record<ButtonVariant, string> = {
            primary: "bg-brand text-white hover:bg-brand-hover",
            secondary: "bg-surface-hover hover:bg-border-strong text-text-primary",
            ghost: "text-text-muted hover:text-text-primary hover:bg-surface-hover/50 active:scale-100",
            icon: "bg-surface-hover text-text-muted hover:text-brand-light hover:bg-border-strong active:scale-100",
            success: "bg-success text-white hover:bg-success/90",
            warning: "bg-warning text-root hover:bg-warning/90 uppercase tracking-tighter",
            error: "bg-error text-white hover:bg-error/90",
        };

        const sizes: Record<ButtonSize, string> = {
            default: "px-8 py-4 rounded-xl text-base gap-3",
            sm: "px-4 py-2 rounded-lg text-sm gap-2",
            lg: "px-10 py-5 rounded-2xl text-lg gap-4",
            icon: "p-2 rounded-xl",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
