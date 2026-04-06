import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'brand';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors";

        const variants: Record<BadgeVariant, string> = {
            default: "bg-surface-hover text-text-muted",
            success: "bg-success/20 text-success",
            warning: "bg-warning/20 text-warning",
            error: "bg-error/20 text-error",
            brand: "bg-brand/20 text-brand-light",
        };

        return (
            <div
                ref={ref}
                className={cn(baseStyles, variants[variant], className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
