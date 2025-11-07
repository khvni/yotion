# Backend Refactor: Convex to PGLite + Next.js API Routes

## Summary

Successfully replaced the Convex backend with PGLite + Next.js API routes. The new implementation uses:
- **PGLite**: Embedded PostgreSQL database
- **Drizzle ORM**: Type-safe database queries
- **Next.js API Routes**: RESTful API endpoints

## Files Created

### Database Layer (`lib/db/`)

1. **client.ts** - PGLite client initialization
   - Singleton pattern for PGLite client
   - Drizzle ORM integration
   - Database stored in `data/notion.db`

2. **schema.ts** - Drizzle schema definition
   - Documents table matching Convex schema
   - Fields: id, title, userId, isArchived, parentDocument, content, coverImage, icon, isPublished, createdAt, updatedAt
   - Type exports for TypeScript

3. **init.ts** - Database initialization
   - Creates documents table if not exists
   - Creates indexes for efficient queries (user_id, user_parent, is_archived)
   - Singleton pattern to avoid duplicate initialization

### API Routes (`app/api/documents/`)

All routes follow Next.js App Router conventions and require `userId` for authentication.

1. **route.ts** - Main documents endpoint
   - `GET /api/documents?userId={userId}` - List all documents for user
   - `POST /api/documents` - Create new document

2. **[id]/route.ts** - Individual document operations
   - `GET /api/documents/[id]?userId={userId}` - Get document by ID
   - `PUT /api/documents/[id]` - Update document
   - `DELETE /api/documents/[id]?userId={userId}` - Delete document
   - Authorization: Checks ownership or published status

3. **[id]/archive/route.ts** - Archive operations
   - `POST /api/documents/[id]/archive` - Archive document and all children recursively
   
4. **[id]/restore/route.ts** - Restore operations
   - `POST /api/documents/[id]/restore` - Restore document and all children
   - Handles orphaned parents (removes parent reference if parent is archived)

5. **sidebar/route.ts** - Sidebar document list
   - `GET /api/documents/sidebar?userId={userId}&parentDocument={id}` - Get non-archived documents
   - Supports hierarchical navigation (root or by parent)

6. **trash/route.ts** - Trash/archived documents
   - `GET /api/documents/trash?userId={userId}` - Get all archived documents

7. **search/route.ts** - Search documents
   - `GET /api/documents/search?userId={userId}` - Get all non-archived documents for search

## Data Model

The documents table preserves all fields from the Convex schema:

```typescript
{
  id: integer (auto-generated)
  title: text (required)
  userId: text (required)
  isArchived: boolean (default: false)
  parentDocument: integer (nullable, self-referencing)
  content: text (nullable)
  coverImage: text (nullable)
  icon: text (nullable)
  isPublished: boolean (default: false)
  createdAt: timestamp (auto-generated)
  updatedAt: timestamp (auto-updated)
}
```

## API Differences from Convex

### Authentication
- **Convex**: Used `ctx.auth.getUserIdentity()` 
- **PGLite**: Requires `userId` in query params or request body
- Frontend needs to pass Clerk user ID explicitly

### Document IDs
- **Convex**: String IDs (e.g., "abc123")
- **PGLite**: Integer IDs (e.g., 1, 2, 3)
- Frontend will need to handle integer IDs instead of strings

### Response Format
All responses follow the pattern:
```json
{
  "document": {...},  // Single document
  "documents": [...], // Multiple documents
  "error": "...",     // Error message
  "success": true     // Success indicator (delete)
}
```

## Testing

Created `test-api-routes.sh` script for testing all endpoints:

```bash
chmod +x test-api-routes.sh
# Start dev server first: npm run dev
./test-api-routes.sh
```

## Dependencies Added

- `@electric-sql/pglite@^0.3.14`
- `drizzle-orm@^0.44.7`

## Next Steps for Integration

1. **Update Frontend Hooks/Queries**
   - Replace Convex `useQuery` with fetch/SWR/React Query
   - Replace Convex `useMutation` with API calls
   - Pass userId from Clerk in all requests

2. **Update Document ID Types**
   - Change from `Id<"documents">` (string) to `number`
   - Update all components using document IDs

3. **Authentication**
   - Get userId from Clerk: `const { userId } = useAuth()`
   - Pass as query param or in request body

4. **Error Handling**
   - Add proper error handling for fetch calls
   - Display error messages from API responses

5. **Real-time Updates**
   - Consider adding polling or WebSockets for real-time updates
   - Or use SWR/React Query's refetch on focus

6. **Remove Convex Dependencies**
   - Remove `convex` package
   - Remove Convex provider from layout
   - Delete `convex/` directory

## Testing the API Independently

Start the dev server:
```bash
npm run dev
```

Test endpoints with curl:
```bash
# Create document
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","userId":"user_123"}'

# Get documents
curl "http://localhost:3000/api/documents?userId=user_123"

# Get by ID
curl "http://localhost:3000/api/documents/1?userId=user_123"
```

