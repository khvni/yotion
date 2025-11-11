# Bug Fixes - January 10, 2025

## Issues Fixed

### 1. ReferenceError: Cannot access 'handleSelectOption' before initialization

**Location:** `components/editor/BlockTypeMenu.tsx:77`

**Issue:** The `handleKeyDown` callback referenced `handleSelectOption` in its dependency array before `handleSelectOption` was defined, causing a temporal dead zone error when typing "/" to open the menu.

**Fix:** Moved the `handleSelectOption` function definition before `handleKeyDown` to ensure proper initialization order.

**Changes:**
- Reordered functions in BlockTypeMenu.tsx so `handleSelectOption` is defined at line 55, before `handleKeyDown` which is now at line 114

---

### 2. Enter Key Not Moving Cursor to New Block

**Location:** `components/editor/Editor.tsx:92-109`

**Issue:** When pressing Enter to create a new block, the cursor would not automatically focus on the newly created block. The code used `lastFocusedBlockRef` with a useEffect to focus, but there was a race condition.

**Fix:** Removed the ref-based focus approach and instead added a direct `setTimeout` call after the block is saved to the API, ensuring the new block is rendered before focusing.

**Changes:**
- Removed `lastFocusedBlockRef` variable
- Removed the auto-focus useEffect hook
- Added direct focus logic with setTimeout(50ms) inside the `createNewBlock` function after successful API response

---

### 3. Text Appearing in Reverse Order When Typing

**Location:** `components/editor/TextBlock.tsx:17-43, 182-193`

**Issue:** Text appeared reversed (e.g., "hello" → "olleh") because React was controlling the contentEditable element's content via the `children` prop, which conflicts with user input. Every keystroke would trigger a store update, which triggered a useEffect that reset `textContent`, moving the cursor to the beginning.

**Fix:** 
1. Removed the `children` prop from the contentEditable elements
2. Changed from controlled to uncontrolled contentEditable by setting initial content only once in a useEffect
3. Only sync content from store when the block type changes (external update like from menu)
4. Added `isComposingRef` to track IME composition state
5. Added composition event handlers to prevent interference during typing

**Changes:**
- Added `isComposingRef` and `initializedRef` refs
- Changed content sync useEffect to only run once on mount
- Added a separate useEffect that syncs only on `block.type` changes
- Removed `children: block.content` from commonProps
- Added `onCompositionStart` and `onCompositionEnd` handlers

---

### 4. "/" Menu Not Appearing with Existing Text

**Location:** `components/editor/TextBlock.tsx:113-119`

**Issue:** The "/" command menu would only open when the block was completely empty (`content === ""`), preventing users from opening the menu when there was already text in the block.

**Fix:** Removed the empty content check so the menu opens whenever "/" is pressed, regardless of existing content.

**Changes:**
- Changed condition from `if (e.key === "/" && content === "")` to `if (e.key === "/")`
- Removed the content check entirely from the "/" key handler

---

### 5. Block Type Switching Creating New Blocks Instead of Updating Existing

**Location:** `components/editor/BlockTypeMenu.tsx:55-110` and `components/editor/TextBlock.tsx:27-34`

**Problem:** When using the "/" menu to switch block types (e.g., typing text in a paragraph, pressing "/", then clicking "H1"), the application was creating a brand new block instead of updating the existing block's type. This resulted in:
- The original paragraph block remaining unchanged
- A new H1 block being created below it
- Loss of the original text content

**Root Cause Analysis:**

The bug occurred due to a fundamental misunderstanding in the `BlockTypeMenu` component. The original implementation:
1. Called `addBlock()` to create a new block
2. Then tried to delete the old block
3. This approach failed because it was creating new blocks instead of transforming existing ones

**The Fix:**

Changed the menu to properly update the existing block instead of creating a new one:

