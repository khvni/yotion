"use client";

import { useState, useEffect } from "react";
import { TextBlock } from "@/components/editor/TextBlock";
import { ImageBlock } from "@/components/editor/ImageBlock";
import { nanoid } from "nanoid";

export type BlockType = "text" | "heading1" | "heading2" | "heading3" | "image";

export type Block = {
  id: string;
  type: BlockType;
  content: string;
  order: number;
};

export default function SimpleEditorPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  useEffect(() => {
    // Load blocks from backend
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    // TODO: Fetch from backend
    // For now, initialize with one empty block
    setBlocks([{
      id: nanoid(),
      type: "text",
      content: "",
      order: 0
    }]);
  };

  const updateBlock = (index: number, updates: Partial<Block>) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], ...updates };
      return newBlocks;
    });
  };

  const addBlock = (index: number, type: BlockType = "text") => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      const newBlock: Block = {
        id: nanoid(),
        type,
        content: "",
        order: index + 1
      };
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
    setFocusedIndex(index + 1);
  };

  const removeBlock = (index: number) => {
    if (blocks.length === 1) return;
    setBlocks(prev => prev.filter((_, i) => i !== index));
    setFocusedIndex(Math.max(0, index - 1));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="space-y-2">
          {blocks.map((block, index) => {
            if (block.type === "image") {
              return (
                <ImageBlock
                  key={block.id}
                  block={block}
                  index={index}
                  isFocused={focusedIndex === index}
                  onUpdate={(updates) => updateBlock(index, updates)}
                  onAdd={() => addBlock(index)}
                  onRemove={() => removeBlock(index)}
                  onFocus={() => setFocusedIndex(index)}
                />
              );
            }

            return (
              <TextBlock
                key={block.id}
                block={block}
                index={index}
                isFocused={focusedIndex === index}
                onUpdate={(updates) => updateBlock(index, updates)}
                onAdd={() => addBlock(index)}
                onRemove={() => removeBlock(index)}
                onChangeType={(type) => updateBlock(index, { type })}
                onFocus={() => setFocusedIndex(index)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
