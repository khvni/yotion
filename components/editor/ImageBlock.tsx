"use client";

import { useState } from "react";
import { Block } from "@/app/simple-editor/page";

type ImageBlockProps = {
  block: Block;
  index: number;
  isFocused: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onAdd: () => void;
  onRemove: () => void;
  onFocus: () => void;
};

export const ImageBlock = ({
  block,
  isFocused,
  onUpdate,
  onAdd,
  onRemove,
  onFocus,
}: ImageBlockProps) => {
  // Parse content as JSON {src, width, height}
  const imageData = block.content ? JSON.parse(block.content) : { src: "", width: 600, height: 400 };
  const [isEditing, setIsEditing] = useState(!imageData.src);

  const handleSrcChange = (src: string) => {
    const newData = { ...imageData, src };
    onUpdate({ content: JSON.stringify(newData) });
    if (src) {
      setIsEditing(false);
    }
  };

  const handleSizeChange = (width: number, height: number) => {
    const newData = { ...imageData, width, height };
    onUpdate({ content: JSON.stringify(newData) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAdd();
    }
    if (e.key === "Backspace" && !imageData.src) {
      e.preventDefault();
      onRemove();
    }
  };

  if (isEditing || !imageData.src) {
    return (
      <div
        onClick={onFocus}
        onKeyDown={handleKeyDown}
        className="rounded border-2 border-dashed border-gray-300 p-4"
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Enter image URL..."
            value={imageData.src}
            onChange={(e) => handleSrcChange(e.target.value)}
            onFocus={onFocus}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            autoFocus={isFocused}
          />
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Width:</label>
              <input
                type="number"
                value={imageData.width}
                onChange={(e) => handleSizeChange(parseInt(e.target.value) || 0, imageData.height)}
                className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Height:</label>
              <input
                type="number"
                value={imageData.height}
                onChange={(e) => handleSizeChange(imageData.width, parseInt(e.target.value) || 0)}
                className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onFocus} className="group relative">
      <img
        src={imageData.src}
        alt="Block image"
        style={{ width: imageData.width, height: imageData.height }}
        className="rounded"
      />
      <button
        onClick={() => setIsEditing(true)}
        className="absolute right-2 top-2 hidden rounded bg-white px-2 py-1 text-xs shadow group-hover:block"
      >
        Edit
      </button>
    </div>
  );
};
