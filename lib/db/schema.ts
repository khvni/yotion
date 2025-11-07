import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Documents table - matches Convex schema
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  userId: text('user_id').notNull(),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  parentDocument: integer('parent_document').references((): any => documents.id, { onDelete: 'cascade' }),
  content: text('content'),
  coverImage: text('cover_image'),
  icon: text('icon'),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Type exports for use in API routes
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