**BlockTypeMenu.tsx (lines 55-110):**
```tsx
const handleSelectOption = useCallback(
  async (type: BlockType) => {
    if (!selectedBlockId) {
      closeMenu();
      return;
    }

    const block = blocks.find((b) => b.id === selectedBlockId);
    if (!block) {
      closeMenu();
      return;
    }

    // Get current content from the DOM to preserve it
    const blockElement = document.querySelector(
      `[data-block-id="${selectedBlockId}"] [contenteditable]`
    ) as HTMLElement;
    const currentContent = blockElement?.textContent || block.content;

    // Update block type while preserving content
    const updates: Partial<typeof block> = { type, content: currentContent };

    // Add default metadata for image blocks
    if (type === "image") {
      updates.metadata = { width: 400, height: 300 };
      updates.content = "";
    }

    // Update store
    updateBlock(selectedBlockId, updates);

    // Save to API
    try {
      await fetch(`/api/blocks/${selectedBlockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to update block type:", error);
    }

    closeMenu();

    // Refocus the block
    setTimeout(() => {
      if (type !== "image") {
        const element = document.querySelector(
          `[data-block-id="${selectedBlockId}"] [contenteditable]`
        ) as HTMLElement;
        element?.focus();
      }
    }, 0);
  },
  [selectedBlockId, blocks, updateBlock, closeMenu]
);
```

**Key Changes:**
1. **Removed:** All `addBlock()` and `deleteBlock()` calls
2. **Added:** `updateBlock()` call to modify the existing block in-place
3. **Content Preservation:** Read current content from DOM before updating to ensure no text is lost
4. **API Call:** Changed from POST (create) to PATCH (update) to `/api/blocks/${selectedBlockId}`
5. **Focus Management:** Refocus the same block after type change (except for image blocks)

**TextBlock.tsx (lines 27-34):**
```tsx
// Update content when block TYPE changes (external update like from menu)
// This runs when switching between p/h1/h2/h3, which creates a new DOM element
useEffect(() => {
  if (contentRef.current) {
    contentRef.current.textContent = block.content;
    lastContentRef.current = block.content;
  }
}, [block.type]);
```

This useEffect ensures that when React switches between DOM element types (e.g., `<p>` → `<h1>`), the content is properly synced from the store to the new element.

**How It Works Now:**

1. User types "Hello World" in a paragraph block
2. User presses "/" to open the menu (menu stores the current block's ID via `selectedBlockId`)
3. User clicks "Heading 1"
4. Menu handler:
   - Finds the block by `selectedBlockId`
   - Reads current DOM content: "Hello World"
   - Calls `updateBlock(selectedBlockId, { type: "h1", content: "Hello World" })`
   - Sends PATCH request to `/api/blocks/${selectedBlockId}`
5. React re-renders:
   - Unmounts the old `<p>` element
   - Mounts a new `<h1>` element
   - TextBlock's type-change useEffect fires
   - Sets the new element's textContent to "Hello World"
6. Focus is restored to the updated block

**Result:** The same block is now an H1 with "Hello World" text preserved. No new blocks are created.

---

### 6. Image Block Missing Dropzone Functionality

**Location:** `components/editor/ImageBlock.tsx`

**Issue:** Clicking "Image" from the "/" menu didn't provide an intuitive way to upload images. Users had to manually paste image URLs into a text input, which is cumbersome. There was no drag-and-drop or file upload functionality.

**Fix:** Integrated `react-dropzone` library to provide a modern drag-and-drop interface for image uploads.

**Changes:**
- Installed `react-dropzone` package
- Added `useDropzone` hook with file handling logic
- Implemented `onDrop` callback that:
  - Accepts image files (PNG, JPG, JPEG, GIF, WEBP)
  - Reads files using FileReader API
  - Converts to base64 data URLs
  - Updates block content and saves to API
- Updated UI to show:
  - "Drag & drop image here" with icon when no image
  - "or click to browse" instruction
  - "PNG, JPG, GIF up to 10MB" file type info
  - Blue highlight when dragging files over the dropzone
  - "Drop to replace image" overlay when dragging over existing image
- Added `noClick: !!block.content` to prevent click-to-browse when image already exists (drag-and-drop still works)
- Kept the URL input field as an alternative method with updated placeholder "Or paste image URL..."

**Files Modified:**
- `components/editor/ImageBlock.tsx`: Complete rewrite of the empty state to use dropzone
- `package.json`: Added `react-dropzone` dependency

---

### 7. API Response Format Bug: Blocks Created with Undefined IDs ✅ FIXED

**Location:** `app/api/blocks/route.ts:54`

**Symptom:** When creating multiple empty blocks rapidly (e.g., pressing Enter twice), typing in one empty block caused ALL empty blocks to display the same text. This was a critical data corruption bug.

**Example:**
1. User presses Enter twice from the last block → creates 2 empty blocks
2. User types "test" in the second empty block
3. BOTH empty blocks now showed "test" instead of just the second one

**Root Cause - API Response Mismatch:**

The bug was caused by a mismatch between the API response format and what the client expected:

**API was returning:** `{ block: { id: "...", type: "...", ... } }`
**Client was expecting:** `{ id: "...", type: "...", ... }`

When the client called `await response.json()`, it received an object with a `block` property, not the block itself. This meant `savedBlock.id` was `undefined` because the actual block data was nested inside `savedBlock.block.id`.

**Timeline of the Bug:**
```
T1: User creates new block by pressing Enter
    - Client creates optimistic block with UUID: "abc-123"
    - Client adds block to store
    - Client sends POST to /api/blocks

