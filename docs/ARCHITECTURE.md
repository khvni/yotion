# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React Components                       │  │
│  │                                                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐   │  │
│  │  │   Editor   │  │   Block    │  │  BlockTypeMenu   │   │  │
│  │  │ (DndContext│  │ (Sortable) │  │ (Slash Command)  │   │  │
│  │  │  Container)│  │            │  │                  │   │  │
│  │  └─────┬──────┘  └─────┬──────┘  └────────┬─────────┘   │  │
│  │        │               │                   │             │  │
│  │        │         ┌─────┴──────┬────────────┘             │  │
│  │        │         │            │                          │  │
│  │        │    ┌────▼─────┐ ┌───▼──────┐                   │  │
│  │        │    │TextBlock │ │ImageBlock│                   │  │
│  │        │    │(content  │ │(react-rnd│                   │  │
│  │        │    │Editable) │ │ dropzone)│                   │  │
│  │        │    └────┬─────┘ └───┬──────┘                   │  │
│  │        │         │           │                          │  │
│  └────────┼─────────┴───────────┴──────────────────────────┘  │
│           │                                                    │
│           │ reads/writes                                      │
│           ▼                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Zustand Store (lib/store.ts)                 │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  State:                                                   │  │
│  │    • blocks: Block[]                                      │  │
│  │    • selectedBlockId: string | null                       │  │
│  │    • isMenuOpen: boolean                                  │  │
│  │    • history: { past: Block[][], future: Block[][] }      │  │
│  │                                                            │  │
│  │  Actions:                                                 │  │
│  │    • setBlocks() - Update block array                     │  │
│  │    • addBlock() - Add new block                           │  │
│  │    • updateBlock() - Modify existing block                │  │
│  │    • deleteBlock() - Remove block                         │  │
│  │    • undo() / redo() - History navigation                 │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                            │
└───────────────────┼────────────────────────────────────────────┘
                    │
                    │ HTTP (Fetch API)
                    │
┌───────────────────▼────────────────────────────────────────────┐
│                    Next.js Server (API Routes)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              API Routes (app/api/blocks/)              │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  GET    /api/blocks          → getAllBlocks()          │   │
│  │  POST   /api/blocks          → createBlock()           │   │
│  │  PATCH  /api/blocks/[id]     → updateBlock()           │   │
│  │  DELETE /api/blocks/[id]     → deleteBlock()           │   │
│  │  POST   /api/blocks/reorder  → bulk updateBlock()      │   │
│  │                                                         │   │
│  └────────────────┬───────────────────────────────────────┘   │
│                   │                                            │
│                   │ calls                                      │
│                   ▼                                            │
│  ┌────────────────────────────────────────────────────────┐   │
│  │            Database Layer (lib/db.ts)                   │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  In-Memory Storage:                                     │   │
│  │    const blocksStore = new Map<string, Block>()        │   │
│  │                                                         │   │
│  │  Functions:                                             │   │
│  │    • getAllBlocks() → Block[]                           │   │
│  │    • createBlock(input) → Block                         │   │
│  │    • updateBlock(id, input) → Block                     │   │
│  │    • deleteBlock(id) → void                             │   │
│  │                                                         │   │
│  │  ⚠️  Data lost on server restart                        │   │
│  │  ⚠️  PGlite not used (Next.js compatibility issues)     │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### 1. Optimistic Update Flow (Create/Update/Delete)

```
┌─────────────┐
│ User Action │
│ (e.g., type)│
└──────┬──────┘
       │
       │ 1. Immediate update
       ▼
┌──────────────────┐
│  Zustand Store   │
│  blocks: [...]   │ ◄───────────────────┐
└──────┬───────────┘                     │
       │                                 │
       │ 2. Component re-renders        │ 5b. Revert on error
       │    (user sees change)           │
       ▼                                 │
┌──────────────────┐                     │
│   UI Updates     │                     │
└──────────────────┘                     │
       │                                 │
       │ 3. API call (async)             │
       ▼                                 │
┌──────────────────┐                     │
│  POST/PATCH/     │                     │
│  DELETE request  │                     │
└──────┬───────────┘                     │
       │                                 │
       │ 4. Persist to database          │
       ▼                                 │
┌──────────────────┐                     │
│  In-Memory Map   │                     │
│  blocksStore     │                     │
└──────┬───────────┘                     │
       │                                 │
       │ 5a. Success: confirm            │
       │ 5b. Error: revert ──────────────┘
       ▼
    [Done]
```

### 2. Block Type Conversion Flow (Slash Menu)

```
User types "/" in text block
         │
         ▼
┌────────────────────┐
│ BlockTypeMenu      │
│ opens at cursor    │
│ stores blockId     │
└────────┬───────────┘
         │
         │ User selects "H1"
         ▼
┌────────────────────────────┐
│ Read current DOM content   │
│ via querySelector          │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ updateBlock(blockId, {     │
│   type: "h1",              │
│   content: currentContent  │
│ })                         │
└────────┬───────────────────┘
         │
         ├─────────────────────┬─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────┐   ┌──────────────────┐
│ Zustand Store   │   │ PATCH API   │   │ React re-renders │
│ updates type    │   │ /blocks/:id │   │ unmounts <p>     │
└─────────────────┘   └─────────────┘   │ mounts <h1>      │
                                        └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ useEffect fires │
                                        │ on block.type   │
                                        │ change          │
                                        └────────┬────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ Sync content to │
                                        │ new <h1> element│
                                        └─────────────────┘
```

