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
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/blocks");
      const data = await response.json();
      setBlocks(data);
    } catch (error) {
      console.error("Failed to fetch blocks:", error);
      // Fallback to empty block
      setBlocks([{
        id: nanoid(),
        type: "text",
        content: "",
        order: 0
      }]);
    }
  };

  const updateBlock = async (index: number, updates: Partial<Block>) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], ...updates };

      // Save to backend
      const block = newBlocks[index];
      saveBlock(block);

      return newBlocks;
    });
  };

  const saveBlock = async (block: Block) => {
    try {
      await fetch(`http://localhost:3001/api/blocks/${block.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: block.type, content: block.content }),
      });
    } catch (error) {
      console.error("Failed to save block:", error);
    }
  };

  const addBlock = async (index: number, type: BlockType = "text") => {
    const newBlock: Block = {
      id: nanoid(),
      type,
      content: "",
      order: index + 1
    };

    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
    setFocusedIndex(index + 1);

    // Save to backend
    try {
      await fetch("http://localhost:3001/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBlock),
      });
    } catch (error) {
      console.error("Failed to create block:", error);
    }
  };

  const removeBlock = async (index: number) => {
    if (blocks.length === 1) return;

    const blockToRemove = blocks[index];
    setBlocks(prev => prev.filter((_, i) => i !== index));
    setFocusedIndex(Math.max(0, index - 1));

    // Delete from backend
    try {
      await fetch(`http://localhost:3001/api/blocks/${blockToRemove.id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
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
