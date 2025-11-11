import { NextRequest, NextResponse } from "next/server";
import { updateBlock } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/blocks/reorder
 * Batch update block orders for drag-and-drop reordering
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blocks } = body;

    if (!blocks || !Array.isArray(blocks)) {
      return NextResponse.json(
        { error: "Invalid request. Expected blocks array." },
        { status: 400 }
      );
    }

    // Validate all blocks have id and order
    for (const block of blocks) {
      if (!block.id || typeof block.order !== "number") {
        return NextResponse.json(
          { error: "Each block must have an id and order" },
          { status: 400 }
        );
      }
    }

    // Update each block's order
    await Promise.all(
      blocks.map((block: { id: string; order: number }) =>
        updateBlock(block.id, { order: block.order })
      )
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error reordering blocks:", error);
    return NextResponse.json(
      { error: "Failed to reorder blocks" },
      { status: 500 }
    );
  }
}
