# Frontend Worktree Instructions

## Your Mission
Fix and enhance ALL frontend components to match PRD.md specifications. Work ONLY on files in:
- `components/**/*`
- `app/**/*.tsx` (not API routes)
- Client-side functionality

## Critical Database Issue to Fix FIRST
The PGlite database is failing with "TypeError [ERR_INVALID_ARG_TYPE]". Switch to using an in-memory data store or fix PGlite initialization. The API is returning 500 errors.

## Key Tasks
1. Fix the database connection issue causing 500 errors on `/api/blocks`
2. Ensure Editor.tsx properly renders blocks when data loads
3. Test slash command functionality - type "/" to open block menu
4. Verify block creation (Enter key creates new blocks)
5. Test block deletion (Backspace on empty block)
6. Ensure block editing works with contenteditable
7. Test image block resizing with react-rnd
8. Verify undo/redo keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)

## MCP Servers to Use
- **sequential-thinking**: For complex problem solving
- **playwright**: Test frontend at http://localhost:3001
- **github**: Search for PGlite examples and issues
- **context7**: Get documentation for @electric-sql/pglite, zustand, react-rnd
- **fetch**: Research solutions online

## Commands
```bash
# Test the app
npm run dev  # Server should already be running on port 3001

# Commit changes as you go
git add -A && git commit -m "Fix: [describe fix]"
```

## Rules
- Do NOT modify API routes (app/api/**/route.ts)
- Do NOT modify database files (lib/db.ts) - that's database worktree's job
- Do NOT modify test files - that's quality worktree's job
- ALWAYS use sequential-thinking for complex debugging
- ALWAYS test with playwright after each major change
- ALWAYS commit working changes immediately

## Success Criteria
- No runtime errors in browser console
- Blocks load and display correctly
- All PRD.md features work:
  - Add text blocks (Enter)
  - Add image blocks (slash menu)
  - Edit blocks (click and type)
  - Delete blocks (Backspace on empty)
  - Resize images (drag corners)
  - Undo/redo (Cmd+Z / Cmd+Shift+Z)

## Timeline
You have ~15 minutes. Focus on getting core functionality working first.