T2: API responds with { block: { id: "xyz-789", ... } }
    - Client does: const savedBlock = await response.json()
    - savedBlock = { block: { id: "xyz-789", ... } }
    - savedBlock.id = undefined (should be "xyz-789")
    
T3: Client tries to replace optimistic block
    - Filters out optimistic block with id="abc-123" ✅
    - Adds savedBlock with id=undefined ❌
    - Now store has a block with undefined ID

T4: User types in that block
    - TextBlock calls updateBlock(undefined, { content: "test" })
    - Store's updateBlock matches ALL blocks with id=undefined
    - All blocks with undefined IDs get updated simultaneously
```

**The Fix:**

Changed the API response to return the block directly instead of wrapped in an object:

**app/api/blocks/route.ts (line 54):**
```tsx
// BEFORE (returns wrapped object):
const block = await createBlock(input);
return NextResponse.json({ block }, { status: 201 });

// AFTER (returns block directly):
const block = await createBlock(input);
return NextResponse.json(block, { status: 201 });
```

**Additional Fixes for Stale Closures:**

While investigating this bug, we also discovered and fixed stale closure issues in the Editor component:

1. **lib/store.ts - Added functional setState support:**
   ```tsx
   // Updated setBlocks to accept function or value
   setBlocks: (blocks: Block[] | ((prevBlocks: Block[]) => Block[])) => void;
   
   // Implementation checks type and handles both
   setBlocks: (blocks) =>
     set((state) => ({
       blocks: typeof blocks === "function" ? blocks(state.blocks) : blocks,
     })),
   ```

2. **components/editor/Editor.tsx - Line 145-152 (Optimistic update):**
   ```tsx
   // BEFORE (stale closure):
   const updatedBlocks = blocks.map(block => ...);
   setBlocks([...updatedBlocks, newBlock]);
   
   // AFTER (functional form):
   setBlocks((currentBlocks) => {
     const updated = currentBlocks.map((block) =>
       block.order >= newOrder ? { ...block, order: block.order + 1 } : block
     );
     return [...updated, newBlock].sort((a, b) => a.order - b.order);
   });
   ```

3. **components/editor/Editor.tsx - Line 173-176 (API response handler):**
   ```tsx
   // BEFORE (stale closure):
   setBlocks([...updatedBlocks.filter(b => b.id !== newBlock.id), savedBlock]);
   
   // AFTER (functional form):
   setBlocks((currentBlocks) => {
     const filtered = currentBlocks.filter((b) => b.id !== newBlock.id);
     return [...filtered, savedBlock].sort((a, b) => a.order - b.order);
   });
   ```

**Testing:**
1. Created fresh database by restarting server
2. Pressed Enter twice to create two empty blocks
3. Typed "only in second block" into the second block
4. ✅ First block remained empty with placeholder text
5. ✅ Second block displayed "only in second block"
6. ✅ No console errors about undefined IDs
7. ✅ Server logs showed successful POST and PATCH requests with valid IDs

**Files Modified:**
- `app/api/blocks/route.ts`: Changed response format from `{ block }` to direct block object
- `lib/store.ts`: Added functional setState support
- `components/editor/Editor.tsx`: Changed two setBlocks calls to use functional form

**Status:** ✅ **FIXED AND TESTED**

---

### 8. HEIC Image Format Not Supported ✅ FIXED

**Location:** `components/editor/ImageBlock.tsx`

**Symptom:** When uploading HEIC images (Apple's default photo format from iPhones), the image would not display. The browser showed a broken image icon with just the text "Image", even though the base64 data was correctly stored in the database.

**Root Cause:**

HEIC (High Efficiency Image Format) is not natively supported by most web browsers. When an HEIC file was uploaded:
1. FileReader successfully converted it to base64: `data:image/heic;base64,AAAAJGZ0e...`
2. The base64 string was correctly saved to the database
3. The `<img>` tag tried to display it but browsers don't support `image/heic` MIME type
4. Result: broken image icon displayed

**The Fix:**

Installed `heic2any` library to automatically convert HEIC images to JPEG format before storing:

**Changes:**
1. Added `heic2any` package to dependencies
2. Modified the `onDrop` callback in ImageBlock.tsx to:
   - Detect HEIC/HEIF files by checking `file.type` or file extension
   - Convert HEIC to JPEG using `heic2any` with 90% quality
   - Process the converted JPEG blob instead of the original HEIC file
   - Show error message if conversion fails

**Code (lines 32-58):**
```tsx
let fileToProcess = file;

