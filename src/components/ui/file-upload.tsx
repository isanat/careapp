import * as React from "react";
import { Upload } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    { className, label, description, icon, error, errorMessage, accept = "image/*", ...props },
    ref
  ) => {
    const fileId = React.useId();
    const [isDragActive, setIsDragActive] = React.useState(false);
    const [fileName, setFileName] = React.useState<string | null>(null);

    const handleDrag = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setIsDragActive(true);
      } else if (e.type === "dragleave") {
        setIsDragActive(false);
      }
    }, []);

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const input = e.currentTarget as HTMLInputElement;
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(e.dataTransfer.files[0]);
          input.files = dataTransfer.files;
          setFileName(e.dataTransfer.files[0].name);
        }
      },
      []
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFileName(e.target.files[0].name);
      }
      props.onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={fileId}
            className="text-xs font-display font-bold uppercase tracking-widest mb-2 block text-foreground"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative rounded-3xl border-2 border-dashed border-border p-10",
            "transition-all duration-200 ease-out",
            "hover:border-primary/40 hover:bg-primary/5",
            "cursor-pointer",
            isDragActive && "border-primary bg-primary/10",
            error && "border-destructive bg-destructive/5",
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id={fileId}
            ref={ref}
            type="file"
            accept={accept}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            {...props}
          />

          <div className="flex flex-col items-center justify-center text-center gap-3">
            {icon || <Upload className="h-8 w-8 text-muted-foreground" />}

            {fileName ? (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">or drag and drop to replace</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground">
                    Click to upload or drag and drop
                  </p>
                  {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {error && errorMessage && (
          <p className="text-sm font-medium text-destructive mt-2">{errorMessage}</p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
