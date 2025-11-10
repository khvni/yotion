"use client";

import { useState, useCallback } from "react";
import { Rnd } from "react-rnd";
import { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store";

interface ImageBlockProps {
  block: Block;
}

export function ImageBlock({ block }: ImageBlockProps) {
  const { updateBlock } = useEditorStore();
  const [isResizing, setIsResizing] = useState(false);

  const width = block.metadata?.width || 400;
  const height = block.metadata?.height || 300;

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
        await fetch(`/api/blocks/${block.id}`, {
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
        className={`border-2 ${
          isResizing ? "border-blue-500" : "border-gray-300"
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
        <div className="w-full h-full relative">
          {block.content ? (
            <img
              src={block.content}
              alt={block.metadata?.alt || "Image"}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <div className="text-center">
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
                <p className="mt-2 text-sm">No image URL</p>
              </div>
            </div>
          )}

          {/* Dimension display */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {Math.round(width)} × {Math.round(height)}
          </div>
        </div>
      </Rnd>

      {/* Image URL input */}
      <input
        type="text"
        value={block.content}
        onChange={async (e) => {
          const newUrl = e.target.value;
          updateBlock(block.id, { content: newUrl });

          // Debounce API call
          try {
            await fetch(`/api/blocks/${block.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: newUrl }),
            });
          } catch (error) {
            console.error("Failed to save image URL:", error);
          }
        }}
        placeholder="Enter image URL..."
        className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
