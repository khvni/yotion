import { Block, CreateBlockInput, UpdateBlockInput } from "./types";

// Simple in-memory database as PGlite has compatibility issues with Next.js API routes
const blocksStore = new Map<string, Block>();
let initialized = false;

async function initializeDatabase() {
  if (initialized) return;

  // Seed with initial blocks
  const initialBlocks: Block[] = [
    {
      id: crypto.randomUUID(),
      type: "h1",
      content: "Welcome to the Block Editor",
      order: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      type: "paragraph",
      content: "This is a simple Notion-like block editor. Press / to see block types.",
      order: 1,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: crypto.randomUUID(),
      type: "paragraph",
      content: "Try editing this text or adding new blocks!",
      order: 2,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const block of initialBlocks) {
    blocksStore.set(block.id, block);
  }

  initialized = true;
}

export async function getAllBlocks(): Promise<Block[]> {
  await initializeDatabase();

  // Convert Map to array and sort by order
  return Array.from(blocksStore.values()).sort((a, b) => a.order - b.order);
}

export async function createBlock(input: CreateBlockInput): Promise<Block> {
  await initializeDatabase();

  const block: Block = {
    id: crypto.randomUUID(),
    type: input.type,
    content: input.content,
    order: input.order,
    metadata: input.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  blocksStore.set(block.id, block);
  return block;
}

export async function updateBlock(id: string, input: UpdateBlockInput): Promise<Block> {
  await initializeDatabase();

  const existingBlock = blocksStore.get(id);
  if (!existingBlock) {
    throw new Error(`Block with id ${id} not found`);
  }

  const updatedBlock: Block = {
    ...existingBlock,
    content: input.content !== undefined ? input.content : existingBlock.content,
    type: input.type !== undefined ? input.type : existingBlock.type,
    order: input.order !== undefined ? input.order : existingBlock.order,
    metadata: input.metadata !== undefined ? input.metadata : existingBlock.metadata,
    updatedAt: new Date(),
  };

  blocksStore.set(id, updatedBlock);
  return updatedBlock;
}

export async function deleteBlock(id: string): Promise<void> {
  await initializeDatabase();
  blocksStore.delete(id);
}
