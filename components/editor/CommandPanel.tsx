"use client";

import { BlockType } from "@/app/simple-editor/page";

type Command = {
  label: string;
  type: BlockType;
  description: string;
};

const commands: Command[] = [
  { label: "Text", type: "text", description: "Plain text" },
  { label: "Heading 1", type: "heading1", description: "Large section heading" },
  { label: "Heading 2", type: "heading2", description: "Medium section heading" },
  { label: "Heading 3", type: "heading3", description: "Small section heading" },
  { label: "Image", type: "image", description: "Insert an image" },
];

type CommandPanelProps = {
  onSelectType: (type: BlockType) => void;
  filter?: string;
};

export const CommandPanel = ({ onSelectType, filter = "" }: CommandPanelProps) => {
  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="absolute z-10 mt-2 w-64 rounded-md border border-gray-200 bg-white shadow-lg">
      <div className="py-1">
        {filteredCommands.map((cmd) => (
          <button
            key={cmd.type}
            onClick={() => onSelectType(cmd.type)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
          >
            <div className="font-medium text-sm">{cmd.label}</div>
            <div className="text-xs text-gray-500">{cmd.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
