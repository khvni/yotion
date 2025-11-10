import { create } from "zustand";
import { temporal } from "zustand/middleware";
import { Block, CreateBlockInput, UpdateBlockInput } from "./types";

interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  isMenuOpen: boolean;
  menuPosition: { x: number; y: number } | null;
}

interface EditorActions {
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  reorderBlocks: () => void;
  setSelectedBlockId: (id: string | null) => void;
  openMenu: (position: { x: number; y: number }) => void;
  closeMenu: () => void;
}

type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>()(
  temporal(
    (set, get) => ({
      // State
      blocks: [],
      selectedBlockId: null,
      isMenuOpen: false,
      menuPosition: null,

      // Actions
      setBlocks: (blocks) => set({ blocks }),

      addBlock: (block) =>
        set((state) => ({
          blocks: [...state.blocks, block],
        })),

      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? {
                  ...block,
                  ...updates,
                  updatedAt: new Date(),
                }
              : block
          ),
        })),

      deleteBlock: (id) =>
        set((state) => {
          const filtered = state.blocks.filter((block) => block.id !== id);
          // Reorder remaining blocks
          return {
            blocks: filtered.map((block, index) => ({
              ...block,
              order: index,
            })),
          };
        }),

      reorderBlocks: () =>
        set((state) => ({
          blocks: state.blocks.map((block, index) => ({
            ...block,
            order: index,
          })),
        })),

      setSelectedBlockId: (id) => set({ selectedBlockId: id }),

      openMenu: (position) =>
        set({
          isMenuOpen: true,
          menuPosition: position,
        }),

      closeMenu: () =>
        set({
          isMenuOpen: false,
          menuPosition: null,
        }),
    }),
    {
      equality: (a, b) => a === b,
      limit: 100, // Keep last 100 states for undo/redo
    }
  )
);

// Undo/redo helpers
export const undo = () => {
  const { undo } = useEditorStore.temporal.getState();
  undo();
};

export const redo = () => {
  const { redo } = useEditorStore.temporal.getState();
  redo();
};
