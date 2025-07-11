
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-cyber-bright-blue border-opacity-30 bg-white bg-opacity-80 px-3 py-2 text-sm text-cyber-black font-mono ring-offset-background placeholder:text-cyber-black placeholder:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-bright-blue focus-visible:ring-offset-2 hover:border-cyber-bright-blue hover:border-opacity-60 transition-all disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
