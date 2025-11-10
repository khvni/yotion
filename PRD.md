# Product Requirements Document: Simple Notion Block Editor

## 1. Project Overview

### 1.1 What We're Building
A minimal but functional block-based editor inspired by Notion, featuring:
- Text blocks with multiple heading levels
- Image blocks with dynamic resizing
- Slash command interface for block type selection
- Full data persistence to an embedded database
- Undo/redo functionality

### 1.2 Why
This is a take-home exercise demonstrating:
- Mastery of contenteditable and document.execCommand
- Full-stack TypeScript development
- Block-based editor architecture
- State management and persistence
- E2E testing

### 1.3 Constraints
- **NO** text editor libraries (Tiptap, BlockNote, Lexical, etc.)
- **NO** backend-as-a-service (Firebase, Supabase, etc.)
- Must use contenteditable + document.execCommand
- Must complete core functionality within 1 hour
- All code must be TypeScript

---

## 2. Technical Stack

### 2.1 Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **Component Library**: Shadcn UI
- **Image Resizing**: react-rnd
- **State Management**: Zustand with undo/redo middleware

### 2.2 Backend
- **Runtime**: Next.js API Routes
- **Database**: PGlite (embedded PostgreSQL)
- **API Style**: REST

### 2.3 Testing & Quality
- **E2E Testing**: Playwright
- **Linting**: ESLint
- **Formatting**: Prettier

---

## 3. Architecture

### 3.1 Block-Based Editor Pattern
The editor follows a block-based architecture where:
- Each piece of content is a separate "block"
- Blocks have a type (paragraph, h1, h2, h3, image)
- Blocks are rendered vertically in order
- Each block is independently editable

### 3.2 ContentEditable Strategy
Unlike frameworks that avoid contenteditable, we embrace it with:
- **Per-block contenteditable**: Each text block has its own contenteditable div
- **document.execCommand**: For formatting operations (despite deprecation)
- **Event handling**: Custom keyboard handlers for special keys (/, Enter, Backspace)
- **Cursor management**: Track and restore cursor position

### 3.3 State Management Architecture
```
Zustand Store
├── blocks: Block[]           // Current block state
├── history: Block[][]        // Undo stack
├── future: Block[][]         // Redo stack
├── addBlock()                // Add new block
├── updateBlock()             // Update existing block
├── deleteBlock()             // Delete block
├── undo()                    // Restore previous state
└── redo()                    // Restore next state
```

### 3.4 Data Flow
```
User Action → Component → Zustand Store → API Call → PGlite
                                ↓
                         Optimistic Update
```

---

## 4. Data Model

### 4.1 Block Interface
```typescript
interface Block {
  id: string;                    // UUID
  type: BlockType;               // paragraph | h1 | h2 | h3 | image
  content: string;               // Text content or image URL
  order: number;                 // Display order
  metadata?: {                   // Type-specific data
    width?: number;              // Image width
    height?: number;             // Image height
    alt?: string;                // Image alt text
  };
  createdAt: Date;
  updatedAt: Date;
}

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'image';
```

### 4.2 Database Schema
```sql
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('paragraph', 'h1', 'h2', 'h3', 'image')),
  content TEXT NOT NULL DEFAULT '',
  order_num INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blocks_order ON blocks(order_num);
```

---

## 5. Features

### 5.1 Core Features

#### Feature 1: Display Blocks
- Load all blocks from database on page load
- Render blocks in order
- Display text blocks with appropriate HTML tags (p, h1, h2, h3)
- Display image blocks with resizable container

#### Feature 2: Add Text Block
- Click at end of document to add new block
- Press Enter in a block to create new block below
- Default new blocks to paragraph type
- Automatically focus new block

#### Feature 3: Add Image Block
- Slash command menu includes "Image" option
- Prompts for image URL
- Creates image block with default dimensions
- Allows resizing via drag handles

#### Feature 4: Edit Text Block
- Click to focus
- Type to edit content
- Content saves on blur
- Supports basic text formatting via execCommand

#### Feature 5: Edit Image Block
- Click and drag corners to resize
- Maintains aspect ratio by default
- Updates dimensions in real-time
- Saves dimensions on release

#### Feature 6: Delete Block
- Backspace on empty block deletes it
- Focuses previous block after deletion
- Updates order of remaining blocks

### 5.2 Slash Command System

#### Trigger
- User types "/" at start of line or after space
- Opens dropdown menu at cursor position

