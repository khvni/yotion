"use client";

import {
  useRef,
  useEffect,
  FormEventHandler,
  KeyboardEventHandler,
  useState,
} from "react";
import { CommandPanel } from "./CommandPanel";
import { Block, BlockType } from "@/app/simple-editor/page";

type TextBlockProps = {
  block: Block;
  index: number;
  isFocused: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onAdd: () => void;
  onRemove: () => void;
  onChangeType: (type: BlockType) => void;
  onFocus: () => void;
};

export const TextBlock = ({
  block,
  index,
  isFocused,
  onUpdate,
  onAdd,
  onRemove,
  onChangeType,
  onFocus,
}: TextBlockProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [showCommandPanel, setShowCommandPanel] = useState(false);

  useEffect(() => {
    if (nodeRef.current && document.activeElement !== nodeRef.current) {
      nodeRef.current.textContent = block.content;
    }
    if (isFocused) {
      nodeRef.current?.focus();
    } else {
      nodeRef.current?.blur();
    }
  }, [block.content, isFocused]);

  useEffect(() => {
    setShowCommandPanel(isFocused && block.content.startsWith("/"));
  }, [isFocused, block.content]);

  const handleInput: FormEventHandler<HTMLDivElement> = ({ currentTarget }) => {
    const { textContent } = currentTarget;
    onUpdate({ content: textContent || "" });
  };

  const handleClick = () => {
    onFocus();
  };

  const handleCommand = (type: BlockType) => {
    if (nodeRef.current) {
      onChangeType(type);
      nodeRef.current.textContent = "";
      onUpdate({ content: "" });
      setShowCommandPanel(false);
    }
  };

  const onKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLDivElement;

    if (event.key === "Enter") {
      event.preventDefault();
      if (target.textContent?.[0] === "/") {
        return;
      }
      onAdd();
    }

    if (event.key === "Backspace") {
      if (target.textContent?.length === 0) {
        event.preventDefault();
        onRemove();
      }
    }
  };

  const getClassName = () => {
    const baseClasses = "outline-none focus:outline-none min-h-[28px]";

    switch (block.type) {
      case "heading1":
        return `${baseClasses} text-4xl font-bold`;
      case "heading2":
        return `${baseClasses} text-3xl font-semibold`;
      case "heading3":
        return `${baseClasses} text-2xl font-semibold`;
      default:
        return `${baseClasses} text-base`;
    }
  };

  return (
    <div className="relative">
      {showCommandPanel && (
        <CommandPanel
          onSelectType={handleCommand}
          filter={block.content.slice(1)}
        />
      )}
      <div
        onInput={handleInput}
        onClick={handleClick}
        onKeyDown={onKeyDown}
        ref={nodeRef}
        contentEditable
        suppressContentEditableWarning
        className={getClassName()}
      />
    </div>
  );
};
