import { NextRequest, NextResponse } from "next/server";
import { getAllBlocks, updateBlock, deleteBlock } from "@/lib/db";
import { UpdateBlockInput } from "@/lib/types";

export const runtime = "nodejs";

/**
 * GET /api/blocks/:id
 * Fetch a single block by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch all blocks and find the one with matching ID
    const blocks = await getAllBlocks();
    const block = blocks.find((b) => b.id === id);

    if (!block) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ block }, { status: 200 });
  } catch (error) {
    console.error("Error fetching block:", error);
    return NextResponse.json(
      { error: "Failed to fetch block" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/blocks/:id
 * Update a block (content, type, order, metadata)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate block type if provided
    if (body.type) {
      const validTypes = ["paragraph", "h1", "h2", "h3", "image"];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: `Invalid block type. Must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Build update input
    const input: UpdateBlockInput = {};
    if (body.content !== undefined) input.content = body.content;
    if (body.type !== undefined) input.type = body.type;
    if (body.order !== undefined) input.order = body.order;
    if (body.metadata !== undefined) input.metadata = body.metadata;

    // Check if there are any updates
    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const block = await updateBlock(id, input);
    return NextResponse.json({ block }, { status: 200 });
  } catch (error) {
    console.error("Error updating block:", error);
    return NextResponse.json(
      { error: "Failed to update block" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blocks/:id
 * Delete a block by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await deleteBlock(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting block:", error);
    return NextResponse.json(
      { error: "Failed to delete block" },
      { status: 500 }
    );
  }
}
