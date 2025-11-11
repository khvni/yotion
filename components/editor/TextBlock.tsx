"use client";

import { useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { Block, BlockType } from "@/lib/types";
import { useEditorStore } from "@/lib/store";

interface TextBlockProps {
  block: Block;
  onEnter: () => void;
}

export function TextBlock({ block, onEnter }: TextBlockProps) {
  const { updateBlock, deleteBlock, openMenu, closeMenu, blocks, setSelectedBlockId, isMenuOpen } = useEditorStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef<string>(block.content);
  const isInitialMount = useRef(true);

  // Initialize content on mount and sync when needed
  useEffect(() => {
    if (contentRef.current) {
      const domContent = contentRef.current.textContent || "";
      const isFocused = document.activeElement === contentRef.current;

      // On initial mount, set the content
      if (isInitialMount.current) {
        contentRef.current.textContent = block.content;
        isInitialMount.current = false;
      } else if (domContent !== block.content) {
        // Only update if element is not focused (external update)
        if (!isFocused) {
          contentRef.current.textContent = block.content;
        }
      }
    }
    lastContentRef.current = block.content;
  }, [block.content, block.type, block.id]);

  // Get Tailwind classes based on block type
  const getClassNames = (): string => {
    const baseClasses =
      "outline-none focus:outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400";
    switch (block.type) {
      case "h1":
        return `${baseClasses} text-4xl font-bold`;
      case "h2":
        return `${baseClasses} text-3xl font-semibold`;
      case "h3":
        return `${baseClasses} text-2xl font-medium`;
      default:
        return `${baseClasses} text-base`;
    }
  };

  const getPlaceholder = (): string => {
    switch (block.type) {
      case "h1":
        return "Heading 1";
      case "h2":
        return "Heading 2";
      case "h3":
        return "Heading 3";
      default:
        return "Type '/' for commands";
    }
  };

  const handleDelete = useCallback(async () => {
    // Find previous block to focus
    const currentIndex = blocks.findIndex((b) => b.id === block.id);
    const previousBlock = currentIndex > 0 ? blocks[currentIndex - 1] : null;

    // Delete from store
    deleteBlock(block.id);

    // Delete from API
    try {
      await fetch(`/api/blocks/${block.id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete block:", error);
    }

    // Focus previous block
    if (previousBlock) {
      setTimeout(() => {
        const prevElement = document.querySelector(
          `[data-block-id="${previousBlock.id}"] [contenteditable]`
        ) as HTMLElement;
        if (prevElement) {
          prevElement.focus();
          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(prevElement);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
    }
  }, [block.id, blocks, deleteBlock]);

  // Handle block type conversion via keyboard shortcuts
  const handleBlockTypeChange = useCallback(
    async (newType: BlockType) => {
      if (block.type === newType) return;

      const currentContent = contentRef.current?.textContent || block.content;
      const updates: Partial<Block> = { type: newType, content: currentContent };

      // Add default metadata for image blocks
      if (newType === "image") {
        updates.metadata = { width: 400, height: 300 };
        updates.content = "";
      }

      // Update store optimistically
      updateBlock(block.id, updates);

      // Save to API
      try {
        const response = await fetch(`/api/blocks/${block.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update block type");
        }

        // Consume the response body to ensure the request completes properly
        await response.json();
      } catch (error) {
        console.error("Failed to update block type:", error);
        // Revert the optimistic update
        updateBlock(block.id, { type: block.type, content: block.content });
        alert(`Error: ${error instanceof Error ? error.message : "Failed to update block type"}. Please try again.`);
      }

      // Refocus the block
      setTimeout(() => {
        if (newType !== "image") {
          const element = document.querySelector(
            `[data-block-id="${block.id}"] [contenteditable]`
          ) as HTMLElement;
          element?.focus();
        }
      }, 0);
    },
    [block.id, block.type, block.content, updateBlock]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const content = target.textContent || "";
      const selection = window.getSelection();
      const cursorAtStart =
        selection && selection.anchorOffset === 0 && selection.focusOffset === 0;

      // Keyboard shortcuts for block types (Ctrl+0-3, Cmd+I for image)
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "0":
            e.preventDefault();
            handleBlockTypeChange("paragraph");
            return;
          case "1":
            e.preventDefault();
            handleBlockTypeChange("h1");
            return;
          case "2":
            e.preventDefault();
            handleBlockTypeChange("h2");
            return;
          case "3":
            e.preventDefault();
            handleBlockTypeChange("h3");
            return;
          case "i":
          case "I":
            e.preventDefault();
            handleBlockTypeChange("image");
            return;
        }
      }

      // Detect "/" to open menu
      if (e.key === "/") {
        e.preventDefault();
        // Set selected block ID before opening menu
        setSelectedBlockId(block.id);
        const rect = target.getBoundingClientRect();
        openMenu({ x: rect.left, y: rect.bottom });
        return;
      }

      // Close menu on Escape
      if (e.key === "Escape") {
        closeMenu();
        return;
      }

      // Handle Enter key - but not if menu is open (let menu handle it)
      if (e.key === "Enter" && !isMenuOpen) {
        e.preventDefault();
        onEnter();
        return;
      }

      // Handle Backspace on empty block
      if (e.key === "Backspace" && content === "" && cursorAtStart) {
        e.preventDefault();
        // Don't delete if it's the only block
        if (blocks.length > 1) {
          handleDelete();
        }
        return;
      }
    },
    [openMenu, closeMenu, onEnter, blocks.length, handleDelete, handleBlockTypeChange, setSelectedBlockId, block.id]
  );

  const handleInput = useCallback(() => {
    if (!contentRef.current) return;
    const newContent = contentRef.current.textContent || "";

    // Update local state immediately
    updateBlock(block.id, { content: newContent });
    lastContentRef.current = newContent;
  }, [block.id, updateBlock]);

  const handleBlur = useCallback(async () => {
    if (!contentRef.current) return;
    const content = contentRef.current.textContent || "";

    // Only save if content changed
    if (content === lastContentRef.current) return;

    // Save to API
    try {
      await fetch(`/api/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      console.error("Failed to save block:", error);
    }
  }, [block.id]);

  const commonProps = {
    ref: contentRef,
    contentEditable: true,
    suppressContentEditableWarning: true,
    className: getClassNames(),
    "data-placeholder": getPlaceholder(),
    onKeyDown: handleKeyDown,
    onInput: handleInput,
    onBlur: handleBlur,
  };

  // Render appropriate tag based on block type
  switch (block.type) {
    case "h1":
      return <h1 {...commonProps} />;
    case "h2":
      return <h2 {...commonProps} />;
    case "h3":
      return <h3 {...commonProps} />;
    default:
      return <p {...commonProps} />;
  }
}
