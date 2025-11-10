import { NextRequest, NextResponse } from "next/server";
import { getAllBlocks, createBlock } from "@/lib/db";
import { CreateBlockInput } from "@/lib/types";

export const runtime = "nodejs";

/**
 * GET /api/blocks
 * Fetch all blocks ordered by order_num
 */
export async function GET() {
  try {
    const blocks = await getAllBlocks();
    return NextResponse.json({ blocks }, { status: 200 });
  } catch (error) {
    console.error("Error fetching blocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blocks
 * Create a new block with auto-generated UUID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.content === undefined || body.order === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: type, content, and order are required" },
        { status: 400 }
      );
    }

    // Validate block type
    const validTypes = ["paragraph", "h1", "h2", "h3", "image"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid block type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const input: CreateBlockInput = {
      type: body.type,
      content: body.content,
      order: body.order,
      metadata: body.metadata,
    };

    const block = await createBlock(input);
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    console.error("Error creating block:", error);
    return NextResponse.json(
      { error: "Failed to create block" },
      { status: 500 }
    );
  }
}