### 3. Drag & Drop Reordering Flow

```
User drags Block A over Block B
         │
         ▼
┌────────────────────────────┐
│ DndContext detects         │
│ DragEndEvent               │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ arrayMove(blocks,          │
│   oldIndex, newIndex)      │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Update order property      │
│ for all blocks:            │
│ block.order = index        │
└────────┬───────────────────┘
         │
         ├──────────────────┬───────────────────┐
         │                  │                   │
         ▼                  ▼                   ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
│ setBlocks()     │ │ POST /api/    │ │ On error:       │
│ (optimistic)    │ │ blocks/reorder│ │ revert to       │
│                 │ │               │ │ original order  │
└─────────────────┘ └───────────────┘ └─────────────────┘
```

### 4. Image Upload Flow (HEIC Conversion)

```
User drops HEIC file on ImageBlock
         │
         ▼
┌────────────────────────────┐
│ react-dropzone onDrop      │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Detect HEIC file           │
│ (by type or extension)     │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ heic2any({                 │
│   blob: file,              │
│   toType: "image/jpeg",    │
│   quality: 0.9             │
│ })                         │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ FileReader.readAsDataURL() │
│ converts to base64         │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ updateBlock(id, {          │
│   content: "data:image/    │
│     jpeg;base64,..."       │
│ })                         │
└────────┬───────────────────┘
         │
         ├──────────────────┬───────────────
         │                  │
         ▼                  ▼
┌─────────────────┐ ┌───────────────┐
│ Zustand Store   │ │ PATCH API     │
└─────────────────┘ └───────────────┘
```

### 5. Undo/Redo Flow

```
User presses Cmd+Z (undo)
         │
         ▼
┌────────────────────────────┐
│ Zustand store.undo()       │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ history = {                │
│   past: [state1, state2],  │
│   future: []               │
│ }                          │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Pop last state from past   │
│ previous = state2          │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ setBlocks(previous)        │
│                            │
│ history.past = [state1]    │
│ history.future =           │
│   [currentState, ...future]│
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Component re-renders with  │
│ previous block state       │
└────────────────────────────┘

⚠️  Note: Undo/redo does NOT sync to API
    (local-only state time travel)
```

## Component Hierarchy

```
App (app/page.tsx)
│
└── Editor (components/editor/Editor.tsx)
    │
    ├── DndContext (drag-and-drop wrapper)
    │   │
    │   └── SortableContext (vertical list sorting)
    │       │
    │       └── [Blocks mapped]
    │           │
    │           └── Block (components/editor/Block.tsx)
    │               │
    │               ├── useSortable (drag handle + sortable behavior)
    │               │
    │               └── [Conditional Rendering]
    │                   │
    │                   ├── TextBlock (type: paragraph/h1/h2/h3)
    │                   │   │
    │                   │   └── contentEditable div
    │                   │       │
    │                   │       ├── onInput → updateBlock()
    │                   │       ├── onBlur → API PATCH
    │                   │       ├── onKeyDown → handle shortcuts
    │                   │       └── useEffect → sync content on type change
    │                   │
    │                   └── ImageBlock (type: image)
    │                       │
    │                       ├── react-dropzone (file upload)
    │                       │   │
    │                       │   ├── onDrop → HEIC conversion
    │                       │   └── FileReader → base64
    │                       │
    │                       ├── Rnd (react-rnd resizable)
    │                       │   │
    │                       │   ├── <img src={block.content} />
    │                       │   └── onResizeStop → updateBlock()
    │                       │
    │                       └── <input> (URL input)
    │                           │
    │                           ├── onChange → updateBlock()
    │                           └── onKeyDown → Backspace deletes
    │
    └── BlockTypeMenu (components/editor/BlockTypeMenu.tsx)
        │
        ├── Positioned absolutely at cursor
        ├── Arrow keys navigate options
        ├── Enter selects → updateBlock(type)
        └── Escape closes
```

## State Management (Zustand Store)

```
useEditorStore (lib/store.ts)
│
├── State
│   ├── blocks: Block[]
│   │   └── Each block: { id, type, content, order, metadata, timestamps }
│   │
│   ├── selectedBlockId: string | null
│   │   └── Tracks which block opened the slash menu
│   │
│   ├── isMenuOpen: boolean
│   │   └── Controls BlockTypeMenu visibility
│   │
│   ├── menuPosition: { x, y } | null
│   │   └── Absolute position for menu rendering
│   │
│   └── history: { past: Block[][], future: Block[][] }
│       └── Stores up to 100 past states for undo/redo
│
└── Actions
    ├── setBlocks(blocks | fn)
    │   └── Supports functional updates to avoid stale closures
    │
    ├── addBlock(block)
    │   └── Appends block + saves to history
    │
    ├── updateBlock(id, updates)
    │   └── Merges updates + saves to history
    │
    ├── deleteBlock(id)
    │   └── Removes block + reindexes orders + saves to history
    │
    ├── reorderBlocks()
    │   └── Reindexes order property (after drag-and-drop)
    │
    ├── setSelectedBlockId(id)
    │   └── Tracks active block for menu
    │
    ├── openMenu(position)
    │   └── Shows slash command menu
    │
    ├── closeMenu()
    │   └── Hides slash command menu
    │
    ├── undo()
    │   └── Restores previous state from history.past
    │
    └── redo()
        └── Restores next state from history.future
```

