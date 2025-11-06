import { db } from '../db/client.js';
import { blocks } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler.js';
export async function getBlocks(req, res, next) {
    try {
        const documentId = parseInt(req.query.documentId);
        if (!documentId) {
            throw new AppError('documentId query parameter is required', 400, 'INVALID_INPUT');
        }
        const documentBlocks = await db
            .select()
            .from(blocks)
            .where(eq(blocks.documentId, documentId))
            .orderBy(asc(blocks.order));
        res.json({ blocks: documentBlocks });
    }
    catch (error) {
        next(error);
    }
}
export async function createBlock(req, res, next) {
    try {
        const { documentId, type, order, content } = req.body;
        if (!documentId || !type || order === undefined || !content) {
            throw new AppError('documentId, type, order, and content are required', 400, 'INVALID_INPUT');
        }
        if (type !== 'text' && type !== 'image') {
            throw new AppError('Type must be text or image', 400, 'INVALID_TYPE');
        }
        const [block] = await db.insert(blocks).values({
            documentId,
            type,
            order,
            content,
        }).returning();
        res.status(201).json({ block });
    }
    catch (error) {
        next(error);
    }
}
export async function updateBlock(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const { content } = req.body;
        if (!content) {
            throw new AppError('Content is required', 400, 'INVALID_INPUT');
        }
        const [block] = await db
            .update(blocks)
            .set({ content })
            .where(eq(blocks.id, id))
            .returning();
        if (!block) {
            throw new AppError('Block not found', 404, 'NOT_FOUND');
        }
        res.json({ block });
    }
    catch (error) {
        next(error);
    }
}
export async function reorderBlocks(req, res, next) {
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
            throw new AppError('Updates must be an array', 400, 'INVALID_INPUT');
        }
        // Update each block
        const updatedBlocks = [];
        for (const update of updates) {
            const { id, order } = update;
            const [block] = await db
                .update(blocks)
                .set({ order })
                .where(eq(blocks.id, id))
                .returning();
            if (block) {
                updatedBlocks.push(block);
            }
        }
        res.json({ blocks: updatedBlocks });
    }
    catch (error) {
        next(error);
    }
}
export async function deleteBlock(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const result = await db.delete(blocks).where(eq(blocks.id, id)).returning();
        if (result.length === 0) {
            throw new AppError('Block not found', 404, 'NOT_FOUND');
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
