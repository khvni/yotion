# E2E Test Suite for Block Editor

## Overview

This test suite provides comprehensive end-to-end testing for the Notion-inspired block editor using Playwright. The tests cover all core functionality including block creation, editing, deletion, slash commands, and data persistence.

## Test Cases Implemented

### 1. **should load and display initial blocks**
- **Purpose**: Verifies that blocks from the database are properly loaded and displayed when the page loads
- **What it tests**:
  - Editor container is visible
  - Blocks are rendered from API response
  - Each block has proper structure and data attributes
  - Blocks are displayed in the correct order

### 2. **should add new text block on Enter**
- **Purpose**: Tests block creation functionality when pressing Enter
- **What it tests**:
  - Pressing Enter in a focused block creates a new block below
  - New block is created via POST API call
  - Block count increases by 1
  - New block is properly positioned in the DOM

### 3. **should show slash command menu on /**
- **Purpose**: Verifies slash command menu appears when typing "/"
- **What it tests**:
  - Typing "/" triggers the menu display
  - Menu becomes visible
  - All block type options are present (paragraph, h1, h2, h3, image)

### 4. **should convert block type from menu**
- **Purpose**: Tests block type conversion using the slash menu
- **What it tests**:
  - Slash menu opens correctly
  - Clicking a menu option (H1) converts the block type
  - API PATCH request is sent with updated type
  - Block renders with new HTML tag (h1)
  - Menu closes after selection

### 5. **should add image block**
- **Purpose**: Tests image block creation via slash menu
- **What it tests**:
  - Image option in slash menu works
  - Prompt dialog appears for image URL input
  - Image block is created/updated via API
  - Image element renders with correct src attribute
  - Image is visible in the editor

### 6. **should edit text content**
- **Purpose**: Verifies text editing and persistence
- **What it tests**:
  - Clicking a block focuses it
  - Typing updates the content
  - Content is visible in the contenteditable element
  - Blurring triggers save via PATCH API
  - Content persists after blur

### 7. **should delete empty block on Backspace**
- **Purpose**: Tests block deletion when Backspace is pressed on empty block
- **What it tests**:
  - Empty block can be deleted
  - DELETE API call is made
  - Block count decreases by 1
  - Focus returns to previous block

### 8. **should persist changes after page refresh**
- **Purpose**: Ensures data persistence across page reloads
- **What it tests**:
  - New blocks are created and saved
  - Content is saved to database
  - Page refresh loads all blocks from database
  - Block count remains the same
  - Content is still present after refresh

### 9. **should handle keyboard navigation in slash menu** (Bonus)
- **Purpose**: Tests keyboard navigation within the slash menu
- **What it tests**:
  - Arrow keys navigate menu options
  - Enter key selects highlighted option
  - Selected block type is applied

### 10. **should close slash menu on Escape** (Bonus)
- **Purpose**: Verifies menu can be dismissed with Escape key
- **What it tests**:
  - Escape key closes the menu
  - Menu is no longer visible
  - "/" character remains in content

### 11. **should maintain block order after operations** (Bonus)
- **Purpose**: Ensures block ordering is maintained correctly
- **What it tests**:
  - Blocks maintain proper order
  - New blocks are inserted at correct position
  - Order is preserved in DOM

## Required Implementation

For these tests to pass, the following components and features need to be implemented:

### 1. Data-TestID Attributes

Add these `data-testid` attributes to your components:

#### Editor.tsx
```tsx
<div
  ref={editorRef}
  className="editor-container max-w-4xl mx-auto py-8 px-4"
  data-testid="editor"  // ADD THIS
>
```

#### Block.tsx
```tsx
<div
  data-block-id={block.id}
  data-testid="block"  // ADD THIS
  className="block-wrapper"
  onFocus={handleFocus}
  onBlur={handleBlur}
>
```

#### TextBlock.tsx (needs to be created)
```tsx
<div
  contentEditable
  data-testid={`text-block-${block.id}`}  // ADD THIS
  suppressContentEditableWarning
  onKeyDown={handleKeyDown}
  onBlur={handleBlur}
>
  {block.content}
</div>
```

#### ImageBlock.tsx (needs to be created)
```tsx
<div data-testid={`image-block-${block.id}`}>  {/* ADD THIS */}
  <Rnd {...rndProps}>
    <img src={block.content} alt={block.metadata?.alt || ""} />
  </Rnd>
</div>
```

#### BlockTypeMenu.tsx (needs to be created)
```tsx
<div data-testid="block-type-menu" className="menu">
  <button data-testid="menu-option-paragraph">Paragraph</button>
  <button data-testid="menu-option-h1">Heading 1</button>
  <button data-testid="menu-option-h2">Heading 2</button>
  <button data-testid="menu-option-h3">Heading 3</button>
  <button data-testid="menu-option-image">Image</button>
</div>
```