Or use the provided test script:
```bash
./test-api-routes.sh
```

## Architecture Benefits

1. **No External Dependencies**: PGLite runs entirely in-process
2. **Type Safety**: Drizzle ORM provides full TypeScript types
3. **RESTful**: Standard HTTP methods and status codes
4. **Portable**: Database file can be backed up/restored easily
5. **Familiar**: Standard SQL and HTTP patterns

## Known Limitations

1. **No Real-time**: Unlike Convex, changes aren't automatically pushed to clients
2. **Single Process**: PGLite is embedded, not suitable for multi-server deployments
3. **Manual Auth**: Need to pass userId explicitly (vs Convex's automatic auth context)

## File Structure

```
/Users/khani/Desktop/projs/replo-takehome/
├── lib/db/
│   ├── client.ts           # PGLite + Drizzle setup
│   ├── schema.ts           # Database schema
│   └── init.ts             # DB initialization
├── app/api/documents/
│   ├── route.ts            # GET /api/documents, POST /api/documents
│   ├── [id]/route.ts       # GET/PUT/DELETE /api/documents/[id]
│   ├── [id]/archive/route.ts   # POST /api/documents/[id]/archive
│   ├── [id]/restore/route.ts   # POST /api/documents/[id]/restore
│   ├── sidebar/route.ts    # GET /api/documents/sidebar
│   ├── trash/route.ts      # GET /api/documents/trash
│   └── search/route.ts     # GET /api/documents/search
├── data/
│   └── notion.db/          # PGLite database files
└── test-api-routes.sh      # API testing script
```

## Status

✅ All tasks completed successfully!
- Database layer implemented with PGLite + Drizzle
- All API routes created and tested
- TypeScript compilation passes with no errors
- Database initialization working correctly
- Test script provided for manual testing

## API Endpoint Reference

### Quick Reference Table

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/documents?userId={id}` | List all documents for user | Yes |
| POST | `/api/documents` | Create new document | Yes |
| GET | `/api/documents/[id]?userId={id}` | Get single document | Conditional* |
| PUT | `/api/documents/[id]` | Update document | Yes |
| DELETE | `/api/documents/[id]?userId={id}` | Delete document | Yes |
| POST | `/api/documents/[id]/archive` | Archive document + children | Yes |
| POST | `/api/documents/[id]/restore` | Restore document + children | Yes |
| GET | `/api/documents/sidebar?userId={id}&parentDocument={id}` | Get sidebar documents | Yes |
| GET | `/api/documents/trash?userId={id}` | Get archived documents | Yes |
| GET | `/api/documents/search?userId={id}` | Get searchable documents | Yes |

\* Public if document is published and not archived, otherwise requires userId

### Example Request/Response

**Create Document:**
```bash
# Request
POST /api/documents
Content-Type: application/json

{
  "title": "My New Document",
  "userId": "user_2abc123",
  "parentDocument": null
}

# Response
{
  "document": {
    "id": 1,
    "title": "My New Document",
    "userId": "user_2abc123",
    "isArchived": false,
    "parentDocument": null,
    "content": null,
    "coverImage": null,
    "icon": null,
    "isPublished": false,
    "createdAt": "2025-11-07T19:38:50.419Z",
    "updatedAt": "2025-11-07T19:38:50.419Z"
  }
}
```

**Update Document:**
```bash
# Request
PUT /api/documents/1
Content-Type: application/json

{
  "userId": "user_2abc123",
  "title": "Updated Title",
  "content": "Document content here...",
  "icon": "📄"
}

# Response
{
  "document": {
    "id": 1,
    "title": "Updated Title",
    "userId": "user_2abc123",
    "isArchived": false,
    "parentDocument": null,
    "content": "Document content here...",
    "coverImage": null,
    "icon": "📄",
    "isPublished": false,
    "createdAt": "2025-11-07T19:38:50.419Z",
    "updatedAt": "2025-11-07T19:45:00.000Z"
  }
}
```

## Convex Migration Mapping

| Convex Function | New API Endpoint | Notes |
|----------------|------------------|-------|
| `create` | `POST /api/documents` | Same payload structure |
| `getById` | `GET /api/documents/[id]` | Use integer ID |
| `getSidebar` | `GET /api/documents/sidebar` | Add userId param |
| `getSearch` | `GET /api/documents/search` | Add userId param |
| `getTrash` | `GET /api/documents/trash` | Add userId param |
| `update` | `PUT /api/documents/[id]` | Include userId in body |
| `archive` | `POST /api/documents/[id]/archive` | Include userId in body |
| `restore` | `POST /api/documents/[id]/restore` | Include userId in body |
| `remove` | `DELETE /api/documents/[id]` | Add userId param |
| `removeIcon` | `PUT /api/documents/[id]` | Set `icon: null` |
| `removeCoverImage` | `PUT /api/documents/[id]` | Set `coverImage: null` |
