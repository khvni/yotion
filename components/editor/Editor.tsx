"use client";

import { useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/store";
import { Block as BlockComponent } from "./Block";
import { BlockTypeMenu } from "./BlockTypeMenu";
import { v4 as uuidv4 } from "uuid";

export function Editor() {
  const { blocks, isMenuOpen, addBlock, setBlocks, undo, redo } = useEditorStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastFocusedBlockRef = useRef<string | null>(null);

  // Load blocks on mount
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const response = await fetch("/api/blocks");
        if (response.ok) {
          const data = await response.json();
          setBlocks(data.blocks);
        }
      } catch (error) {
        console.error("Failed to load blocks:", error);
      }
    };

    loadBlocks();
  }, [setBlocks]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+Z for undo
    if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Cmd+Shift+Z for redo
    else if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
      e.preventDefault();
      redo();
    }
  }, [undo, redo]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Create new block
  const createNewBlock = useCallback(
    async (afterBlockId: string, type: "paragraph" | "h1" | "h2" | "h3" | "image" = "paragraph") => {
      const afterBlock = blocks.find((b) => b.id === afterBlockId);
      if (!afterBlock) return;

      const newOrder = afterBlock.order + 1;

      // Update orders of blocks after this one
      const updatedBlocks = blocks.map((block) =>
        block.order >= newOrder
          ? { ...block, order: block.order + 1 }
          : block
      );

      const newBlock = {
        id: uuidv4(),
        type,
        content: "",
        order: newOrder,
        metadata: type === "image" ? { width: 400, height: 300 } : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistic update
      setBlocks([...updatedBlocks, newBlock].sort((a, b) => a.order - b.order));

      // Save to API
      try {
        const response = await fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: newBlock.type,
            content: newBlock.content,
            order: newBlock.order,
            metadata: newBlock.metadata,
          }),
        });

        if (response.ok) {
          const savedBlock = await response.json();
          // Update with server-generated ID and timestamps
          setBlocks(
            [...updatedBlocks.filter((b) => b.id !== newBlock.id), savedBlock].sort(
              (a, b) => a.order - b.order
            )
          );
          lastFocusedBlockRef.current = savedBlock.id;
        }
      } catch (error) {
        console.error("Failed to create block:", error);
      }
    },
    [blocks, setBlocks]
  );

  // Auto-focus new blocks
  useEffect(() => {
    if (lastFocusedBlockRef.current) {
      const blockElement = document.querySelector(
        `[data-block-id="${lastFocusedBlockRef.current}"]`
      );
      if (blockElement) {
        const editableElement = blockElement.querySelector(
          "[contenteditable]"
        ) as HTMLElement;
        if (editableElement) {
          editableElement.focus();
        }
      }
      lastFocusedBlockRef.current = null;
    }
  }, [blocks]);

  return (
    <div
      ref={editorRef}
      className="editor-container max-w-4xl mx-auto py-8 px-4"
    >
      <div className="space-y-1">
        {blocks
          ?.sort((a, b) => a.order - b.order)
          .map((block) => (
            <BlockComponent
              key={block.id}
              block={block}
              onEnter={() => createNewBlock(block.id)}
            />
          ))}
      </div>

      {isMenuOpen && <BlockTypeMenu />}
    </div>
  );
}
