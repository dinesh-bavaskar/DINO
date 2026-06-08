import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitive.Provider

function ToastViewport({ className, ...props }) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]",
        className
      )}
      {...props}
    />
  )
}

function Toast({ className, variant = "default", ...props }) {
  const variants = {
    default: "border bg-background text-foreground",
    destructive:
      "destructive group border-destructive bg-destructive text-white",
  }
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

function ToastAction({ className, ...props }) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      className={cn(
        "ring-offset-background hover:bg-secondary focus:ring-ring group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-white group-[.destructive]:focus:ring-destructive inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function ToastClose({ className, ...props }) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      className={cn(
        "text-foreground/50 hover:text-foreground group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 absolute top-1 right-1 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:ring-2 focus:outline-hidden group-hover:opacity-100",
        className
      )}
      toast-close=""
      {...props}
    >
      <XIcon className="size-4" />
    </ToastPrimitive.Close>
  )
}

function ToastTitle({ className, ...props }) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-semibold [&+div]:text-xs", className)}
      {...props}
    />
  )
}

function ToastDescription({ className, ...props }) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
