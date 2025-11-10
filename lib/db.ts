import { PGlite } from "@electric-sql/pglite";
import { Block, CreateBlockInput, UpdateBlockInput } from "./types";
import path from "path";

let db: PGlite | null = null;

export async function getDatabase(): Promise<PGlite> {
  if (db) return db;

  // Use memory mode for Next.js compatibility
  db = new PGlite();

  // Initialize schema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('paragraph', 'h1', 'h2', 'h3', 'image')),
      content TEXT NOT NULL DEFAULT '',
      order_num INTEGER NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_blocks_order ON blocks(order_num);
  `);

  // Seed with initial blocks if empty
  const result = await db.query("SELECT COUNT(*) as count FROM blocks");
  const count = parseInt(result.rows[0].count as string);

  if (count === 0) {
    await seedInitialBlocks(db);
  }

  return db;
}

async function seedInitialBlocks(database: PGlite) {
  const initialBlocks = [
    {
      id: crypto.randomUUID(),
      type: "h1",
      content: "Welcome to the Block Editor",
      order: 0,
    },
    {
      id: crypto.randomUUID(),
      type: "paragraph",
      content: "This is a simple Notion-like block editor. Press / to see block types.",
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      type: "paragraph",
      content: "Try editing this text or adding new blocks!",
      order: 2,
    },
  ];

  for (const block of initialBlocks) {
    await database.query(
      `INSERT INTO blocks (id, type, content, order_num, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [block.id, block.type, block.content, block.order, "{}"]
    );
  }
}

export async function getAllBlocks(): Promise<Block[]> {
  const database = await getDatabase();
  const result = await database.query("SELECT * FROM blocks ORDER BY order_num ASC");

  return result.rows.map((row: any) => ({
    id: row.id,
    type: row.type,
    content: row.content,
    order: row.order_num,
    metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function createBlock(input: CreateBlockInput): Promise<Block> {
  const database = await getDatabase();
  const id = crypto.randomUUID();
  const metadata = JSON.stringify(input.metadata || {});

  await database.query(
    `INSERT INTO blocks (id, type, content, order_num, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, input.type, input.content, input.order, metadata]
  );

  const result = await database.query("SELECT * FROM blocks WHERE id = $1", [id]);
  const row = result.rows[0] as any;

  return {
    id: row.id,
    type: row.type,
    content: row.content,
    order: row.order_num,
    metadata: JSON.parse(row.metadata),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function updateBlock(id: string, input: UpdateBlockInput): Promise<Block> {
  const database = await getDatabase();

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (input.content !== undefined) {
    updates.push(`content = $${paramIndex++}`);
    values.push(input.content);
  }

  if (input.type !== undefined) {
    updates.push(`type = $${paramIndex++}`);
    values.push(input.type);
  }

  if (input.order !== undefined) {
    updates.push(`order_num = $${paramIndex++}`);
    values.push(input.order);
  }

  if (input.metadata !== undefined) {
    updates.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(input.metadata));
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  await database.query(
    `UPDATE blocks SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
    values
  );

  const result = await database.query("SELECT * FROM blocks WHERE id = $1", [id]);
  const row = result.rows[0] as any;

  return {
    id: row.id,
    type: row.type,
    content: row.content,
    order: row.order_num,
    metadata: JSON.parse(row.metadata),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function deleteBlock(id: string): Promise<void> {
  const database = await getDatabase();
  await database.query("DELETE FROM blocks WHERE id = $1", [id]);
}