#### Menu Options
- Paragraph (default)
- Heading 1
- Heading 2
- Heading 3
- Image

#### Behavior
- Arrow keys navigate options
- Enter or click selects option
- Escape closes menu
- Converts current block to selected type
- "/" character is removed after selection

#### Implementation
```typescript
// Detect "/" key
onKeyDown: (e) => {
  if (e.key === '/' && isStartOfLine()) {
    showBlockTypeMenu(cursorPosition);
  }
}

// Menu component
<BlockTypeMenu
  position={cursorPosition}
  onSelect={(type) => convertBlock(currentBlockId, type)}
  onClose={hideMenu}
/>
```

### 5.3 Image Handling

#### Image Block Properties
- URL/source
- Width (default: 400px)
- Height (default: 300px)
- Alt text (optional)

#### Resizing with react-rnd
```typescript
<Rnd
  size={{ width: block.metadata.width, height: block.metadata.height }}
  onResizeStop={(e, direction, ref, delta, position) => {
    updateBlock(block.id, {
      metadata: {
        width: ref.offsetWidth,
        height: ref.offsetHeight
      }
    });
  }}
>
  <img src={block.content} alt={block.metadata.alt} />
</Rnd>
```

### 5.4 Undo/Redo

#### Zustand Middleware
```typescript
const useStore = create<StoreState>()(
  temporal(
    (set) => ({
      blocks: [],
      addBlock: (block) => set((state) => ({
        blocks: [...state.blocks, block]
      })),
      // ... other actions
    })
  )
);

// Temporal middleware adds:
// - useStore.temporal.getState().pastStates
// - useStore.temporal.getState().futureStates
// - useStore.temporal.undo()
// - useStore.temporal.redo()
```

#### Keyboard Shortcuts
- Cmd/Ctrl + Z: Undo
- Cmd/Ctrl + Shift + Z: Redo

---

## 6. API Design

### 6.1 Endpoints

#### GET /api/blocks
Fetch all blocks in order

**Response:**
```json
{
  "blocks": [
    {
      "id": "uuid-1",
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

#### POST /api/blocks
Create new block

**Request:**
```json
{
  "type": "paragraph",
  "content": "New block",
  "order": 5,
  "metadata": {}
}
```

**Response:**
```json
{
  "block": { /* created block */ }
}
```

#### PATCH /api/blocks/[id]
Update existing block

**Request:**
```json
{
  "content": "Updated content",
  "metadata": { "width": 500 }
}
```

**Response:**
```json
{
  "block": { /* updated block */ }
}
```

#### DELETE /api/blocks/[id]
Delete block

**Response:**
```json
{
  "success": true
}
```

---

## 7. Component Structure

### 7.1 Component Tree
```
App (page.tsx)
└── Editor
    ├── Block (for each block)
    │   ├── TextBlock (if text type)
    │   │   └── BlockTypeMenu (on slash command)
    │   └── ImageBlock (if image type)
    │       └── Rnd (react-rnd wrapper)
    └── AddBlockButton
```

### 7.2 Component Responsibilities

#### Editor.tsx
- Fetches blocks from API on mount
- Manages block list
- Handles block creation/deletion
- Provides keyboard shortcuts (undo/redo)
- Syncs Zustand state with API

#### Block.tsx
- Wrapper for all block types
- Handles block-level events (focus, blur)
- Delegates to type-specific component

#### TextBlock.tsx
- Renders contenteditable div
- Handles keyboard events (Enter, Backspace, /)
- Triggers slash command menu
- Uses document.execCommand for formatting
- Saves content on blur

#### ImageBlock.tsx
- Renders image with react-rnd
- Handles resize events
- Updates dimensions in store
- Saves to API on resize stop

#### BlockTypeMenu.tsx
- Dropdown menu for block types
- Keyboard navigation
- Position at cursor
- Converts block type on selection

---

## 8. Development Plan

### 8.1 Phase Breakdown

#### Phase 1: Setup (5 min) [CURRENT]
- ✅ Clean slate (wipe all files except TAKEHOME.md)
- ⏳ Create PRD.md
- ⏳ Initialize Next.js project
- ⏳ Install dependencies
- ⏳ Configure Tailwind + Shadcn
- ⏳ Git commit

#### Phase 2: Infrastructure (10 min)
- Setup PGlite database
- Create blocks table
- Initialize Zustand store with temporal middleware
- Define TypeScript types
- Create base layout
- Git commit

#### Phase 3: Parallel Development (30 min)
**3 concurrent Task agents:**

**Agent A - Frontend:**
- Editor.tsx
- Block.tsx
- TextBlock.tsx
- ImageBlock.tsx
- BlockTypeMenu.tsx

**Agent B - Backend:**
- GET /api/blocks
- POST /api/blocks
- PATCH /api/blocks/[id]
- DELETE /api/blocks/[id]

**Agent C - Testing:**
- Playwright config
- Test: Display blocks
- Test: Add text block
- Test: Add image block
- Test: Edit blocks
- Test: Slash command
- Test: Undo/redo

#### Phase 4: Integration (10 min)
- Wire all components together
- Connect frontend to API
- Run Playwright tests
- Fix critical bugs
- Git commit

#### Phase 5: Polish (5 min)
- Run ESLint
- Run Prettier
- Final test run
- Update README
- Git commit

### 8.2 Parallel Development Strategy

Instead of git worktrees (which are complex for monolithic apps), we use:
- Single working directory
- Multiple Task agents working on separate file paths
- Clear separation of concerns (components/ vs app/api/ vs tests/)
- Agents coordinate through file system
- Main thread integrates and tests

### 8.3 Testing Approach

**E2E Only**: Given 1-hour constraint, focus on Playwright tests that verify:
- User workflows end-to-end
- API integration
- Database persistence
- UI interactions

**No Unit Tests**: Would slow us down, E2E tests provide sufficient coverage

**Test Structure:**
```typescript
test('should load and display blocks', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-block]')).toHaveCount(3);
});

