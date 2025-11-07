"use client";

import { useState, useEffect, useCallback } from 'react';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Block, BlockContent, TextBlockContent, ImageBlockContent } from '@/lib/editor-types';

interface CustomEditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

export function CustomEditor({ onChange, initialContent, editable = true }: CustomEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Initialize blocks from initialContent
  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        if (Array.isArray(parsed)) {
          setBlocks(parsed);
        } else {
          // If it's old BlockNote format, start fresh
          setBlocks([{
            id: generateId(),
            type: 'text',
            order: 0,
            content: { value: '', blockType: 'paragraph' },
          }]);
        }
      } catch {
        // If parsing fails, start with empty block
        setBlocks([{
          id: generateId(),
          type: 'text',
          order: 0,
          content: { value: '', blockType: 'paragraph' },
        }]);
      }
    } else {
      // Start with one empty text block
      setBlocks([{
        id: generateId(),
        type: 'text',
        order: 0,
        content: { value: '', blockType: 'paragraph' },
      }]);
    }
  }, [initialContent]);

  // Notify parent of changes
  useEffect(() => {
    if (blocks.length > 0) {
      onChange(JSON.stringify(blocks, null, 2));
    }
  }, [blocks, onChange]);

  const generateId = () => {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleUpdateBlock = useCallback((id: string, content: BlockContent) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === id ? { ...block, content } : block
      )
    );
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks(prevBlocks => {
      const filtered = prevBlocks.filter(block => block.id !== id);
      // Don't allow deleting the last block
      if (filtered.length === 0) {
        return [{
          id: generateId(),
          type: 'text',
          order: 0,
          content: { value: '', blockType: 'paragraph' },
        }];
      }
      return filtered;
    });
  }, []);

  const handleCreateBlock = useCallback((afterOrder: number) => {
    setBlocks(prevBlocks => {
      const newBlock: Block = {
        id: generateId(),
        type: 'text',
        order: afterOrder + 1,
        content: { value: '', blockType: 'paragraph' },
      };

      // Insert new block after the specified order
      const updated = [...prevBlocks, newBlock].map((block, index) => ({
        ...block,
        order: index,
      }));

      return updated;
    });
  }, []);

  const handleAddTextBlock = () => {
    const newBlock: Block = {
      id: generateId(),
      type: 'text',
      order: blocks.length,
      content: { value: '', blockType: 'paragraph' },
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleAddImageBlock = () => {
    const newBlock: Block = {
      id: generateId(),
      type: 'image',
      order: blocks.length,
      content: { src: '', width: 400, height: 300 },
    };
    setBlocks([...blocks, newBlock]);
  };

  if (!editable) {
    // Read-only view
    return (
      <div className="space-y-2">
        {blocks.map((block) => (
          <div key={block.id}>
            {block.type === 'text' && (
              <TextBlock
                block={block}
                onUpdate={() => {}}
                onDelete={() => {}}
                onCreate={() => {}}
              />
            )}
            {block.type === 'image' && (
              <ImageBlock
                block={block}
                onUpdate={() => {}}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-40">
      {blocks.map((block) => (
        <div key={block.id} className="group relative">
          <div className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">
              {block.type === 'text' && (
                <TextBlock
                  block={block}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                  onCreate={handleCreateBlock}
                />
              )}
              {block.type === 'image' && (
                <ImageBlock
                  block={block}
                  onUpdate={handleUpdateBlock}
                />
              )}
            </div>

            {block.type !== 'image' || (block.content as ImageBlockContent).src ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteBlock(block.id)}
                className="self-start opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <span className="text-muted-foreground hover:text-destructive">×</span>
              </Button>
            ) : null}
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddTextBlock}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Text Block
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddImageBlock}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Image Block
        </Button>
      </div>
    </div>
  );
}
