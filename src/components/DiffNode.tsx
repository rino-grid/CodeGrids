import React, { useRef, useState, useEffect } from 'react';
import { DiffEditor, loader } from '@monaco-editor/react';
import { X, ClipboardPaste, Columns, AlignJustify, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Handle, Position, useReactFlow } from 'reactflow';

// Configure Monaco Editor CDN
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

interface DiffNodeProps {
  data: {
    original: string;
    modified: string;
    onDelete: () => void;
  };
  selected?: boolean;
}

export function DiffNode({ data, selected }: DiffNodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sideBySide, setSideBySide] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isEditorReady, setIsEditorReady] = useState(false);
  const { getZoom } = useReactFlow();

  const handleCopyModified = async () => {
    await navigator.clipboard.writeText(data.modified);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const zoom = getZoom();
      
      setIsResizing(true);
      setResizeStart({
        x: e.clientX / zoom,
        y: e.clientY / zoom,
        width: rect.width,
        height: rect.height
      });
    }
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (isResizing && containerRef.current) {
        e.preventDefault();
        e.stopPropagation();
        
        const zoom = getZoom();
        const currentX = e.clientX / zoom;
        const currentY = e.clientY / zoom;
        
        const deltaX = currentX - resizeStart.x;
        const deltaY = currentY - resizeStart.y;
        
        const newWidth = Math.max(600, resizeStart.width + deltaX);
        const newHeight = Math.max(300, resizeStart.height + deltaY);
        
        setDimensions({ width: newWidth, height: newHeight });
        
        // Prevent text selection during resize
        window.getSelection()?.removeAllRanges();
      }
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      
      // Disable pointer events on iframes while resizing
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.style.pointerEvents = 'none';
      });

      // Add a class to the body to prevent text selection
      document.body.classList.add('resize-active');
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      
      // Re-enable pointer events on iframes
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.style.pointerEvents = 'auto';
      });

      // Remove the resize class from body
      document.body.classList.remove('resize-active');
    };
  }, [isResizing, resizeStart, getZoom]);

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      
      <div 
        ref={containerRef}
        style={{ 
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
        className={`bg-zinc-900/80 rounded-lg shadow-xl border transition-colors duration-200 flex flex-col relative
          ${selected 
            ? 'border-purple-500 shadow-[0_0_0_2px_rgba(168,85,247,0.3)]' 
            : 'border-zinc-800'
          }`}
      >
        <div 
          className={`flex items-center justify-between px-3 py-2 border-b transition-colors flex-shrink-0
            ${selected ? 'bg-purple-500/10 border-purple-500/50' : 'bg-zinc-800/50 border-zinc-800'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Diff View</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50"
              onClick={() => setSideBySide(!sideBySide)}
              title={sideBySide ? "Switch to inline view" : "Switch to side-by-side view"}
            >
              {sideBySide ? (
                <AlignJustify className="w-4 h-4" />
              ) : (
                <Columns className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50"
              onClick={handleCopyModified}
            >
              <ClipboardPaste className="w-4 h-4 mr-1" />
              Copy Modified
            </Button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete();
              }}
              className="p-1 hover:bg-zinc-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-[#1e1e1e] rounded-b-lg overflow-hidden">
          <DiffEditor
            height="100%"
            original={data.original}
            modified={data.modified}
            language="typescript"
            theme="vs-dark"
            loading={<div className="flex items-center justify-center h-full text-zinc-400">Loading editor...</div>}
            onMount={() => setIsEditorReady(true)}
            options={{
              renderSideBySide: sideBySide,
              fontSize: 13,
              lineHeight: 1.5,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              folding: false,
              lineNumbers: 'on',
              readOnly: true,
              renderOverviewRuler: false,
              wordWrap: 'on',
              diffWordWrap: 'on',
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
              }
            }}
          />
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute bottom-1 right-1 text-zinc-600 group-hover:text-zinc-400 transition-colors">
            <GripVertical className="w-4 h-4 transform rotate-45" />
          </div>
        </div>
      </div>
    </>
  );
}