import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { documents } from '@/lib/db/schema';
import { initDatabase } from '@/lib/db/init';
import { eq, and } from 'drizzle-orm';

// Ensure database is initialized
initDatabase();

// GET /api/documents - List all documents for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const allDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(documents.createdAt);

    return NextResponse.json({ documents: allDocuments });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, userId, parentDocument } = body;

    if (!title || !userId) {
      return NextResponse.json(
        { error: 'title and userId are required' },
        { status: 400 }
      );
    }

    const result = await db
      .insert(documents)
      .values({
        title,
        userId,
        parentDocument: parentDocument || null,
        isArchived: false,
        isPublished: false,
      })
      .returning();

    const document = result[0];

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
