# Implementation Guide for E2E Tests

## Quick Start Checklist

Use this guide to quickly implement the required features for the E2E tests to pass.

## 1. Add Data-TestID Attributes

### Editor.tsx
```diff
  return (
    <div
      ref={editorRef}
      className="editor-container max-w-4xl mx-auto py-8 px-4"
+     data-testid="editor"
    >
```

### Block.tsx
```diff
  return (
    <div
      data-block-id={block.id}
+     data-testid="block"
      className="block-wrapper"
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
```

## 2. Create TextBlock.tsx

Create `/components/editor/TextBlock.tsx`:

```typescript
"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store";

interface TextBlockProps {
  block: Block;
  onEnter: () => void;
}

export function TextBlock({ block, onEnter }: TextBlockProps) {
  const { updateBlock, deleteBlock, openMenu, blocks } = useEditorStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Handle Enter key - create new block
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onEnter();
        return;
      }

      // Handle Backspace on empty block - delete block
      if (e.key === "Backspace") {
        const content = contentRef.current?.textContent || "";
        if (content.trim() === "") {
          e.preventDefault();

          // Find previous block to focus
          const currentIndex = blocks.findIndex((b) => b.id === block.id);
          if (currentIndex > 0) {
            const prevBlockId = blocks[currentIndex - 1].id;

            // Delete current block
            deleteBlock(block.id);

            // Delete from API
            fetch(`/api/blocks/${block.id}`, { method: "DELETE" });

            // Focus previous block
            setTimeout(() => {
              const prevElement = document.querySelector(
                `[data-testid="text-block-${prevBlockId}"]`
              ) as HTMLElement;
              prevElement?.focus();
            }, 100);
          }
          return;
        }
      }

      // Handle "/" for slash menu
      if (e.key === "/") {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);

        if (range && contentRef.current) {
          const rect = range.getBoundingClientRect();
          openMenu({ x: rect.left, y: rect.bottom });
        }
      }

      // Handle Escape to close menu/blur
      if (e.key === "Escape") {
        contentRef.current?.blur();
      }
    },
    [block, blocks, onEnter, deleteBlock, openMenu]
  );

  const handleBlur = useCallback(async () => {
    setIsEditing(false);
    const content = contentRef.current?.textContent || "";

    if (content !== block.content) {
      // Update store
      updateBlock(block.id, { content });

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
    }
  }, [block, updateBlock]);

  const handleFocus = () => {
    setIsEditing(true);
  };

  // Render appropriate HTML element based on block type
  const TagName = block.type === "paragraph" ? "p" : block.type;

  return (
    <TagName
      ref={contentRef}
      contentEditable
      data-testid={`text-block-${block.id}`}
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={`
        outline-none focus:outline-none
        ${block.type === "h1" ? "text-4xl font-bold" : ""}
        ${block.type === "h2" ? "text-3xl font-bold" : ""}
        ${block.type === "h3" ? "text-2xl font-bold" : ""}
        ${block.type === "paragraph" ? "text-base" : ""}
        ${isEditing ? "ring-1 ring-blue-300" : ""}
        px-2 py-1 min-h-[2rem]
      `}
    >
      {block.content}
    </TagName>
  );
}
```

## 3. Create ImageBlock.tsx

Create `/components/editor/ImageBlock.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Rnd } from "react-rnd";
import { Block } from "@/lib/types";
import { useEditorStore } from "@/lib/store";

interface ImageBlockProps {
  block: Block;
}

export function ImageBlock({ block }: ImageBlockProps) {
  const { updateBlock } = useEditorStore();
  const [size, setSize] = useState({
    width: block.metadata?.width || 400,
    height: block.metadata?.height || 300,
  });

  const handleResizeStop = async (
    e: any,
    direction: any,
    ref: HTMLElement,
    delta: any,
    position: any
  ) => {
    const newWidth = ref.offsetWidth;
    const newHeight = ref.offsetHeight;

    setSize({ width: newWidth, height: newHeight });

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
      console.error("Failed to update image size:", error);
    }
  };

  return (
    <div data-testid={`image-block-${block.id}`} className="my-4">
      <Rnd
        size={{ width: size.width, height: size.height }}
        onResizeStop={handleResizeStop}
        lockAspectRatio={false}
        minWidth={100}
        minHeight={100}
        maxWidth={1200}
        maxHeight={1200}
        className="border-2 border-dashed border-gray-300 hover:border-blue-400"
      >
        <img
          src={block.content}
          alt={block.metadata?.alt || "Image block"}
          className="w-full h-full object-cover"
        />
      </Rnd>
    </div>
  );
}
```

## 4. Create BlockTypeMenu.tsx

