import express from "express";
import cors from "cors";
import { PGlite } from "@electric-sql/pglite";

const app = express();
const PORT = 3001;

// Initialize PGlite
const db = new PGlite("./data/noto.db");

app.use(cors());
app.use(express.json());

// Initialize database tables
async function initDB() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if we need to seed
  const result = await db.query("SELECT COUNT(*) as count FROM blocks");
  const count = result.rows[0].count;

  if (count === 0) {
    // Seed with welcome content
    await db.exec(`
      INSERT INTO blocks (id, type, content, "order") VALUES
      ('1', 'heading1', 'Welcome to Noto', 0),
      ('2', 'text', 'Start typing or press "/" for commands...', 1);
    `);
  }
}

// GET all blocks
app.get("/api/blocks", async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM blocks ORDER BY "order" ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blocks" });
  }
});

// POST create block
app.post("/api/blocks", async (req, res) => {
  try {
    const { id, type, content, order } = req.body;
    await db.query(
      'INSERT INTO blocks (id, type, content, "order") VALUES ($1, $2, $3, $4)',
      [id, type, content, order]
    );
    res.status(201).json({ id, type, content, order });
  } catch (error) {
    res.status(500).json({ error: "Failed to create block" });
  }
});

// PUT update block
app.put("/api/blocks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, content } = req.body;
    await db.query(
      'UPDATE blocks SET type = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [type, content, id]
    );
    res.json({ id, type, content });
  } catch (error) {
    res.status(500).json({ error: "Failed to update block" });
  }
});

// DELETE block
app.delete("/api/blocks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM blocks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete block" });
  }
});

// PUT reorder blocks
app.put("/api/blocks/reorder", async (req, res) => {
  try {
    const { blocks } = req.body; // Array of {id, order}
    for (const block of blocks) {
      await db.query('UPDATE blocks SET "order" = $1 WHERE id = $2', [block.order, block.id]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to reorder blocks" });
  }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});
