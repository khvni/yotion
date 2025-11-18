"use client";

import { useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/store";
import { Block as BlockComponent } from "./Block";
import { BlockTypeMenu } from "./BlockTypeMenu";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

export function Editor() {
  const { blocks, isMenuOpen, addBlock, setBlocks, undo, redo } = useEditorStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastFocusedBlockRef = useRef<string | null>(null);

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Save focused block before page unload as fallback
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      const activeElement = document.activeElement;

      // Check if the active element is a contenteditable block
      if (activeElement?.hasAttribute('contenteditable')) {
        const blockElement = activeElement.closest('[data-block-id]');
        const blockId = blockElement?.getAttribute('data-block-id');
        const content = (activeElement as HTMLElement).textContent || '';

        if (blockId && content) {
          // Use sendBeacon for reliable save during page unload
          const data = JSON.stringify({ content });
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon(`/api/blocks/${blockId}`, blob);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reorder blocks array
      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex);

      // Update order property for all blocks
      const updatedBlocks = reorderedBlocks.map((block, index) => ({
        ...block,
        order: index,
      }));

      // Optimistic update
      setBlocks(updatedBlocks);

      // Batch update block orders in the database
      try {
        await fetch("/api/blocks/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocks: updatedBlocks.map((block) => ({
              id: block.id,
              order: block.order,
            })),
          }),
        });
      } catch (error) {
        console.error("Failed to reorder blocks:", error);
        // Revert on error
        setBlocks(blocks);
      }
    },
    [blocks, setBlocks]
  );

  // Create new block
  const createNewBlock = useCallback(
    async (
      afterBlockId: string,
      type: "paragraph" | "h1" | "h2" | "h3" | "image" = "paragraph"
    ) => {
      const afterBlock = blocks.find((b) => b.id === afterBlockId);
      if (!afterBlock) return;

      const newOrder = afterBlock.order + 1;

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
      setBlocks((currentBlocks) => {
        // Re-calculate updated blocks with current state
        const updated = currentBlocks.map((block) =>
          block.order >= newOrder ? { ...block, order: block.order + 1 } : block
        );
        return [...updated, newBlock].sort((a, b) => a.order - b.order);
      });

      // Set focus target immediately for the optimistic block
      lastFocusedBlockRef.current = newBlock.id;

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
          // Use functional form to get current state (avoid stale closure)
          setBlocks((currentBlocks) => {
            const filtered = currentBlocks.filter((b) => b.id !== newBlock.id);
            return [...filtered, savedBlock].sort((a, b) => a.order - b.order);
          });
          // Update focus target to the saved block ID
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
        const editableElement = blockElement.querySelector("[contenteditable]") as HTMLElement;
        if (editableElement) {
          editableElement.focus();
        }
      }
      lastFocusedBlockRef.current = null;
    }
  }, [blocks]);

  const sortedBlocks = [...(blocks || [])].sort((a, b) => a.order - b.order);
  const blockIds = sortedBlocks.map((block) => block.id);

  return (
    <div ref={editorRef} className="editor-container max-w-4xl mx-auto py-8 px-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {sortedBlocks.map((block) => (
              <BlockComponent
                key={block.id}
                block={block}
                onEnter={() => createNewBlock(block.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isMenuOpen && <BlockTypeMenu />}
    </div>
  );
}
