import * as React from "react"
import { cn } from "@/lib/utils"
import { IconLock, IconEye, IconEyeOff } from "@/components/icons"

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative">
        <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "w-full bg-secondary border border-border rounded-2xl pl-11 pr-11 py-3 text-sm font-medium",
            "outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            "text-foreground placeholder:text-muted-foreground",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword ? (
            <IconEyeOff className="h-5 w-5" />
          ) : (
            <IconEye className="h-5 w-5" />
          )}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