### 2. Missing Components

The following components need to be created:

1. **TextBlock.tsx** - Renders text blocks (paragraph, h1, h2, h3) with contenteditable
2. **ImageBlock.tsx** - Renders image blocks with react-rnd for resizing
3. **BlockTypeMenu.tsx** - Slash command menu for block type selection

### 3. Required Features

1. **Slash Command System**:
   - Detect "/" key press in text blocks
   - Show BlockTypeMenu at cursor position
   - Handle menu option selection
   - Convert block type on selection
   - Remove "/" character after selection

2. **Block Operations**:
   - Enter key creates new block below current
   - Backspace on empty block deletes it and focuses previous
   - Focus management between blocks
   - Content auto-save on blur

3. **API Integration**:
   - All block operations must call appropriate API endpoints
   - Optimistic updates for better UX
   - Proper error handling

4. **Keyboard Shortcuts**:
   - Arrow key navigation in menu
   - Enter to select menu option
   - Escape to close menu
   - Cmd/Ctrl+Z for undo
   - Cmd/Ctrl+Shift+Z for redo

## Running the Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure Playwright browsers are installed
npx playwright install
```

### Run All Tests

```bash
npm test
```

### Run Tests in UI Mode (Recommended for Development)

```bash
npx playwright test --ui
```

### Run Tests in Headed Mode

```bash
npx playwright test --headed
```

### Run Specific Test

```bash
npx playwright test --grep "should load and display initial blocks"
```

### Debug Tests

```bash
npx playwright test --debug
```

## Test Configuration

The tests use the configuration defined in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests`
- **Browser**: Chromium (Desktop Chrome)
- **Auto-start dev server**: Yes (runs `npm run dev`)
- **Retries**: 2 in CI, 0 locally
- **Reporter**: HTML

## Test Data Setup

For consistent test results, consider:

1. **Database Seeding**: Create a test database with known initial state
2. **Test Isolation**: Reset database between test runs
3. **Mock Data**: Use predictable block IDs and content

Example seed data:
```typescript
const seedBlocks = [
  { id: "test-1", type: "h1", content: "Test Document", order: 0 },
  { id: "test-2", type: "paragraph", content: "This is a test paragraph", order: 1 },
  { id: "test-3", type: "paragraph", content: "Another paragraph", order: 2 },
];
```

## Debugging Failed Tests

When tests fail:

1. **Check Screenshots**: Playwright automatically captures screenshots on failure
2. **Review Trace**: Use `--trace on` to capture detailed trace
3. **Inspect HTML Report**: Run `npx playwright show-report`
4. **Use UI Mode**: Best for interactive debugging
5. **Check Network Tab**: Verify API calls are working

## Common Issues

### Tests Timeout
- Increase timeout in test: `{ timeout: 10000 }`
- Check if dev server is running
- Verify API endpoints are responding

### Elements Not Found
- Verify data-testid attributes are added
- Check if elements are rendered conditionally
- Use `page.pause()` to inspect page state

### Flaky Tests
- Add explicit waits for API responses
- Wait for animations to complete
- Use stable selectors (data-testid)

### API Calls Not Waiting
- Always wait for API responses: `await page.waitForResponse(...)`
- Add small delays after operations: `await page.waitForTimeout(500)`

## Best Practices

1. **Use data-testid**: More stable than CSS selectors
2. **Wait for network**: Always wait for API calls to complete
3. **Explicit waits**: Use `waitForSelector`, `waitForResponse`
4. **Descriptive names**: Test names should clearly describe what they test
5. **Independent tests**: Each test should work in isolation
6. **Clean state**: Reset state between tests
7. **Realistic interactions**: Simulate real user behavior

## Next Steps

1. Implement missing components (TextBlock, ImageBlock, BlockTypeMenu)
2. Add data-testid attributes to all components
3. Implement slash command functionality
4. Add keyboard event handlers
5. Implement block creation/deletion logic
6. Run tests and fix any failures
7. Add test database seeding script
8. Implement CI/CD pipeline with test automation

## Coverage

These tests cover:
- ✅ Block loading and rendering
- ✅ Block creation (text and image)
- ✅ Block editing
- ✅ Block deletion
- ✅ Slash command menu
- ✅ Block type conversion
- ✅ Data persistence
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ API integration
- ✅ Order maintenance

Not covered (future improvements):
- ❌ Undo/redo functionality
- ❌ Image resizing
- ❌ Rich text formatting
- ❌ Error states
- ❌ Loading states
- ❌ Accessibility

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Add data-testid attributes
3. Ensure tests are deterministic
4. Update this README
