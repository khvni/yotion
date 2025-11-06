import { db } from '../db/client.js';
import { documents } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler.js';
export async function getDocuments(req, res, next) {
    try {
        const allDocuments = await db.select().from(documents).orderBy(documents.order);
        res.json({ documents: allDocuments });
    }
    catch (error) {
        next(error);
    }
}
export async function createDocument(req, res, next) {
    try {
        const { title, type, parentId, order } = req.body;
        if (!title || !type) {
            throw new AppError('Title and type are required', 400, 'INVALID_INPUT');
        }
        if (type !== 'PAGE' && type !== 'DIRECTORY') {
            throw new AppError('Type must be PAGE or DIRECTORY', 400, 'INVALID_TYPE');
        }
        const [document] = await db.insert(documents).values({
            title,
            type,
            parentId: parentId ?? null,
            order: order ?? 0,
        }).returning();
        res.status(201).json({ document });
    }
    catch (error) {
        next(error);
    }
}
export async function updateDocument(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const { title } = req.body;
        if (!title) {
            throw new AppError('Title is required', 400, 'INVALID_INPUT');
        }
        const [document] = await db
            .update(documents)
            .set({ title })
            .where(eq(documents.id, id))
            .returning();
        if (!document) {
            throw new AppError('Document not found', 404, 'NOT_FOUND');
        }
        res.json({ document });
    }
    catch (error) {
        next(error);
    }
}
export async function reorderDocuments(req, res, next) {
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
            throw new AppError('Updates must be an array', 400, 'INVALID_INPUT');
        }
        // Update each document
        const updatedDocuments = [];
        for (const update of updates) {
            const { id, parentId, order } = update;
            const [doc] = await db
                .update(documents)
                .set({
                parentId: parentId !== undefined ? parentId : undefined,
                order
            })
                .where(eq(documents.id, id))
                .returning();
            if (doc) {
                updatedDocuments.push(doc);
            }
        }
        res.json({ documents: updatedDocuments });
    }
    catch (error) {
        next(error);
    }
}
export async function deleteDocument(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const result = await db.delete(documents).where(eq(documents.id, id)).returning();
        if (result.length === 0) {
            throw new AppError('Document not found', 404, 'NOT_FOUND');
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
