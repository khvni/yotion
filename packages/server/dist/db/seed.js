import { db, client } from './client.js';
import { documents, blocks } from './schema.js';
export async function seed() {
    console.log('Seeding database...');
    // Create a welcome page
    const [welcomePage] = await db.insert(documents).values({
        title: 'Welcome to Noto',
        type: 'PAGE',
        parentId: null,
        order: 0,
    }).returning();
    // Add blocks to welcome page
    await db.insert(blocks).values([
        {
            documentId: welcomePage.id,
            type: 'text',
            order: 0,
            content: { value: '# Welcome to Noto', blockType: 'h1' },
        },
        {
            documentId: welcomePage.id,
            type: 'text',
            order: 1,
            content: { value: 'This is a simple Notion clone built with React and Express.', blockType: 'paragraph' },
        },
        {
            documentId: welcomePage.id,
            type: 'text',
            order: 2,
            content: { value: '## Getting Started', blockType: 'h2' },
        },
        {
            documentId: welcomePage.id,
            type: 'text',
            order: 3,
            content: { value: 'Create new pages from the sidebar, add text and image blocks, and start building your knowledge base!', blockType: 'paragraph' },
        },
    ]);
    // Create a directory
    const [projectsDir] = await db.insert(documents).values({
        title: 'Projects',
        type: 'DIRECTORY',
        parentId: null,
        order: 1,
    }).returning();
    // Create a nested page
    await db.insert(documents).values({
        title: 'Example Project',
        type: 'PAGE',
        parentId: projectsDir.id,
        order: 0,
    });
    console.log('Database seeded successfully!');
}
// If running directly, execute seed and close client
if (import.meta.url === `file://${process.argv[1]}`) {
    seed()
        .then(() => {
        console.log('Seed completed, closing database connection...');
        return client.close();
    })
        .then(() => {
        process.exit(0);
    })
        .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    });
}