test('should add text block on Enter', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-block]').first().press('Enter');
  await expect(page.locator('[data-block]')).toHaveCount(4);
});

test('should show slash command menu', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-block]').first().type('/');
  await expect(page.locator('[data-menu]')).toBeVisible();
});
```

---

## 9. Success Criteria

### 9.1 Functional Requirements
✅ All blocks load from database on page load
✅ Can add new text blocks (paragraph, h1, h2, h3)
✅ Can add new image blocks with URL
✅ Can edit text block content
✅ Can resize image blocks
✅ Slash command menu works for block type conversion
✅ All changes persist to PGlite database
✅ Undo/redo works correctly
✅ Blocks maintain correct order

### 9.2 Technical Requirements
✅ Uses contenteditable (not rich text libraries)
✅ Uses document.execCommand
✅ All code is TypeScript with strict mode
✅ No BaaS platforms used
✅ PGlite for persistence
✅ Zustand for state management
✅ All Playwright tests pass

### 9.3 Quality Requirements
✅ No ESLint errors
✅ Code is formatted with Prettier
✅ Reasonable component separation
✅ Basic error handling
✅ README with setup instructions

### 9.4 Timeline
✅ Completed within 60 minutes of execution start

---

## 10. Out of Scope (Nice to Haves)

These features would be great but are not required for initial delivery:
- Drag and drop block reordering
- Keyboard shortcuts for formatting (Cmd+B, Cmd+I)
- Block duplication
- Multiple image upload
- Rich text formatting toolbar
- Collaborative editing
- Block templates
- Export to markdown/HTML
- Search functionality
- Dark mode

---

## 11. Technical Notes

### 11.1 ContentEditable Gotchas
- Always prevent default on Enter (handle manually)
- Save cursor position before operations
- Use `document.execCommand` despite deprecation warnings
- Sanitize HTML input to prevent XSS
- Handle empty contenteditable elements carefully

### 11.2 PGlite Considerations
- Embedded in-process PostgreSQL
- Data persists to file system
- Fast for prototypes
- Simple SQL interface
- Auto-creates database on first run

### 11.3 Zustand Temporal Middleware
```typescript
import { temporal } from 'zust and/middleware';

// Provides time-travel debugging
// Tracks all state changes
// Enables undo/redo out of the box
```

### 11.4 React-RND Usage
```typescript
// Controlled component
// Requires size prop
// Fires onResizeStop with new dimensions
// Provides drag handles automatically
```

---

## 12. Development Commands

```bash
# Setup
npm install

# Development
npm run dev

# Testing
npm run test

# Linting
npm run lint

# Format
npm run format

# Build
npm run build
```

---

## 13. Success Metrics

- ⏱️ Time to complete: Target < 60 min
- ✅ Test pass rate: 100%
- 🐛 Critical bugs: 0
- 📝 Code quality: ESLint clean
- 🎨 UI quality: Functional, clean design

---

**Status**: Ready for implementation
**Last Updated**: 2025-11-10
**Version**: 1.0
