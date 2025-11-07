import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import type { Block, TextBlockContent, TextBlockType } from '@/lib/editor-types';
import { renderMarkdownToHtml } from '@/lib/markdown';

interface TextBlockProps {
  block: Block;
  onUpdate: (id: string, content: TextBlockContent) => void;
  onDelete: (id: string) => void;
  onCreate: (afterOrder: number) => void;
}

const ensureBlockType = (type?: TextBlockType): TextBlockType => type ?? 'paragraph';

const getPreviewClassName = (blockType: TextBlockType) => {
  const base =
    'px-3 py-2 rounded min-h-[2em] break-words cursor-text hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  switch (blockType) {
    case 'h1':
      return `${base} text-4xl font-bold`;
    case 'h2':
      return `${base} text-3xl font-bold`;
    case 'h3':
      return `${base} text-2xl font-semibold`;
    case 'paragraph':
    default:
      return `${base} text-base`;
  }
};

export function TextBlock({ block, onUpdate, onDelete, onCreate }: TextBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const incomingContent = block.content as TextBlockContent;
  const [localContent, setLocalContent] = useState<TextBlockContent>({
    value: incomingContent.value,
    blockType: ensureBlockType(incomingContent.blockType),
  });
  const [isEditing, setIsEditing] = useState(() => !incomingContent.value);

  const previewHtml = useMemo(
    () => renderMarkdownToHtml(localContent.value),
    [localContent.value]
  );

  useEffect(() => {
    setLocalContent({
      value: incomingContent.value,
      blockType: ensureBlockType(incomingContent.blockType),
    });

    if (!incomingContent.value) {
      setIsEditing(true);
    }
  }, [incomingContent.value, incomingContent.blockType]);

  useEffect(() => {
    if (!isEditing || !contentRef.current) {
      return;
    }

    if (contentRef.current.textContent !== localContent.value) {
      contentRef.current.textContent = localContent.value;
    }
  }, [isEditing, localContent.value]);

  useEffect(() => {
    if (isEditing && contentRef.current) {
      requestAnimationFrame(() => {
        contentRef.current?.focus();
      });
    }
  }, [isEditing]);

  const moveCursorToEnd = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      const range = document.createRange();
      const sel = window.getSelection();

      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const rawText = e.currentTarget.textContent || '';
    setLocalContent({ value: rawText, blockType: localContent.blockType });
  };

  const handleBlur = () => {
    setIsEditing(false);

    // Parse block type from value on blur
    let finalValue = localContent.value;
    let finalType = localContent.blockType;

    if (finalValue.startsWith('### ')) {
      finalType = 'h3';
      finalValue = finalValue.slice(4);
    } else if (finalValue.startsWith('## ')) {
      finalType = 'h2';
      finalValue = finalValue.slice(3);
    } else if (finalValue.startsWith('# ')) {
      finalType = 'h1';
      finalValue = finalValue.slice(2);
    }

    const updatedContent = { value: finalValue, blockType: finalType };
    setLocalContent(updatedContent);

    if (
      finalValue !== incomingContent.value ||
      ensureBlockType(finalType) !== ensureBlockType(incomingContent.blockType)
    ) {
      onUpdate(block.id, updatedContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const allEditableBlocks = document.querySelectorAll('[contenteditable="true"]');
    const currentIndex = Array.from(allEditableBlocks).findIndex((b) => b === contentRef.current);

    // Handle up arrow - navigate to previous block
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex > 0) {
        const prevBlock = allEditableBlocks[currentIndex - 1] as HTMLElement;
        prevBlock?.focus();
      }
      return;
    }

    // Handle down arrow - navigate to next block
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentIndex < allEditableBlocks.length - 1) {
        const nextBlock = allEditableBlocks[currentIndex + 1] as HTMLElement;
        nextBlock?.focus();
      }
      return;
    }

    // Handle backspace on empty block - delete the block
    if (e.key === 'Backspace' && localContent.value === '') {
      e.preventDefault();

      // Focus previous block before deleting
      if (currentIndex > 0) {
        const prevBlock = allEditableBlocks[currentIndex - 1] as HTMLElement;
        prevBlock?.focus();
      }

      onDelete(block.id);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onCreate(block.order);

      // Focus next block after short delay
      setTimeout(() => {
        const blocks = document.querySelectorAll('[contenteditable="true"]');
        const currentIndex = Array.from(blocks).findIndex((b) => b === contentRef.current);
        const nextBlock = blocks[currentIndex + 1] as HTMLElement | undefined;
        nextBlock?.focus();
      }, 50);
    }
  };

  const handlePreviewClick = () => {
    setIsEditing(true);
    requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        moveCursorToEnd();
      }
    });
  };

  const handlePreviewKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePreviewClick();
    }
  };

  const editingClassName =
    'outline-none px-3 py-2 rounded bg-background hover:bg-muted/50 focus:bg-background focus-visible:ring-2 focus-visible:ring-primary min-h-[2em] break-words text-base';

  const hasValue = localContent.value.length > 0;

  return (
    <div className="relative">
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={isEditing ? editingClassName : `${editingClassName} hidden`}
        data-placeholder={hasValue ? '' : 'Start typing...'}
      />

      {!isEditing && (
        <div
          className={getPreviewClassName(ensureBlockType(localContent.blockType))}
          tabIndex={0}
          role="textbox"
          aria-label="Text block"
          onClick={handlePreviewClick}
          onKeyDown={handlePreviewKeyDown}
        >
          {hasValue ? (
            <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <span className="text-muted-foreground">Start typing...</span>
          )}
        </div>
      )}
    </div>
  );
}
