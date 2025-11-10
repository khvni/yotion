"use client";

import { useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { Block, BlockType } from "@/lib/types";
import { useEditorStore } from "@/lib/store";

interface TextBlockProps {
  block: Block;
  onEnter: () => void;
}

export function TextBlock({ block, onEnter }: TextBlockProps) {
  const { updateBlock, deleteBlock, openMenu, closeMenu, blocks } =
    useEditorStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef<string>(block.content);

  // Update content ref when block changes
  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== block.content) {
      contentRef.current.textContent = block.content;
    }
    lastContentRef.current = block.content;
  }, [block.content]);

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const content = target.textContent || "";
      const selection = window.getSelection();
      const cursorAtStart =
        selection && selection.anchorOffset === 0 && selection.focusOffset === 0;

      // Detect "/" at start of line to open menu
      if (e.key === "/" && cursorAtStart && content === "") {
        e.preventDefault();
        const rect = target.getBoundingClientRect();
        openMenu({ x: rect.left, y: rect.bottom });
        return;
      }

      // Close menu on Escape
      if (e.key === "Escape") {
        closeMenu();
        return;
      }

      // Handle Enter key
      if (e.key === "Enter") {
        e.preventDefault();
        closeMenu();
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
    [openMenu, closeMenu, onEnter, blocks.length, handleDelete]
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
          const selection = window.getSelection();
          range.selectNodeContents(prevElement);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  }, [block.id, blocks, deleteBlock]);

  const commonProps = {
    ref: contentRef,
    contentEditable: true,
    suppressContentEditableWarning: true,
    className: getClassNames(),
    "data-placeholder": getPlaceholder(),
    onKeyDown: handleKeyDown,
    onInput: handleInput,
    onBlur: handleBlur,
    children: block.content,
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
