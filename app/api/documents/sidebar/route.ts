import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { documents } from '@/lib/db/schema';
import { initDatabase } from '@/lib/db/init';
import { eq, and, isNull, desc } from 'drizzle-orm';

// Ensure database is initialized
initDatabase();

// GET /api/documents/sidebar - Get documents for sidebar (by parent)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const parentDocumentId = searchParams.get('parentDocument');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    let sidebarDocuments;

    // Filter by parent document
    if (parentDocumentId) {
      const parentId = parseInt(parentDocumentId);
      if (!isNaN(parentId)) {
        sidebarDocuments = await db
          .select()
          .from(documents)
          .where(
            and(
              eq(documents.userId, userId),
              eq(documents.isArchived, false),
              eq(documents.parentDocument, parentId)
            )
          )
          .orderBy(desc(documents.createdAt));
      }
    } else {
      // If no parent specified, get root documents (where parent is null)
      sidebarDocuments = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.userId, userId),
            eq(documents.isArchived, false),
            isNull(documents.parentDocument)
          )
        )
        .orderBy(desc(documents.createdAt));
    }

    return NextResponse.json({ documents: sidebarDocuments });
  } catch (error) {
    console.error('Error fetching sidebar documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sidebar documents' },
      { status: 500 }
    );
  }
}
