import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
  hint?: string;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, type = "text", error, label, hint, ...props }, ref) => {
    const inputId = React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-display font-bold uppercase tracking-widest mb-2 block text-foreground"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm font-medium",
            "placeholder:text-muted-foreground",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "hover:border-primary/40",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-muted",
            error && "border-2 border-destructive bg-destructive/5 focus:ring-destructive/20 focus:border-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-muted-foreground mt-2">{hint}</p>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export { TextInput };
