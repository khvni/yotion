// Block types for the custom editor
export type BlockType = 'text' | 'image';
export type TextBlockType = 'paragraph' | 'h1' | 'h2' | 'h3';

export interface TextBlockContent {
  value: string;
  blockType?: TextBlockType;
}

export interface ImageBlockContent {
  src: string;
  width: number;
  height: number;
}

export type BlockContent = TextBlockContent | ImageBlockContent;

export interface Block {
  id: string;
  type: BlockType;
  order: number;
  content: BlockContent;
}
