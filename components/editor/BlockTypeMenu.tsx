"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/store";
import { BlockType } from "@/lib/types";

interface MenuOption {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

const menuOptions: MenuOption[] = [
  {
    type: "paragraph",
    label: "Paragraph",
    icon: "¶",
    description: "Plain text",
  },
  {
    type: "h1",
    label: "Heading 1",
    icon: "H1",
    description: "Large section heading",
  },
  {
    type: "h2",
    label: "Heading 2",
    icon: "H2",
    description: "Medium section heading",
  },
  {
    type: "h3",
    label: "Heading 3",
    icon: "H3",
    description: "Small section heading",
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼",
    description: "Upload or embed an image",
  },
];

export function BlockTypeMenu() {
  const { menuPosition, closeMenu, selectedBlockId, updateBlock, blocks } = useEditorStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position menu at cursor
  const position = menuPosition || { x: 0, y: 0 };

  const handleSelectOption = useCallback(
    async (type: BlockType) => {
      if (!selectedBlockId) {
        closeMenu();
        return;
      }

      const block = blocks.find((b) => b.id === selectedBlockId);
      if (!block) {
        closeMenu();
        return;
      }

      // Clear the "/" character
      const blockElement = document.querySelector(
        `[data-block-id="${selectedBlockId}"] [contenteditable]`
      ) as HTMLElement;
      if (blockElement) {
        blockElement.textContent = "";
      }

      // Update block type
      const updates: Partial<typeof block> = { type };

      // Add default metadata for image blocks
      if (type === "image") {
        updates.metadata = { width: 400, height: 300 };
        updates.content = "";
      }

      // Update store
      updateBlock(selectedBlockId, updates);

      // Save to API
      try {
        await fetch(`/api/blocks/${selectedBlockId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      } catch (error) {
        console.error("Failed to update block type:", error);
      }

      closeMenu();

      // Refocus the block
      setTimeout(() => {
        if (type !== "image") {
          const element = document.querySelector(
            `[data-block-id="${selectedBlockId}"] [contenteditable]`
          ) as HTMLElement;
          element?.focus();
        }
      }, 0);
    },
    [selectedBlockId, blocks, updateBlock, closeMenu]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % menuOptions.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + menuOptions.length) % menuOptions.length);
          break;
        case "Enter":
          e.preventDefault();
          handleSelectOption(menuOptions[selectedIndex].type);
          break;
        case "Escape":
          e.preventDefault();
          closeMenu();
          break;
      }
    },
    [selectedIndex, closeMenu, handleSelectOption]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeMenu]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[280px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 4}px`,
      }}
    >
      <div className="px-2 py-1 text-xs text-gray-500 font-medium">BASIC BLOCKS</div>
      {menuOptions.map((option, index) => (
        <button
          key={option.type}
          className={`w-full px-3 py-2 flex items-start gap-3 hover:bg-gray-100 transition-colors ${
            index === selectedIndex ? "bg-blue-50" : ""
          }`}
          onClick={() => handleSelectOption(option.type)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="text-lg leading-none mt-0.5 flex-shrink-0">{option.icon}</span>
          <div className="flex flex-col items-start text-left">
            <div className="text-sm font-medium text-gray-900">{option.label}</div>
            <div className="text-xs text-gray-500">{option.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
