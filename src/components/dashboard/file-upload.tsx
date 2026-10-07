"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { File as FileIcon, FileUp, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_EXTENSIONS,
  acceptAttribute,
  formatFileSize,
  validateUpload,
  type UploadKind,
} from "@/lib/upload";
import { cn } from "@/lib/utils";

/** Metadata returned by the upload route for a stored object. */
export interface UploadedFile {
  key: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

interface FileUploadProps {
  /** Whether a document or an image is being uploaded. */
  kind: UploadKind;
  /** The uploaded object, or null when nothing has been uploaded yet. */
  value: UploadedFile | null;
  onChange: (value: UploadedFile | null) => void;
  disabled?: boolean;
}

/**
 * Drag-and-drop file picker with an upload progress bar. Validation happens
 * client-side before the request and is enforced again by `/api/upload`. Images
 * show a preview, other files show their name and size.
 */
export function FileUpload({
  kind,
  value,
  onChange,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Release the object URL whenever it is replaced or the field unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function resetPreview() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  function upload(file: File) {
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setIsUploading(false);

      try {
        const body = JSON.parse(xhr.responseText) as {
          success: boolean;
          data?: UploadedFile;
          error?: string;
        };

        if (xhr.status >= 200 && xhr.status < 300 && body.success && body.data) {
          setProgress(100);
          onChange(body.data);
          return;
        }

        resetPreview();
        toast.error(body.error ?? "Upload failed.");
      } catch {
        resetPreview();
        toast.error("Upload failed. Please try again.");
      }
    };
    xhr.onerror = () => {
      setIsUploading(false);
      resetPreview();
      toast.error("Upload failed. Please try again.");
    };
    xhr.send(formData);
  }

  function handleFile(file: File | undefined) {
    if (!file || disabled || isUploading) return;

    const validation = validateUpload(
      { name: file.name, size: file.size },
      kind,
    );

    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    if (kind === "image") {
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(file);
      });
    }

    upload(file);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0]);
    // Reset so picking the same file again still fires a change event.
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function handleRemove() {
    resetPreview();
    setProgress(0);
    onChange(null);
  }

  const hint = UPLOAD_EXTENSIONS[kind].map((extension) => `.${extension}`).join(", ");

  if (value || isUploading) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex items-start gap-3">
          {kind === "image" && previewUrl ? (
            // Object URL preview: next/image cannot handle a blob URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={value?.fileName ?? "Image preview"}
              className="size-12 shrink-0 rounded-md border border-border object-cover"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileIcon aria-hidden className="size-5 text-muted-foreground" />
            </span>
          )}

          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate text-sm font-medium">
              {value?.fileName ?? "Uploading…"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isUploading
                ? `Uploading… ${progress}%`
                : value
                  ? formatFileSize(value.fileSize)
                  : ""}
            </p>

            {isUploading ? (
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove file"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={kind === "image" ? "Upload image" : "Upload file"}
      aria-disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-border p-6 text-center transition-colors hover:bg-muted/40",
        isDragging && "border-foreground/40 bg-muted/60",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <FileUp aria-hidden className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium">Drag &amp; drop or click to browse</p>
      <p className="text-xs text-muted-foreground">
        {hint} · max {formatFileSize(MAX_UPLOAD_BYTES[kind])}
      </p>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={acceptAttribute(kind)}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
