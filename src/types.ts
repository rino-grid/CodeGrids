export interface CodeBlock {
  id: string;
  content: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
}

export interface DragPosition {
  x: number;
  y: number;
}