# Simple Notion Block Editor

A block-based editor inspired by Notion that implements all core deliverables plus extended features. Built with Next.js, TypeScript, and PGlite (embedded PostgreSQL).

## Implementation Overview

This project fulfills all TAKEHOME.md requirements:

**Core Deliverables:**
- Loads and displays text and image blocks from backend datastore
- Creates new text blocks (paragraph, H1, H2, H3) and image blocks with persistence
- Edits existing blocks with real-time updates to PGlite database
- Custom text block types and image dimensions (height, width, source)
- Full-stack implementation with custom API routes (no backend-as-a-service)

**Extended Features:**
- Drag-and-drop block reordering with dnd-kit
- Image upload from local storage with HEIC conversion support
- Undo/redo functionality with full history tracking
- Rich keyboard shortcuts (Cmd+0-3 for headings, Cmd+I for images)

## Features

- **Block-Based Architecture** - Each piece of content is an independent block
- **Multiple Text Types** - Paragraph, Heading 1, 2, and 3
- **Image Blocks** - Resizable with react-rnd, supports URL input and file upload
- **Drag & Drop Reordering** - Reorder blocks via dnd-kit
- **Slash Commands** - Type `/` to open block type menu
- **Keyboard Shortcuts** - Block type conversion, navigation, undo/redo
- **Data Persistence** - All changes saved to embedded PGlite database
- **Undo/Redo** - Full history tracking with Zustand
- **Image Upload** - Direct upload from local storage with HEIC/HEIF support
- **ContentEditable** - Native browser contenteditable without rich text libraries
- **Auto-Save** - Content saved automatically on blur
- **TypeScript** - Fully typed with strict mode

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **State Management**: Zustand with custom undo/redo
- **Database**: PGlite (embedded PostgreSQL)
- **Styling**: Tailwind CSS
- **Drag & Drop**: dnd-kit
- **Image Handling**: react-rnd, react-dropzone, heic2any
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

- Press `Enter` at the end of any block to create a new paragraph
- Type `/` to open the block type selector
- Click any text block to edit inline
- Select "Image" from slash menu and enter a URL to add images

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Create new paragraph below |
| `Backspace` | Delete empty block and focus previous |
| `/` | Open block type menu |
| `↑` / `↓` | Navigate menu options |
| `Escape` | Close menu |
| `Cmd+0` | Convert to paragraph |
| `Cmd+1` | Convert to Heading 1 |
| `Cmd+2` | Convert to Heading 2 |
| `Cmd+3` | Convert to Heading 3 |
| `Cmd+I` | Convert to image block |
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` | Redo |

### Block Types

| Type | Description |
|------|-------------|
| Paragraph | Default text block |
| Heading 1 | Large heading |
| Heading 2 | Medium heading |
| Heading 3 | Small heading |
| Image | Resizable image from URL |

### Image Blocks

Images support multiple input methods:
- **Drag and drop** images directly onto the block
- **Click to upload** from local storage
- **Enter URL** in the input field below the image

Supported formats: PNG, JPG, GIF, WebP, SVG, HEIC/HEIF (auto-converted to JPEG)

Images can be resized by dragging corners. Default size is 400×300px with constraints between 100-800px for both width and height.

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blocks` | Fetch all blocks ordered by position |
| POST | `/api/blocks` | Create a new block |
| PATCH | `/api/blocks/:id` | Update an existing block |
| DELETE | `/api/blocks/:id` | Delete a block |

### Example Response (GET /api/blocks)

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

PGlite embedded database stored in `./pglite-data/` with the following schema:

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

### Block Structure

Each block contains:
- **id**: Unique identifier
- **type**: Block type (paragraph, h1, h2, h3, image)
- **content**: Text content or image URL
- **order**: Position in document
- **metadata**: Type-specific properties (e.g., image dimensions)

### State Management

Zustand store handles:
- Block array with current state
- History for undo/redo functionality
- Selected block tracking
- Slash menu visibility

### Data Flow

User interactions trigger optimistic updates in the Zustand store, then persist to PGlite via API routes:

```
User Action → Component → Store (optimistic) → API → PGlite
```

## Known Limitations

- No rich text formatting within blocks (bold, italic, links)
- Single document only
- No collaborative editing
- No export functionality

## License

MIT
