"use client";

import { Block as BlockType } from "@/lib/types";
import { useEditorStore } from "@/lib/store";
import { TextBlock } from "./TextBlock";
import { ImageBlock } from "./ImageBlock";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BlockProps {
  block: BlockType;
  onEnter: () => void;
}

export function Block({ block, onEnter }: BlockProps) {
  const { setSelectedBlockId } = useEditorStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleFocus = () => {
    setSelectedBlockId(block.id);
  };

  const handleBlur = () => {
    // Only clear selection if we're not focusing another block
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isStillInBlock = activeElement?.closest(`[data-block-id="${block.id}"]`);
      if (!isStillInBlock) {
        setSelectedBlockId(null);
      }
    }, 0);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={block.id}
      className="block-wrapper group relative"
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-8 top-0 h-full flex items-start pt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        aria-label="Drag handle"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-gray-400 hover:text-gray-600"
        >
          <circle cx="5" cy="3" r="1.5" fill="currentColor" />
          <circle cx="11" cy="3" r="1.5" fill="currentColor" />
          <circle cx="5" cy="8" r="1.5" fill="currentColor" />
          <circle cx="11" cy="8" r="1.5" fill="currentColor" />
          <circle cx="5" cy="13" r="1.5" fill="currentColor" />
          <circle cx="11" cy="13" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {block.type === "image" ? (
        <ImageBlock block={block} />
      ) : (
        <TextBlock block={block} onEnter={onEnter} />
      )}
    </div>
  );
}
