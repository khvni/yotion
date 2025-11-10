"use client";

import { Block as BlockType } from "@/lib/types";
import { useEditorStore } from "@/lib/store";
import { TextBlock } from "./TextBlock";
import { ImageBlock } from "./ImageBlock";

interface BlockProps {
  block: BlockType;
  onEnter: () => void;
}

export function Block({ block, onEnter }: BlockProps) {
  const { setSelectedBlockId } = useEditorStore();

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
      data-block-id={block.id}
      className="block-wrapper"
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {block.type === "image" ? (
        <ImageBlock block={block} />
      ) : (
        <TextBlock block={block} onEnter={onEnter} />
      )}
    </div>
  );
}
