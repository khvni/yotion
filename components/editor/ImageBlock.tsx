import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Block, ImageBlockContent } from '@/lib/editor-types';

interface ImageBlockProps {
  block: Block;
  onUpdate: (id: string, content: ImageBlockContent) => void;
}

const MAX_WIDTH = 800;

export function ImageBlock({ block, onUpdate }: ImageBlockProps) {
  const content = block.content as ImageBlockContent;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localSrc, setLocalSrc] = useState(content.src);
  const [dimensions, setDimensions] = useState({
    width: content.width || 400,
    height: content.height || 300,
  });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSrc(content.src);
  }, [content.src]);

  useEffect(() => {
    setDimensions({
      width: content.width || 400,
      height: content.height || 300,
    });
  }, [content.width, content.height]);

  const persistImage = useCallback(
    async (src: string, width: number, height: number) => {
      setLocalSrc(src);
      setDimensions({ width, height });
      setError(null);

      try {
        onUpdate(block.id, { src, width, height });
      } catch {
        setError('Failed to save image. Please try again.');
      }
    },
    [block.id, onUpdate]
  );

  const processFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);

      try {
        // Upload to local backend
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        const uploadedUrl = data.url;

        // Load image to get dimensions
        const preview = new Image();
        preview.onload = async () => {
          const naturalWidth = preview.width || 400;
          const width = Math.max(
            100,
            Math.min(naturalWidth, MAX_WIDTH)
          );
          const scale = naturalWidth ? width / naturalWidth : 1;
          const height = preview.height
            ? Math.max(100, Math.round(preview.height * scale))
            : 300;

          await persistImage(uploadedUrl, width, height);
          setIsUploading(false);
        };
        preview.onerror = () => {
          setError('Unable to preview uploaded image.');
          setIsUploading(false);
        };
        preview.src = uploadedUrl;
      } catch (err) {
        setError('Failed to upload image. Please try again.');
        setIsUploading(false);
      }
    },
    [persistImage]
  );

  const openFilePicker = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (isUploading) return;
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (isUploading) return;

    event.preventDefault();
    setIsDraggingOver(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleResize = (newWidth: number, newHeight: number) => {
    setDimensions({ width: newWidth, height: newHeight });

    const currentSrc = localSrc || content.src;
    if (!currentSrc) return;

    onUpdate(block.id, {
      src: currentSrc,
      width: newWidth,
      height: newHeight,
    });
  };

  return (
    <div className="my-4 relative">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {!localSrc ? (
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-background p-6 text-center transition-colors cursor-pointer ${
            isDraggingOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25'
          }`}
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Click or drag an image to upload
            </p>
            <p className="text-xs text-muted-foreground">
              PNG or JPG, up to 10 MB
            </p>
          </div>
          {isUploading && (
            <p className="text-xs text-primary">Uploading...</p>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative group"
        >
          <div
            className="relative border-2 border-transparent hover:border-primary/40 rounded transition-colors"
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            <img
              src={localSrc}
              alt=""
              className="h-full w-full cursor-pointer rounded object-cover"
              onClick={openFilePicker}
              onError={(event) => {
                (event.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EImage failed to load%3C/text%3E%3C/svg%3E";
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded bg-background/70 text-sm font-medium text-primary">
                Uploading...
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <span>Click to replace image</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={openFilePicker}
                disabled={isUploading}
              >
                Replace image
              </Button>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}

          {isDraggingOver && (
            <div className="pointer-events-none absolute inset-0 rounded border-2 border-primary border-dashed bg-primary/5" />
          )}
        </div>
      )}
    </div>
  );
}
