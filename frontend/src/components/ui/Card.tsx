import React from 'react';
import { cn } from '@/lib/utils';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("bg-surface border border-border-subtle rounded-xl", className)}
            {...props}
        />
    )
);
Card.displayName = "Card";

const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("p-6", className)}
            {...props}
        />
    )
);
CardContent.displayName = "CardContent";

export { Card, CardContent };
