import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-orbitron font-medium ring-offset-background transition-all hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-bright-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-cyber-bright-blue text-white hover:bg-cyber-sky-blue hover-glow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover-glow",
        outline:
          "border border-cyber-bright-blue bg-transparent text-cyber-bright-blue hover:bg-cyber-bright-blue hover:text-white hover-glow",
        secondary:
          "bg-cyber-ice-blue text-cyber-black hover:bg-cyber-sky-blue hover:text-white hover-glow",
        ghost: "text-cyber-bright-blue hover:bg-cyber-ice-blue hover-glow",
        link: "text-cyber-bright-blue underline-offset-4 hover:underline hover:text-cyber-sky-blue",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
