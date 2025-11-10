# Code Quality & Testing Worktree Instructions

## Your Mission

Ensure code quality and create E2E tests. Work ONLY on:

- `tests/**/*` or `e2e/**/*`
- ESLint/Prettier configuration
- Test infrastructure

## Key Tasks

1. Set up Playwright E2E tests (if not already configured)
2. Write tests for core PRD.md features:
   - Display blocks
   - Add text block (Enter key)
   - Add image block (slash menu)
   - Edit text block content
   - Delete block (Backspace on empty)
   - Resize image block
   - Slash command menu
   - Undo/redo functionality
3. Run ESLint and fix critical errors
4. Run Prettier and format code
5. Ensure all tests pass

## MCP Servers to Use

- **sequential-thinking**: Plan test scenarios
- **playwright**: Run actual tests on http://localhost:3001
- **context7**: Get Playwright documentation
- **github**: Find Playwright test examples

## Commands

```bash
# Install Playwright if needed
npx playwright install

# Run tests
npm run test
# or
npx playwright test

# Lint and format
npm run lint
npm run format

# Commit changes
git add -A && git commit -m "Test: [describe tests]"
```

## Test Structure Example

```typescript
test("should load and display blocks", async ({ page }) => {
  await page.goto("http://localhost:3001");
  await page.waitForSelector("[data-block-id]");
  const blocks = await page.locator("[data-block-id]").count();
  expect(blocks).toBeGreaterThan(0);
});

test("should create new block on Enter", async ({ page }) => {
  await page.goto("http://localhost:3001");
  const firstBlock = page.locator("[data-block-id]").first();
  await firstBlock.click();
  await firstBlock.press("Enter");
  // Verify new block created
});
```

## Rules

- Do NOT modify application code (only test code)
- Do NOT modify database or API code
- ALWAYS use sequential-thinking for test planning
- ALWAYS use playwright MCP to run actual tests
- ALWAYS commit passing tests immediately

## Success Criteria

- All E2E tests written for PRD.md features
- All tests pass
- No ESLint errors (warnings OK)
- Code is formatted with Prettier
- Test coverage for critical user workflows

## Timeline

You have ~15 minutes. Prioritize tests for core features first.
