"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Rnd } from "react-rnd";
import { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store";
import heic2any from "heic2any";

interface ImageBlockProps {
  block: Block;
}

export function ImageBlock({ block }: ImageBlockProps) {
  const { updateBlock, deleteBlock } = useEditorStore();
  const [isResizing, setIsResizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const width = block.metadata?.width || 400;
  const height = block.metadata?.height || 300;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);

      try {
        let fileToProcess = file;

        // Check if the file is HEIC/HEIF format
        const isHEIC = file.type === "image/heic" ||
                       file.type === "image/heif" ||
                       file.name.toLowerCase().endsWith(".heic") ||
                       file.name.toLowerCase().endsWith(".heif");

        if (isHEIC) {
          try {
            // Convert HEIC to JPEG
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.9,
            });

            // heic2any can return an array of blobs, so handle both cases
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            fileToProcess = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), {
              type: "image/jpeg",
            });
          } catch (conversionError) {
            console.error("Failed to convert HEIC:", conversionError);
            alert("Failed to convert HEIC image. Please try a JPG or PNG file.");
            setIsUploading(false);
            return;
          }
        }

        // Convert file to base64 data URL
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;

          // Update block with the data URL
          updateBlock(block.id, { content: dataUrl });

          // Save to API
          try {
            const response = await fetch(`/api/blocks/${block.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: dataUrl }),
            });
            // Consume the response body to ensure the request completes properly
            if (response.ok) {
              await response.json();
            }
          } catch (error) {
            console.error("Failed to save image:", error);
          }

          setIsUploading(false);
        };
        reader.onerror = () => {
          alert("Failed to read file");
          setIsUploading(false);
        };
        reader.readAsDataURL(fileToProcess);
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("Failed to upload image");
        setIsUploading(false);
      }
    },
    [block.id, updateBlock]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".heic", ".heif"],
    },
    multiple: false,
    noClick: !!block.content, // Disable click when image is already loaded
  });

  const handleResizeStop = useCallback(
    async (
      e: MouseEvent | TouchEvent,
      direction: string,
      ref: HTMLElement,
      delta: { width: number; height: number },
      position: { x: number; y: number }
    ) => {
      setIsResizing(false);

      const newWidth = parseInt(ref.style.width);
      const newHeight = parseInt(ref.style.height);

      // Update store
      updateBlock(block.id, {
        metadata: {
          ...block.metadata,
          width: newWidth,
          height: newHeight,
        },
      });

      // Save to API
      try {
        const response = await fetch(`/api/blocks/${block.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metadata: {
              ...block.metadata,
              width: newWidth,
              height: newHeight,
            },
          }),
        });
        // Consume the response body to ensure the request completes properly
        if (response.ok) {
          await response.json();
        }
      } catch (error) {
        console.error("Failed to save image dimensions:", error);
      }
    },
    [block.id, block.metadata, updateBlock]
  );

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  return (
    <div className="my-2">
      <Rnd
        size={{ width, height }}
        minWidth={100}
        minHeight={100}
        maxWidth={800}
        maxHeight={800}
        lockAspectRatio={false}
        disableDragging
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        style={{ position: "relative" }}
        className={`border-2 ${
          isResizing ? "border-blue-500" : isDragActive ? "border-blue-400" : "border-gray-300"
        } rounded-lg overflow-hidden`}
        enableResizing={{
          top: false,
          right: true,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: true,
          bottomLeft: false,
          topLeft: false,
        }}
      >
        <div {...getRootProps()} className="w-full h-full relative">
          <input {...getInputProps()} />
          {block.content ? (
            <img
              src={block.content}
              alt={block.metadata?.alt || "Image"}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="text-center p-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm font-medium">
                  {isUploading
                    ? "Uploading..."
                    : isDragActive
                    ? "Drop image here"
                    : "Click to upload or drag and drop"}
                </p>
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF, WebP, SVG, HEIC</p>
              </div>
            </div>
          )}

          {/* Dimension display */}
          {block.content && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {Math.round(width)} × {Math.round(height)}
            </div>
          )}
        </div>
      </Rnd>

      {/* Image URL input */}
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={block.content}
          onChange={async (e) => {
            const newUrl = e.target.value;
            updateBlock(block.id, { content: newUrl });

            // Debounce API call
            try {
              const response = await fetch(`/api/blocks/${block.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newUrl }),
              });
              // Consume the response body to ensure the request completes properly
              if (response.ok) {
                await response.json();
              }
            } catch (error) {
              console.error("Failed to save image URL:", error);
            }
          }}
          onKeyDown={async (e) => {
            if (e.key === "Backspace" && !block.content) {
              e.preventDefault();
              // Delete block from store
              deleteBlock(block.id);
              // Delete from API
              try {
                await fetch(`/api/blocks/${block.id}`, {
                  method: "DELETE",
                });
              } catch (error) {
                console.error("Failed to delete block:", error);
              }
            }
          }}
          placeholder="Or enter image URL..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {block.content && (
          <button
            onClick={async () => {
              updateBlock(block.id, { content: "" });
              try {
                const response = await fetch(`/api/blocks/${block.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ content: "" }),
                });
                // Consume the response body to ensure the request completes properly
                if (response.ok) {
                  await response.json();
                }
              } catch (error) {
                console.error("Failed to clear image:", error);
              }
            }}
            className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
