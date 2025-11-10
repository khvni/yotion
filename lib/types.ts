export type BlockType = "paragraph" | "h1" | "h2" | "h3" | "image";

export interface BlockMetadata {
  width?: number;
  height?: number;
  alt?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  order: number;
  metadata?: BlockMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlockInput {
  type: BlockType;
  content: string;
  order: number;
  metadata?: BlockMetadata;
}

export interface UpdateBlockInput {
  content?: string;
  type?: BlockType;
  order?: number;
  metadata?: BlockMetadata;
}
