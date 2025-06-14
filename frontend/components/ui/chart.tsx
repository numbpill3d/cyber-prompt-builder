
import * as React from "react"

import { cn } from "@shared/lib/utils"

const Chart = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full h-64", className)}
    {...props}
  />
))
Chart.displayName = "Chart"

export { Chart }
