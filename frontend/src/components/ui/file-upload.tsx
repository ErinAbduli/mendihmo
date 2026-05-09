import { FileUpload } from "@ark-ui/react/file-upload";
import { ImageIcon, VideoIcon, X, Upload, Plus } from "lucide-react";

// ── Single media upload (image or video) ────────────────────────────────────

interface MediaUploadProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function MediaUpload({ value, onChange }: MediaUploadProps) {
  const isVideo = value?.startsWith("data:video");

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(files[0]);
  };

  if (value) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
          {isVideo ? (
            <video src={value} controls className="max-h-64 w-full object-cover" />
          ) : (
            <img src={value} alt="Cover" className="max-h-64 w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur-sm transition-colors hover:bg-destructive hover:text-white"
            aria-label="Hiq skedarin"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          {isVideo ? "Video e ngarkuar" : "Foto e ngarkuar"} —{" "}
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-primary underline-offset-2 hover:underline"
          >
            ndrysho
          </button>
        </p>
      </div>
    );
  }

  return (
    <FileUpload.Root
      maxFiles={1}
      accept={{ "image/*": [], "video/*": [] }}
      onFileChange={(details) => handleFiles(details.acceptedFiles)}
      className="w-full"
    >
      <FileUpload.Dropzone className="flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">Tërhiq dhe lësho këtu</p>
          <p className="text-sm text-muted-foreground">ose klikoni për të zgjedhur</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5" /> Foto
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1">
            <VideoIcon className="h-3.5 w-3.5" /> Video
          </span>
        </div>
        <FileUpload.Trigger className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80">
          Zgjidh skedarin
        </FileUpload.Trigger>
      </FileUpload.Dropzone>
      <FileUpload.HiddenInput />
    </FileUpload.Root>
  );
}

// ── Multi-photo gallery upload (images only, max 8) ─────────────────────────

interface PhotoGalleryUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function PhotoGalleryUpload({ value, onChange }: PhotoGalleryUploadProps) {
  const addPhotos = (files: File[]) => {
    const remaining = 8 - value.length;
    const toRead = files.slice(0, remaining);
    Promise.all(
      toRead.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") resolve(reader.result);
              else reject();
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    ).then((urls) => onChange([...value, ...urls]));
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Thumbnail grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30">
              <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-destructive hover:text-white"
                aria-label="Hiq foton"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Add more slot */}
          {value.length < 8 && (
            <FileUpload.Root
              maxFiles={8 - value.length}
              accept={{ "image/*": [] }}
              onFileChange={(details) => addPhotos(details.acceptedFiles)}
            >
              <FileUpload.Trigger asChild>
                <button
                  type="button"
                  className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </button>
              </FileUpload.Trigger>
              <FileUpload.HiddenInput />
            </FileUpload.Root>
          )}
        </div>
      )}

      {/* Empty state dropzone */}
      {value.length === 0 && (
        <FileUpload.Root
          maxFiles={8}
          accept={{ "image/*": [] }}
          onFileChange={(details) => addPhotos(details.acceptedFiles)}
          className="w-full"
        >
          <FileUpload.Dropzone className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Shto foto shtesë</p>
              <p className="text-xs text-muted-foreground">Deri në 8 foto • PNG, JPG, WEBP</p>
            </div>
            <FileUpload.Trigger className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80">
              Zgjidh foto
            </FileUpload.Trigger>
          </FileUpload.Dropzone>
          <FileUpload.HiddenInput />
        </FileUpload.Root>
      )}

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length}/8 foto — rri mbi foto dhe kliko × për ta hequr
        </p>
      )}
    </div>
  );
}
