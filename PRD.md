# Simple Notion Clone - Product Requirements Document

## 1. Overview

### 1.1. Project Vision

To build a minimal, single-user version of a Notion-like editor. This application will serve as a robust, lightweight tool for creating and organizing content using a block-based system. The primary goal is a simple, efficient, and effective product that nails the core experience of page and content management.

### 1.2. Guiding Principles

- **Simplicity and Focus**: The architecture prioritizes the simplest, most direct path to implementing core features.
- **Modularity**: The codebase must be modular, with a clear separation of concerns between the client and server, as well as between components.
- **Conciseness**: Code should be as concise and maintainable as possible, avoiding boilerplate.
- **TypeScript-First**: The entire stack (frontend, backend, and database ORM) will be in TypeScript to ensure type safety and developer efficiency.
- **No Emojis**: The product UI and this document will maintain a clean, professional aesthetic.

## 2. Core Architecture

### 2.1. Tech Stack

**Monorepo Manager**: pnpm workspaces

**Frontend Client**:

- Framework: React (bootstrapped with Vite)
- Language: TypeScript
- State Management: Zustand
- HTTP Client: Axios
- UI Components: shadcn-ui
- Drag & Drop (Blocks): dnd-kit
- Image Resizing: react-rnd
- Styling: Tailwind CSS

**Backend Server**:

- Runtime: Node.js
- Framework: Express.js
- Language: TypeScript

**Database**:

- Engine: pglite (embedded PostgreSQL)
- ORM: Drizzle ORM

### 2.2. Project Structure

The project will be a monorepo with two distinct packages:

```txt
root/
  packages/
    client/ (Frontend React application)
    server/ (Backend Express.js API)
  package.json
  tsconfig.base.json
```

### 2.3. Design System

**Font**: The entire application will use the "Inter" font, loaded via the Google Fonts API. No other fonts will be loaded or offered.

## 3. Feature Specification (V1)

### 3.1. Feature: Document & File Management

Provides the user with a file-tree sidebar to create, view, and organize documents.

**Requirements**:

- A persistent sidebar shall display all documents.
- The sidebar must visually represent the nested, tree-like structure of pages and directories.
- Users must be able to create a new page at the root level or inside a directory.
- Users must be able to create a new directory at the root level or inside another directory.
- Users must be able to rename any page or directory.
- Users must be able to drag-and-drop pages and directories to re-order them or move them into different directories.

### 3.2. Feature: Block-Based Page Editor

The main canvas where a document's content is displayed and manipulated.

**Requirements**:

- When a "PAGE" document is selected from the sidebar, the editor will fetch and render all associated content blocks.
- Blocks must be rendered in a single vertical column, sorted by their order attribute.
- Users must be able to drag-and-drop any block to re-order it on the page (using dnd-kit).
- Saving the new order must be handled by a batch update API call.

### 3.3. Feature: Text Block (Markdown-Native)

The primary block for all text content.

**Requirements**:

- All text blocks will be WYSIWYG, using the `contentEditable="true"` attribute.
- **Markdown Shortcuts**: The editor must listen for and automatically convert common markdown shortcuts into the correct format.
  - `##` followed by text shall convert the block to H2.
  - `###` followed by text shall convert the block to H3.
  - (And so on for H1-H3 and P).
- **Selection Toolbar**: When a user highlights text within a block, a small, floating toolbar shall appear.
  - The toolbar must provide the following functions:
    - **Block Type**: A dropdown/button to change the block type (Paragraph, H1, H2, H3). This will add/modify the markdown prefix.
    - **Bold**: Wraps the selected text with `**`.
    - **Italic**: Wraps the selected text with `*`.
- Data will be saved to the database on blur (when the user clicks away from the block).

### 3.4. Feature: Image Block

A block for displaying and managing images.

**Requirements**:

- Users must be able to add a new image block to the page.
- The block shall have a text input (visible on click) to set the image src URL.
- The image block must be resizable via draggable handles (using react-rnd).
- The width and height must be saved to the database when resizing is complete.

## 4. Database & Schema

The database will be pglite, managed by Drizzle ORM. The schema will consist of two primary tables.

### 4.1. documents table

Stores all pages and directories in a self-referencing tree structure.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Unique identifier for the document. |
| title | varchar(255) | NOT NULL | The display name of the page/directory. |
| type | varchar(50) | NOT NULL, CHECK (type IN ('PAGE', 'DIRECTORY')) | Defines if the document is a page or a folder. |
| parent_id | integer | FOREIGN KEY (documents.id), NULLABLE | The id of the parent directory. NULL if root. |
| order | integer | NOT NULL | The sort order within its parent directory. |

### 4.2. blocks table

Stores all content blocks associated with a page.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Unique identifier for the block. |
| document_id | integer | FOREIGN KEY (documents.id), NOT NULL | The page this block belongs to. |
| type | varchar(50) | NOT NULL, CHECK (type IN ('text', 'image')) | The type of block to render. |
| order | integer | NOT NULL | The vertical sort order of the block on the page. |
| content | jsonb | NOT NULL | All block-specific data. |

**Example content JSON**:

- Text Block: `{ "value": "## This is a heading" }`
- Image Block: `{ "src": "https://url.com/img.png", "width": 500, "height": 300 }`

## 5. API Endpoints

The server will expose a RESTful API.

- `GET /api/documents`: Fetches the entire document tree.
- `POST /api/documents`: Creates a new page or directory.
- `PUT /api/documents/:id`: Updates a document's title.
- `PUT /api/documents/reorder`: Batch update to re-order/re-parent documents.
- `DELETE /api/documents/:id`: Deletes a document (and all child documents/blocks).
- `GET /api/blocks?documentId=:id`: Fetches all blocks for a specific document.
- `POST /api/blocks`: Creates a new block (text or image) for a document.
- `PUT /api/blocks/:id`: Updates the content of a single block (e.g., text, image URL, dimensions).
- `PUT /api/blocks/reorder`: Batch update to re-order blocks on a page.
- `DELETE /api/blocks/:id`: Deletes a single block.

## 6. Out of Scope (V2)

The following features are explicitly out of scope for V1 to ensure focus and simplicity.

- User accounts and authentication
- Real-time collaboration
- Undo/Redo functionality
- Public page sharing
- Additional block types (e.g., code, dividers, tables, lists)
- Page history