// Check if the file is HEIC/HEIF format
const isHEIC = file.type === "image/heic" ||
               file.type === "image/heif" ||
               file.name.toLowerCase().endsWith(".heic") ||
               file.name.toLowerCase().endsWith(".heif");

if (isHEIC) {
  try {
    // Convert HEIC to JPEG
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    // heic2any can return an array of blobs, so handle both cases
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    fileToProcess = new File([blob], file.name.replace(/\.heic$/i, ".jpg"), {
      type: "image/jpeg",
    });
  } catch (conversionError) {
    console.error("Failed to convert HEIC:", conversionError);
    alert("Failed to convert HEIC image. Please try a JPG or PNG file.");
    setIsUploading(false);
    return;
  }
}
```

3. Updated accepted file types to include `.heic` and `.heif` extensions
4. Updated UI text to mention HEIC support: "PNG, JPG, GIF, WebP, SVG, HEIC"

**Result:**
- HEIC images are automatically converted to JPEG during upload
- All browsers can now display the converted images
- Users get a seamless experience regardless of image format
- Converted images are stored as `data:image/jpeg;base64,...` which is universally supported

**Files Modified:**
- `package.json`: Added `heic2any` dependency
- `components/editor/ImageBlock.tsx`: Added HEIC detection and conversion logic

**Status:** ✅ **FIXED AND TESTED**

---

### 9. Image Block Positioning Overlap ✅ FIXED

**Location:** `components/editor/ImageBlock.tsx`

**Symptom:** When an image block was added, subsequent blocks (like text blocks) would overlap with the image instead of appearing below it. The resizable image used absolute positioning from the `react-rnd` library, which took it out of the document flow.

**Example:**
- User adds an image block
- Image displays at 800×320 pixels
- User types in next text block
- Text appears OVER the image instead of below it

**Root Cause:**

The `Rnd` (react-rnd) component uses absolute positioning by default to enable resizing. This removes the element from the normal document flow, causing:
1. The parent container to collapse to height=0
2. Subsequent blocks to position as if the image doesn't exist
3. Visual overlap between image and following content

**The Fix:**

Changed the `Rnd` component to use relative positioning instead of absolute:

**Changes (line 162):**
```tsx
<Rnd
  size={{ width, height }}
  minWidth={100}
  minHeight={100}
  maxWidth={800}
  maxHeight={800}
  lockAspectRatio={false}
  disableDragging
  onResizeStart={handleResizeStart}
  onResizeStop={handleResizeStop}
  style={{ position: "relative" }}  // ← Added this
  className={`border-2 ${
    isResizing ? "border-blue-500" : isDragActive ? "border-blue-400" : "border-gray-300"
  } rounded-lg overflow-hidden`}
  // ... rest of props
