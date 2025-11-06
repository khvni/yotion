import { pgTable, serial, varchar, integer, jsonb } from 'drizzle-orm/pg-core';
// Documents table - stores pages and directories
export const documents = pgTable('documents', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'PAGE' | 'DIRECTORY'
    parentId: integer('parent_id').references(() => documents.id, { onDelete: 'cascade' }),
    order: integer('order').notNull(),
});
// Blocks table - stores content blocks for pages
export const blocks = pgTable('blocks', {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
        .notNull()
        .references(() => documents.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(), // 'text' | 'image'
    order: integer('order').notNull(),
    content: jsonb('content').notNull(),
});
