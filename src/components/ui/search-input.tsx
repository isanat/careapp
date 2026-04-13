import * as React from "react"
import { cn } from "@/lib/utils"
import { IconSearch, IconX } from "@/components/icons"

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...props }, ref) => {
    const hasValue = Boolean(value && String(value).length > 0)

    return (
      <div className="relative">
        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          className={cn(
            "w-full bg-secondary border border-border rounded-2xl pl-11 pr-11 py-3 text-sm font-medium",
            "outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            "text-foreground placeholder:text-muted-foreground",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            className
          )}
          ref={ref}
          value={value}
          {...props}
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => {
              onClear?.()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