>
```

**How It Works:**
1. With `position: relative`, the Rnd component stays in the document flow
2. It still takes up space equal to its width×height
3. The resize handles still work correctly
4. Subsequent blocks are positioned below the image's actual height
5. When image is resized, subsequent blocks automatically reflow

**Result:**
- Image blocks now properly reserve space in the layout
- Text blocks and other content appear below images
- Resizing an image pushes/pulls subsequent content accordingly
- No more visual overlapping

**Files Modified:**
- `components/editor/ImageBlock.tsx`: Added `style={{ position: "relative" }}` to Rnd component

**Status:** ✅ **FIXED AND TESTED**

---

### 10. Image Blocks Cannot Be Deleted ✅ FIXED

**Location:** `components/editor/ImageBlock.tsx`

**Symptom:** Once an image block was created, there was no way to delete it. Users could clear the image content using the "Clear" button, but the empty image block remained. Text blocks can be deleted by pressing Backspace when empty, but this functionality was missing for image blocks.

**Expected Behavior:**
- Pressing Backspace in an empty image block should delete the entire block
- Similar to how empty text blocks are deleted

**The Fix:**

Added a `onKeyDown` handler to the image URL input field that detects Backspace on empty content:

**Changes:**

1. Added `deleteBlock` to the Zustand store imports (line 15):
```tsx
const { updateBlock, deleteBlock } = useEditorStore();
```

2. Added keydown handler to input field (lines 243-257):
```tsx
<input
  type="text"
  value={block.content}
  onChange={async (e) => {
    // ... existing onChange code
  }}
  onKeyDown={async (e) => {
    if (e.key === "Backspace" && !block.content) {
      e.preventDefault();
      // Delete block from store
      deleteBlock(block.id);
      // Delete from API
      try {
        await fetch(`/api/blocks/${block.id}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to delete block:", error);
      }
    }
  }}
  placeholder="Or enter image URL..."
  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
```

**How It Works:**
1. User creates an image block (via "/" menu or Cmd+I)
2. If they don't upload an image, `block.content` remains empty
3. User focuses the URL input field and presses Backspace
4. Handler checks if content is empty (`!block.content`)
5. If empty:
   - Prevents default backspace behavior
   - Calls `deleteBlock(block.id)` to remove from Zustand store
   - Sends DELETE request to `/api/blocks/${block.id}` to remove from database
6. Block disappears from the editor

**Edge Cases Handled:**
- Only triggers when content is completely empty (no image URL or uploaded image)
- Prevents default to avoid backspace navigating browser history
- Handles API errors gracefully with console logging
- If image has content, backspace functions normally (deletes last character in input)

**Result:**
- Empty image blocks can now be deleted with Backspace
- Consistent behavior with text blocks
- No orphaned empty image blocks left in the editor

**Files Modified:**
- `components/editor/ImageBlock.tsx`: Added `deleteBlock` import and `onKeyDown` handler

**Status:** ✅ **FIXED AND TESTED**

---

### 11. Block Type Changes Not Saving to Database ✅ FIXED

**Location:** Multiple files - `app/api/blocks/[id]/route.ts`, `components/editor/TextBlock.tsx`, `components/editor/BlockTypeMenu.tsx`, `components/editor/ImageBlock.tsx`

**Symptom:** When users changed a block's type using keyboard shortcuts (Ctrl+1 for H1, Ctrl+2 for H2, etc.) or the "/" menu, the visual change worked but the update wasn't reliably saved to the database. On page refresh, blocks would revert to their previous types.

**Root Cause - Unconsumed Response Bodies:**

The issue was that after making PATCH requests to update blocks, the response bodies were never consumed. In the Fetch API, **unconsumed response bodies can prevent requests from fully completing**, especially under network pressure or when the browser's connection pool is saturated.

**How It Failed:**
```tsx
// BEFORE (broken):
const response = await fetch(`/api/blocks/${block.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(updates),
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || "Failed to update");
}

// Response body never consumed! ❌
// Request may not complete properly
```

When multiple updates happened rapidly (like changing types while typing), the browser would:
1. Queue multiple PATCH requests
2. Send them to the server
3. Server processes and responds
4. Client receives response but never reads the body
5. Browser's HTTP connection remains in limbo
6. Some requests may be cancelled or dropped
7. Database updates inconsistent

**The Fix:**

Added response body consumption to ALL successful PATCH requests across the codebase:

**1. TextBlock.tsx (line 135):**
```tsx
const response = await fetch(`/api/blocks/${block.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(updates),
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || "Failed to update block type");
}

// Consume the response body to ensure the request completes properly
await response.json();  // ✅ Added this line
```

**2. BlockTypeMenu.tsx (lines 104-106):**
```tsx
const response = await fetch(`/api/blocks/${selectedBlockId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(updates),
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || "Failed to update block type");
}

// Consume response body
await response.json();  // ✅ Added this line
```

**3. ImageBlock.tsx (4 separate locations):**

Fixed unconsumed responses in:
- Image upload after base64 conversion (lines 76-78)
- Image resize handler (lines 144-146)
- Image URL input onChange (lines 248-250)
- Image clear button (lines 284-286)

Pattern used:
```tsx
const response = await fetch(`/api/blocks/${block.id}`, {
  method: "PATCH",
  // ... config
});

// Consume the response body to ensure the request completes properly
if (response.ok) {
  await response.json();  // ✅ Added this
}
```

**4. API Response Format Standardization:**

Also fixed inconsistent API response formats that could cause confusion:

**app/api/blocks/[id]/route.ts:**
```tsx
// BEFORE (inconsistent):
// GET returned: { block: {...} }
// PATCH returned: { block: {...} }
// POST returned: {...} directly

// AFTER (consistent):
// All endpoints return block directly
return NextResponse.json(block, { status: 200 });
```

Changed:
- Line 26: GET endpoint now returns block directly (not wrapped)
- Line 69: PATCH endpoint now returns block directly (not wrapped)

**Why This Matters:**

1. **HTTP/2 Connection Pooling:** Browsers maintain a pool of connections. Unconsumed responses can exhaust this pool
2. **Request Cancellation:** The browser may cancel pending requests if it thinks the client isn't interested (no body read)
3. **Memory Leaks:** Unread response bodies remain in memory until garbage collected
4. **Race Conditions:** Under load, unconsumed responses can cause subsequent requests to fail

**Testing:**
1. Changed block type using Ctrl+1 (paragraph → H1)
2. Immediately changed to Ctrl+2 (H1 → H2)
3. Typed some text
4. Changed back to Ctrl+0 (H2 → paragraph)
5. Refreshed page
6. ✅ All type changes persisted correctly
7. ✅ Server logs showed all PATCH requests completed successfully
8. ✅ No console errors or network failures

**Files Modified:**
- `app/api/blocks/[id]/route.ts`: Standardized response format
- `components/editor/TextBlock.tsx`: Added response consumption
- `components/editor/BlockTypeMenu.tsx`: Added response consumption
- `components/editor/ImageBlock.tsx`: Added response consumption in 4 locations

**Status:** ✅ **FIXED AND TESTED**

**Best Practice Learned:**

> **Always consume response bodies from Fetch API requests**, even if you don't need the data. Either call `.json()`, `.text()`, or `.arrayBuffer()` on successful responses to ensure the HTTP request fully completes.

---

## Summary

All fixes were tested using Playwright browser automation on port 3001:
- ✅ Text types in correct order (left to right)
- ✅ Enter key creates new block and moves cursor to it
- ✅ "/" menu appears even with existing text
- ✅ Selecting block types (H1, H2, H3) from menu updates the existing block (no new blocks created)
- ✅ Text content is preserved when switching block types
- ✅ Image block displays drag-and-drop interface when created via "/" menu
- ✅ Dropzone shows clear instructions and accepts multiple upload methods
- ✅ No console errors when typing "/" or switching block types
- ✅ **FIXED:** Multiple empty blocks remain isolated when typing (Bug #7 - API response format fixed)
- ✅ **FIXED:** HEIC images from iPhones are automatically converted to JPEG and display correctly (Bug #8)
- ✅ **FIXED:** Image blocks don't overlap with subsequent content (Bug #9)
- ✅ **FIXED:** Empty image blocks can be deleted with Backspace (Bug #10)
- ✅ **FIXED:** Block type changes reliably save to database (Bug #11)

## Technical Notes

### ContentEditable Best Practices

The key lesson from the text reversal bug: **Never mix controlled and uncontrolled contentEditable elements**.

**Wrong approach:**
```tsx
<div contentEditable {...props}>
  {block.content}  // ❌ React controls content
</div>

useEffect(() => {
  element.textContent = block.content;  // ❌ Also updating DOM directly
}, [block.content]);
```

**Correct approach:**
```tsx
<div contentEditable {...props} />  // ✅ No children prop

useEffect(() => {
  if (!initialized) {
    element.textContent = block.content;  // ✅ Set once on mount
    setInitialized(true);
  }
}, []);

// Only sync on external changes (like type switching)
useEffect(() => {
  element.textContent = block.content;  // ✅ Sync when type changes
}, [block.type]);
```

This ensures the DOM is the source of truth during user input, preventing cursor position issues and text reversal.

### Block Type Switching Flow

When switching block types (e.g., paragraph → h1):
1. User types text into paragraph block
2. User presses "/" to open menu (menu stores block ID in `selectedBlockId`)
3. User clicks "H1" option
4. BlockTypeMenu reads current DOM content via `querySelector`
5. BlockTypeMenu calls `updateBlock(selectedBlockId, { type: "h1", content: currentContent })`
6. BlockTypeMenu sends PATCH request to `/api/blocks/${selectedBlockId}`
7. React unmounts old `<p>` and mounts new `<h1>` element
8. TextBlock's type-change useEffect fires (triggered by `block.type` change)
9. useEffect syncs content from store (which has the preserved text) to new DOM element
10. BlockTypeMenu refocuses the element

This flow ensures:
- **No new blocks are created** (uses PATCH instead of POST)
- **Content is preserved** (reads from DOM before update)
- **Proper synchronization** (type-change useEffect handles React's element swap)

### React Dropzone Integration

The image block uses `react-dropzone` with the following configuration:
- **Accept:** Only image files (PNG, JPG, JPEG, GIF, WEBP, HEIC)
- **Multiple:** false (single file upload)
- **noClick:** Disabled when image already exists to prevent accidental file dialog
- **File Processing:** Files are converted to base64 data URLs using FileReader API
- **Storage:** Base64 strings are stored directly in block content (suitable for small images, but consider cloud storage for production)

**Key UI States:**
1. Empty state: Shows dropzone with instructions
2. Dragging: Highlights border blue and shows "Drop here" message
3. With image: Displays image with resize handles, allows drag-to-replace
4. URL input: Always visible as alternative upload method

### HEIC to JPEG Conversion

**Why Convert?**
- HEIC is Apple's default photo format (iOS 11+)
- Most web browsers don't support `image/heic` MIME type
- Only Safari has partial HEIC support

**Conversion Process:**
1. Detect HEIC files by type or extension
2. Use `heic2any` library to convert to JPEG
3. Create new File object with `.jpg` extension
4. Process converted file through FileReader
5. Store resulting `data:image/jpeg;base64,...` string

**Benefits:**
- Universal browser compatibility
- No server-side processing needed
- Transparent to the user
- Preserves image quality (90% JPEG quality)

**Trade-offs:**
- Conversion happens in browser (may take 1-2 seconds for large images)
- Increases file size compared to HEIC (JPEG less efficient)
- Requires additional dependency (`heic2any`)

### Image Block Positioning

**The Problem with react-rnd:**
The `react-rnd` library enables resizable/draggable elements using absolute positioning:
```tsx
<div style={{ position: "absolute", width: 400, height: 300 }}>
  {/* content */}
</div>
```

This removes elements from document flow, causing layout issues.

**The Solution:**
Override with relative positioning:
```tsx
<Rnd
  style={{ position: "relative" }}  // ← Overrides default absolute
  size={{ width, height }}
  // ... other props
>
```

**Why This Works:**
- `position: relative` keeps element in document flow
- Element still reserves space equal to its dimensions
- Resize handles remain functional
- Subsequent elements position correctly below it
- When resized, layout automatically adjusts

**Alternative Approaches (not used):**
1. ❌ Wrapper div with dynamic height: More complex, extra nesting
2. ❌ CSS Grid: Overkill for this use case
3. ✅ Override position style: Simple, clean, effective

### API Response Body Consumption

**Critical Pattern:** Always consume response bodies from Fetch API requests.

**Why It Matters:**
```tsx
// BAD - Request may not complete
const response = await fetch(url, { method: "PATCH", body: data });
if (!response.ok) throw new Error();
// ❌ Body never consumed

// GOOD - Request guaranteed to complete  
const response = await fetch(url, { method: "PATCH", body: data });
if (!response.ok) throw new Error();
await response.json();  // ✅ Body consumed
```

**Technical Reasons:**
1. **Connection Pooling:** Browsers limit concurrent connections (typically 6 per domain). Unconsumed responses hold connections open, blocking new requests
2. **HTTP/2 Streams:** Unconsumed streams may not close properly, causing memory leaks
3. **Request Cancellation:** Browsers may assume abandoned requests and cancel them
4. **Network Errors:** Partial responses may not be detected without reading the body

**When to Consume:**
- ✅ After successful PATCH/PUT/POST requests (even if you don't need the data)
- ✅ After DELETE requests (helps detect server errors)
- ✅ Even for 204 No Content responses (call `.text()` which returns empty string)
- ❌ Not needed for error responses (already consumed in error handling)

**Best Practice:**
```tsx
try {
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json();  // Consume error body
    throw new Error(error.message);
  }
  
  // Always consume success body
  if (response.status === 204) {
    await response.text();  // No content, but still consume
  } else {
    await response.json();  // Read and discard if not needed
  }
} catch (error) {
  console.error("Request failed:", error);
}
```

### API Response Formats

**Critical Pattern:** Always ensure client and server agree on response format.

**Wrong (caused Bug #7):**
```tsx
// Server
return NextResponse.json({ block }, { status: 201 });

// Client
const savedBlock = await response.json();
console.log(savedBlock.id); // undefined! Need savedBlock.block.id
```

**Correct:**
```tsx
// Server returns unwrapped object
return NextResponse.json(block, { status: 201 });

// Client gets block directly
const savedBlock = await response.json();
console.log(savedBlock.id); // works!
```

This pattern applies to all API endpoints. Always verify response structure matches client expectations.

### Stale Closures in React

**The Pattern:**
React callbacks (useCallback, event handlers) capture variables from their enclosing scope at the time they're created. If these callbacks perform async operations, they may use stale data when they eventually execute.

**Example:**
```tsx
const createNewBlock = useCallback(async (afterBlockId) => {
  const afterBlock = blocks.find(b => b.id === afterBlockId);  // ← captures 'blocks' from closure
  
  const updatedBlocks = blocks.map(...);  // ← uses captured 'blocks'
  setBlocks([...updatedBlocks, newBlock]);  // ← setState with stale data
  
  const response = await fetch('/api/blocks', ...);  // ← async operation
  const savedBlock = await response.json();
  
  // By the time we get here, 'blocks' is stale!
  // User may have created more blocks, but we still have old 'blocks' array
  setBlocks([...updatedBlocks, savedBlock]);  // ← BUG: loses newer blocks
}, [blocks]);  // ← recreates callback when blocks change, but doesn't help with async
```

**The Solution - Functional setState:**
Use the functional form of setState to access the current state at the time of update, not the captured state:

```tsx
// WRONG - uses stale closure
setBlocks([...blocks, newBlock]);

// RIGHT - gets current state
setBlocks((currentBlocks) => [...currentBlocks, newBlock]);
```

**Critical Locations to Use Functional setState:**
1. Inside async callbacks (after fetch, setTimeout, etc.)
2. In event handlers that may fire multiple times quickly
3. When updating state based on previous state
4. In optimistic UI updates followed by API calls

**Red Flags:**
- Using captured variables (from closure) after `await`
- Multiple rapid state updates (e.g., pressing Enter twice quickly)
- Race conditions between optimistic updates and API responses
- State updates that depend on previous state but don't use functional form