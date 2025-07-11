
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-cyber-bright-blue border-opacity-30 bg-white bg-opacity-80 px-3 py-2 text-base text-cyber-black font-mono ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-cyber-black placeholder:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-bright-blue focus-visible:ring-offset-2 hover:border-cyber-bright-blue hover:border-opacity-60 transition-all disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
