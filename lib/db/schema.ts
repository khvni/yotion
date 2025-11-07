import { pgTable, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

// Documents table - matches Convex schema
export const documents = pgTable('documents', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: text('title').notNull(),
  userId: text('user_id').notNull(),
  isArchived: boolean('is_archived').notNull().default(false),
  parentDocument: integer('parent_document').references((): any => documents.id, { onDelete: 'cascade' }),
  content: text('content'),
  coverImage: text('cover_image'),
  icon: text('icon'),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports for use in API routes
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
