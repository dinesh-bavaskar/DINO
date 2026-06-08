import * as React from "react"
import { cn } from "@/lib/utils"

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-white shadow-sm hover:bg-destructive/80 dark:bg-destructive/60",
    outline: "text-foreground border",
  }
  return (
    <div
      data-slot="badge"
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-transparent px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:size-3 transition-[color,box-shadow] overflow-hidden",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
