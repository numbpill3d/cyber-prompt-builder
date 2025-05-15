import * as React from "react"
import { cn } from '@shared/lib/utils"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };

    return (
      <div ref={ref} className={cn("flex items-center justify-center", className)}>
        <div className={cn("animate-spin rounded-full border-t-2 border-cyber-bright-blue border-opacity-80", sizeClasses[size])}></div>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner };