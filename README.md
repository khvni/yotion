# Simple Notion Block Editor

A minimal but functional block-based editor inspired by Notion, built with Next.js, TypeScript, and PGlite.

## Features

✅ **Block-Based Architecture** - Each piece of content is an independent block
✅ **Multiple Text Types** - Paragraph, Heading 1, 2, and 3
✅ **Image Blocks** - With resizable dimensions using react-rnd
✅ **Slash Commands** - Type `/` to open block type menu
✅ **Keyboard Shortcuts** - Enter for new block, Backspace to delete, Cmd+Z/Cmd+Shift+Z for undo/redo
✅ **Data Persistence** - All changes saved to embedded PGlite database
✅ **Undo/Redo** - Full history tracking with Zustand
✅ **ContentEditable** - Native browser contenteditable (no rich text libraries)
✅ **Auto-Save** - Content saved automatically on blur
✅ **TypeScript** - Fully typed with strict mode

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **State Management**: Zustand with custom undo/redo
- **Database**: PGlite (embedded PostgreSQL)
- **Styling**: Tailwind CSS
- **Image Resizing**: react-rnd
- **Testing**: Playwright
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Usage

### Creating Blocks

- **New Block**: Press `Enter` at the end of any block
- **Slash Menu**: Type `/` to open the block type selector
- **Text Editing**: Click any text block to edit inline
- **Image Blocks**: Select "Image" from slash menu, enter URL

### Keyboard Shortcuts

- `Enter` - Create new paragraph block below current block
- `Backspace` - Delete empty block (and focus previous)
- `/` - Open block type menu
- `↑` / `↓` - Navigate menu options (when menu open)
- `Enter` - Select menu option
- `Escape` - Close menu
- `Cmd+Z` - Undo last change
- `Cmd+Shift+Z` - Redo

### Block Types

1. **Paragraph** - Default text block
2. **Heading 1** - Large heading (text-4xl)
3. **Heading 2** - Medium heading (text-3xl)
4. **Heading 3** - Small heading (text-2xl)
5. **Image** - Resizable image with URL input

### Image Blocks

- Resize by dragging corners
- Edit URL in the input field
- Default dimensions: 400×300px
- Constraints: 100-800px width/height

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── blocks/        # Block CRUD endpoints
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── editor/           # Editor components
│       ├── Editor.tsx    # Main editor container
│       ├── Block.tsx     # Block wrapper
│       ├── TextBlock.tsx # Text editing
│       ├── ImageBlock.tsx # Image display
│       └── BlockTypeMenu.tsx # Slash command menu
├── lib/                   # Utilities
│   ├── db.ts             # PGlite database
│   ├── store.ts          # Zustand state
│   └── types.ts          # TypeScript types
├── tests/                 # Playwright tests
│   └── editor.spec.ts    # E2E test suite
├── PRD.md                 # Product Requirements Document
└── TAKEHOME.md            # Original requirements
```

## API Endpoints

### GET /api/blocks

Fetch all blocks ordered by position

**Response:**

```json
{
  "blocks": [
    {
      "id": "uuid",
      "type": "h1",
      "content": "Hello World",
      "order": 0,
      "metadata": {},
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/blocks

Create a new block

**Request:**

```json
{
  "type": "paragraph",
  "content": "New block",
  "order": 5,
  "metadata": {}
}
```

### PATCH /api/blocks/:id

Update an existing block

**Request:**

```json
{
  "content": "Updated content",
  "metadata": { "width": 500 }
}
```

### DELETE /api/blocks/:id

Delete a block

**Response:**

```json
{
  "success": true
}
```

## Development

### Running Tests

```bash
# Run all E2E tests
npm test

# Run tests in UI mode
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test --grep "should load"
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Database

The embedded PGlite database is stored in `./pglite-data/`.

**Schema:**

```sql
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  order_num INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Architecture

### Block-Based Design

Each block is an independent unit with:

- Unique ID
- Type (paragraph, h1, h2, h3, image)
- Content (text or image URL)
- Order (position in document)
- Metadata (type-specific properties)

### State Management

Zustand store manages:

- Blocks array (current state)
- History (past/future states for undo/redo)
- Selected block ID
- Slash menu state

### Data Flow

```
User Action → Component → Zustand Store → API Call → PGlite
                               ↓
                        Optimistic Update
```

## Known Limitations

- No drag-and-drop reordering
- No rich text formatting (bold, italic, etc.)
- Images must be URLs (no upload)
- Single document only
- No collaborative editing
- No export functionality

## Future Enhancements

- Block drag-and-drop reordering
- Rich text formatting toolbar
- Image upload with storage
- Multiple documents
- Search functionality
- Export to Markdown/HTML
- Real-time collaboration
- Dark mode

## License

MIT

## Acknowledgments

Built as a take-home exercise demonstrating:

- ContentEditable mastery
- Full-stack TypeScript
- Block-based editor architecture
- State management with undo/redo
- E2E testing with Playwright
