import React, { useState, useRef, useEffect } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { Grip, X } from 'lucide-react';
import type { CodeBlock as CodeBlockType } from '../types';

interface Props {
  block: CodeBlockType;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onResize: (id: string, dimensions: { width: number; height: number }) => void;
  onDelete: (id: string) => void;
}

export function CodeBlock({ block, onMove, onResize, onDelete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (blockRef.current) {
      hljs.highlightElement(blockRef.current.querySelector('pre')!);
    }
  }, [block.content]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - block.position.x,
      y: e.clientY - block.position.y,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({
      x: e.clientX - block.dimensions.width,
      y: e.clientY - block.dimensions.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onMove(block.id, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (isResizing) {
        onResize(block.id, {
          width: Math.max(200, e.clientX - dragStart.x),
          height: Math.max(100, e.clientY - dragStart.y),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, block.id, onMove, onResize]);

  return (
    <div
      ref={blockRef}
      className="absolute bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      style={{
        left: block.position.x,
        top: block.position.y,
        width: block.dimensions.width,
        height: block.dimensions.height,
      }}
    >
      <div
        className="h-8 bg-gray-700 flex items-center justify-between px-2 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <Grip className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => onDelete(block.id)}
          className="p-1 hover:bg-gray-600 rounded"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <pre className="p-4 overflow-auto h-[calc(100%-2rem)]">
        <code>{block.content}</code>
      </pre>
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="w-2 h-2 bg-gray-400 rounded-full absolute bottom-1 right-1" />
      </div>
    </div>
  );
}