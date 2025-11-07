import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { documents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

// Helper function to recursively restore all children
async function recursiveRestore(documentId: number, userId: string): Promise<void> {
  const db = await getDb();
  // Find all children of this document
  const children = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.userId, userId),
        eq(documents.parentDocument, documentId)
      )
    );

  // Restore each child and their descendants
  for (const child of children) {
    await db
      .update(documents)
      .set({ isArchived: false, updatedAt: new Date() })
      .where(eq(documents.id, child.id));

    await recursiveRestore(child.id, userId);
  }
}

// POST /api/documents/[id]/restore - Restore a document and all its children
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
    const id = parseInt(params.id);
    const body = await request.json();
    const { userId } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if document exists and user owns it
    const [existingDocument] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (existingDocument.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      isArchived: false,
      updatedAt: new Date(),
    };

    // If parent document exists and is archived, remove the parent reference
    if (existingDocument.parentDocument) {
      const [parent] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, existingDocument.parentDocument))
        .limit(1);

      if (parent?.isArchived) {
        updateData.parentDocument = null;
      }
    }

    // Restore the document
    const [document] = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, id))
      .returning();

    // Recursively restore all children
    await recursiveRestore(id, userId);

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error restoring document:', error);
    return NextResponse.json(
      { error: 'Failed to restore document' },
      { status: 500 }
    );
  }
}
