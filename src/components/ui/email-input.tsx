import * as React from "react"
import { cn } from "@/lib/utils"
import { IconMail } from "@/components/icons"

export interface EmailInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <input
        type="email"
        className={cn(
          "w-full bg-secondary border border-border rounded-2xl pl-11 pr-4 py-3 text-sm font-medium",
          "outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
          "text-foreground placeholder:text-muted-foreground",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
)
EmailInput.displayName = "EmailInput"

export { EmailInput }
