import { create } from "zustand";
import { Block } from "./types";

interface HistoryState {
  past: Block[][];
  future: Block[][];
}

interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  isMenuOpen: boolean;
  menuPosition: { x: number; y: number } | null;
  history: HistoryState;
}

interface EditorActions {
  setBlocks: (blocks: Block[] | ((prevBlocks: Block[]) => Block[])) => void;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  reorderBlocks: () => void;
  setSelectedBlockId: (id: string | null) => void;
  openMenu: (position: { x: number; y: number }) => void;
  closeMenu: () => void;
  undo: () => void;
  redo: () => void;
}

type EditorStore = EditorState & EditorActions;

const saveToHistory = (state: EditorState): HistoryState => {
  const newPast = [...state.history.past, state.blocks].slice(-100); // Keep last 100
  return {
    past: newPast,
    future: [],
  };
};

export const useEditorStore = create<EditorStore>()((set, get) => ({
  // State
  blocks: [],
  selectedBlockId: null,
  isMenuOpen: false,
  menuPosition: null,
  history: {
    past: [],
    future: [],
  },

  // Actions
  setBlocks: (blocks) =>
    set((state) => ({
      blocks: typeof blocks === "function" ? blocks(state.blocks) : blocks,
    })),

  addBlock: (block) =>
    set((state) => ({
      blocks: [...state.blocks, block],
      history: saveToHistory(state),
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
      history: saveToHistory(state),
    })),

  deleteBlock: (id) =>
    set((state) => {
      const filtered = state.blocks.filter((block) => block.id !== id);
      return {
        blocks: filtered.map((block, index) => ({
          ...block,
          order: index,
        })),
        history: saveToHistory(state),
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

  undo: () =>
    set((state) => {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      return {
        blocks: previous,
        history: {
          past: newPast,
          future: [state.blocks, ...state.history.future],
        },
      };
    }),

  redo: () =>
    set((state) => {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      return {
        blocks: next,
        history: {
          past: [...state.history.past, state.blocks],
          future: newFuture,
        },
      };
    }),
}));