## API Endpoints

```
/api/blocks (app/api/blocks/route.ts)
│
├── GET /api/blocks
│   ├── Calls: getAllBlocks()
│   ├── Returns: { blocks: Block[] } sorted by order
│   └── Used by: Editor.tsx on mount
│
└── POST /api/blocks
    ├── Calls: createBlock(input)
    ├── Returns: Block (unwrapped, NOT { block: ... })
    └── Used by: Editor.tsx createNewBlock()

/api/blocks/[id] (app/api/blocks/[id]/route.ts)
│
├── PATCH /api/blocks/[id]
│   ├── Calls: updateBlock(id, input)
│   ├── Returns: Block (unwrapped)
│   ├── Used by:
│   │   ├── TextBlock.tsx (content changes, type conversion)
│   │   ├── ImageBlock.tsx (upload, resize, URL input)
│   │   └── BlockTypeMenu.tsx (type conversion)
│   └── ⚠️  Must consume response body! (await response.json())
│
└── DELETE /api/blocks/[id]
    ├── Calls: deleteBlock(id)
    ├── Returns: 204 No Content
    └── Used by: TextBlock.tsx (Backspace), ImageBlock.tsx (Backspace)

/api/blocks/reorder (app/api/blocks/reorder/route.ts)
│
└── POST /api/blocks/reorder
    ├── Body: { blocks: { id, order }[] }
    ├── Calls: updateBlock() for each block
    ├── Returns: { success: true }
    └── Used by: Editor.tsx handleDragEnd()
```

## Database Schema (In-Memory Map)

```
blocksStore: Map<string, Block>

Block Interface (lib/types.ts):
├── id: string (UUID)
├── type: "paragraph" | "h1" | "h2" | "h3" | "image"
├── content: string
│   └── Text blocks: plain text
│   └── Image blocks: data URL (e.g., "data:image/jpeg;base64,...")
├── order: number (sequential: 0, 1, 2, ...)
├── metadata?: BlockMetadata
│   ├── width?: number (image blocks only)
│   ├── height?: number (image blocks only)
│   └── alt?: string (image blocks, unused)
├── createdAt: Date
└── updatedAt: Date

⚠️  Data Structure Notes:
    • Map key = block.id (O(1) lookups)
    • order must be sequential (gaps cause rendering issues)
    • Image content stored as base64 data URLs (doesn't scale)
    • No indexes, constraints, or foreign keys (in-memory only)
```

## Critical Implementation Patterns

### 1. Stale Closure Prevention
```typescript
// ❌ WRONG - stale closure
setBlocks([...blocks, newBlock])

// ✅ RIGHT - functional update
setBlocks((currentBlocks) => [...currentBlocks, newBlock])
```

### 2. Response Body Consumption
```typescript
// ❌ WRONG - unconsumed response
const response = await fetch(url, { method: "PATCH", body })
if (!response.ok) throw new Error()
// Request may not complete!

// ✅ RIGHT - always consume
const response = await fetch(url, { method: "PATCH", body })
if (!response.ok) throw new Error()
await response.json() // Even if data not used
```

### 3. ContentEditable Pattern (Uncontrolled)
```typescript
// ❌ WRONG - controlled (causes reversed text)
<div contentEditable>{block.content}</div>

// ✅ RIGHT - uncontrolled
<div contentEditable />

useEffect(() => {
  // Set content once on mount
  if (!initialized) {
    element.textContent = block.content
    setInitialized(true)
  }
}, [])

useEffect(() => {
  // Only sync on external changes (type switch)
  element.textContent = block.content
}, [block.type])
```

### 4. Optimistic UI Pattern
```typescript
// 1. Update store immediately (optimistic)
updateBlock(id, updates)

// 2. User sees change instantly
// 3. API call happens async
const response = await fetch(url, { method: "PATCH", ... })

// 4. On error: revert
if (!response.ok) {
  updateBlock(id, previousState)
}
```

## Known Issues & Limitations

| Issue | Impact | Workaround |
|-------|--------|------------|
| In-memory database | Data lost on restart | Use PostgreSQL in production |
| Base64 image storage | Doesn't scale | Use cloud storage (S3, Cloudinary) |
| No rich text formatting | Can't bold/italic | Add inline styles or use Slate.js |
| Single document | No multi-page support | Add document table + routing |
| No collaboration | No real-time editing | Add WebSockets or Yjs CRDT |
| Order must be sequential | Gaps cause bugs | Reindex after every delete/reorder |
