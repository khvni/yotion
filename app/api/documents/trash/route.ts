import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { documents } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/documents/trash - Get all archived documents for a user
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const trashedDocuments = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          eq(documents.isArchived, true)
        )
      )
      .orderBy(desc(documents.updatedAt));

    return NextResponse.json({ documents: trashedDocuments });
  } catch (error) {
    console.error('Error fetching trash documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trash documents' },
      { status: 500 }
    );
  }
}
