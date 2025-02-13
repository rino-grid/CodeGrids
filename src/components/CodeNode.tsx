import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { X, GitCompare } from 'lucide-react';
import { Node } from 'reactflow';

interface CodeNodeProps {
  data: {
    content: string;
    onDelete: () => void;
    onCreateDiff?: () => void;
  };
  selected?: boolean;
}

export function CodeNode({ data, selected }: CodeNodeProps) {
  const codeRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
      
      // Calculate dimensions
      const lines = data.content.split('\n');
      const maxLineLength = Math.max(...lines.map(line => line.length));
      
      // Set width based on longest line (assuming monospace font)
      const width = Math.min(Math.max(maxLineLength * 9, 300), 1200);
      
      if (containerRef.current) {
        containerRef.current.style.width = `${width}px`;
      }
    }
  }, [data.content]);

  return (
    <div 
      ref={containerRef}
      className={`bg-zinc-900/80 rounded-lg shadow-xl border transition-all duration-200 cursor-move
        ${selected 
          ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.3)]' 
          : 'border-zinc-800'
        }`}
    >
      <div className={`flex items-center justify-between px-3 py-2 border-b transition-colors
        ${selected ? 'bg-blue-500/10 border-blue-500/50' : 'bg-zinc-800/50 border-zinc-800'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">Code Block</span>
        </div>
        <div className="flex items-center gap-1">
          {data.onCreateDiff && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onCreateDiff();
              }}
              className="p-1 hover:bg-zinc-700 rounded transition-colors"
              title="Create diff comparison"
            >
              <GitCompare className="w-4 h-4 text-zinc-400" />
            </button>
          )}
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
      <div className="p-4 bg-[#0d1117] rounded-b-lg">
        <pre className="m-0 whitespace-pre-wrap break-words">
          <code ref={codeRef} className="text-sm font-mono">{data.content}</code>
        </pre>
      </div>
    </div>
  );
}