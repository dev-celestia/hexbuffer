import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from '@phosphor-icons/react'

import { cn } from '@/lib/utils';

import { WindowContext } from "@/providers/window-provider"

const DialogContext = React.createContext<{ absolute?: boolean }>({ absolute: false })

function Dialog({
  absolute: absoluteProp,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root> & { absolute?: boolean }) {
  const { isInWindow } = React.useContext(WindowContext)
  const absolute = absoluteProp ?? isInWindow

  return (
    <DialogContext.Provider value={{ absolute }}>
      <DialogPrimitive.Root data-slot="dialog" {...props} />
    </DialogContext.Provider>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

const DialogPortal = DialogPrimitive.Portal

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  absolute: absoluteProp,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay> & { absolute?: boolean }) {
  const { absolute: contextAbsolute } = React.useContext(DialogContext)
  const { isInWindow } = React.useContext(WindowContext)
  const absolute = absoluteProp ?? contextAbsolute ?? isInWindow

  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // Layout & Positioning
        "inset-0 z-50",
        absolute ? "absolute" : "fixed",

        // Backgrounds & Borders
        "bg-black/50",

        // Interactive & States
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",

        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  portalContainer,
  absolute: absoluteProp,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  portalContainer?: HTMLElement
  absolute?: boolean
}) {
  const { absolute: contextAbsolute } = React.useContext(DialogContext)
  const { isInWindow, windowElement } = React.useContext(WindowContext)
  const absolute = absoluteProp ?? contextAbsolute ?? isInWindow

  const content = (
    <>
      <DialogOverlay absolute={absolute} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Layout & Positioning
          "top-[50%] left-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%]",
          absolute ? "absolute" : "fixed",

          // Sizing & Spacing
          "w-full max-w-[calc(100%-2rem)] sm:max-w-lg gap-4 p-6",

          // Backgrounds & Borders
          "bg-background rounded-sm border shadow-lg",

          // Interactive & States
          "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",

          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              // Layout & Positioning
              "absolute top-4 right-4",

              // Sizing & Spacing
              "rounded-xs opacity-70",

              // Interactive & States
              "ring-offset-background focus:ring-ring transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",

              // Visuals & Colors
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </>
  )

  if (absolute) {
    const container = portalContainer ?? windowElement
    return container ? (
      <DialogPortal data-slot="dialog-portal" container={container}>
        {content}
      </DialogPortal>
    ) : (
      content
    )
  }

  return (
    <DialogPortal data-slot="dialog-portal" container={portalContainer}>
      {content}
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        // Layout & Positioning
        "flex flex-col",

        // Sizing & Spacing
        "gap-2",

        // Typography
        "text-center sm:text-left",

        className
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        // Layout & Positioning
        "flex flex-col-reverse sm:flex-row sm:justify-end",

        // Sizing & Spacing
        "gap-2",

        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        // Typography
        "text-lg leading-none font-semibold",

        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        // Typography
        "text-muted-foreground text-sm",

        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