Create `/components/editor/BlockTypeMenu.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "@/lib/store";
import { BlockType } from "@/lib/types";

export function BlockTypeMenu() {
  const { isMenuOpen, menuPosition, closeMenu, selectedBlockId, updateBlock } =
    useEditorStore();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const options: { type: BlockType; label: string; icon: string }[] = [
    { type: "paragraph", label: "Paragraph", icon: "¶" },
    { type: "h1", label: "Heading 1", icon: "H1" },
    { type: "h2", label: "Heading 2", icon: "H2" },
    { type: "h3", label: "Heading 3", icon: "H3" },
    { type: "image", label: "Image", icon: "🖼" },
  ];

  const handleSelect = useCallback(
    async (type: BlockType) => {
      if (!selectedBlockId) return;

      if (type === "image") {
        // Prompt for image URL
        const url = window.prompt("Enter image URL:");
        if (!url) {
          closeMenu();
          return;
        }

        // Update block to image type
        updateBlock(selectedBlockId, {
          type: "image",
          content: url,
          metadata: { width: 400, height: 300 },
        });

        // Save to API
        try {
          await fetch(`/api/blocks/${selectedBlockId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "image",
              content: url,
              metadata: { width: 400, height: 300 },
            }),
          });
        } catch (error) {
          console.error("Failed to update block:", error);
        }
      } else {
        // Update to text block type
        updateBlock(selectedBlockId, { type });

        // Save to API
        try {
          await fetch(`/api/blocks/${selectedBlockId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type }),
          });
        } catch (error) {
          console.error("Failed to update block:", error);
        }
      }

      // Remove the "/" character from content
      const blockElement = document.querySelector(
        `[data-testid="text-block-${selectedBlockId}"]`
      );
      if (blockElement && blockElement.textContent?.startsWith("/")) {
        blockElement.textContent = blockElement.textContent.substring(1);
      }

      closeMenu();
    },
    [selectedBlockId, updateBlock, closeMenu]
  );

  // Handle keyboard navigation
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelect(options[selectedIndex].type);
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, selectedIndex, handleSelect, options, closeMenu]);

  if (!isMenuOpen || !menuPosition) return null;

  return (
    <div
      data-testid="block-type-menu"
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]"
      style={{
        left: menuPosition.x,
        top: menuPosition.y + 5,
      }}
    >
      {options.map((option, index) => (
        <button
          key={option.type}
          data-testid={`menu-option-${option.type}`}
          onClick={() => handleSelect(option.type)}
          className={`
            w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3
            ${index === selectedIndex ? "bg-blue-100" : ""}
          `}
        >
          <span className="text-lg w-8 text-center">{option.icon}</span>
          <span className="text-sm font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
```

## 5. Update Editor.tsx

Fix the API response handling in Editor.tsx:

```diff
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const response = await fetch("/api/blocks");
        if (response.ok) {
          const data = await response.json();
-         setBlocks(data);
+         setBlocks(data.blocks || []);
        }
      } catch (error) {
        console.error("Failed to load blocks:", error);
      }
    };

    loadBlocks();
  }, [setBlocks]);
```

Also update the createNewBlock function to fix the API response:

```diff
        if (response.ok) {
-         const savedBlock = await response.json();
+         const { block: savedBlock } = await response.json();
          // Update with server-generated ID and timestamps
          setBlocks(
            [...updatedBlocks.filter((b) => b.id !== newBlock.id), savedBlock].sort(
              (a, b) => a.order - b.order
            )
          );
          lastFocusedBlockRef.current = savedBlock.id;
        }
```

## 6. Install react-rnd

Make sure react-rnd is installed:

```bash
npm install react-rnd
```

## 7. Seed Test Data (Optional but Recommended)

Create a seed script for consistent testing:

```typescript
// scripts/seed-test-data.ts
import { createBlock } from "@/lib/db";

async function seed() {
  await createBlock({
    type: "h1",
    content: "Test Document",
    order: 0,
  });

  await createBlock({
    type: "paragraph",
    content: "This is a test paragraph.",
    order: 1,
  });

  await createBlock({
    type: "paragraph",
    content: "Another test paragraph.",
    order: 2,
  });

  console.log("Test data seeded successfully!");
}

seed();
```

## 8. Run Tests

After implementing the above:

```bash
# Run tests
npm test

# Run in UI mode for debugging
npx playwright test --ui

# Run in headed mode to see browser
npx playwright test --headed
```

## Common Issues and Solutions

### Issue: Tests timeout waiting for elements
**Solution**: Ensure all data-testid attributes are added exactly as specified

### Issue: API calls fail
**Solution**: Check that API routes are returning data in correct format:
- GET /api/blocks → `{ blocks: Block[] }`
- POST /api/blocks → `{ block: Block }`
- PATCH /api/blocks/[id] → `{ block: Block }`
- DELETE /api/blocks/[id] → `{ success: true }`

### Issue: Slash menu doesn't appear
**Solution**: Make sure "/" keypress triggers `openMenu()` in TextBlock

### Issue: Focus doesn't move to new block
**Solution**: Check that `lastFocusedBlockRef` logic is working in Editor

### Issue: Blocks don't delete
**Solution**: Verify DELETE endpoint is working and deleteBlock is called

## Verification Steps

1. ✅ All data-testid attributes added
2. ✅ TextBlock.tsx created and exported
3. ✅ ImageBlock.tsx created and exported
4. ✅ BlockTypeMenu.tsx created and exported
5. ✅ Editor.tsx API response parsing fixed
6. ✅ react-rnd installed
7. ✅ Test data seeded (optional)
8. ✅ Dev server running
9. ✅ Run `npm test`

## Expected Test Results

All 11 tests should pass:
- ✅ should load and display initial blocks
- ✅ should add new text block on Enter
- ✅ should show slash command menu on /
- ✅ should convert block type from menu
- ✅ should add image block
- ✅ should edit text content
- ✅ should delete empty block on Backspace
- ✅ should persist changes after page refresh
- ✅ should handle keyboard navigation in slash menu
- ✅ should close slash menu on Escape
- ✅ should maintain block order after operations

Good luck! 🚀
