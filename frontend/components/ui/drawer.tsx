
import * as React from "react"

import { cn } from "@shared/lib/utils"

const Drawer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("fixed inset-0 z-50", className)}
    {...props}
  />
))
Drawer.displayName = "Drawer"

export { Drawer }
