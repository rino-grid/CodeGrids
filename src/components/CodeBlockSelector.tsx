import React from 'react';
import { Node } from 'reactflow';
import { X, ClipboardPaste } from 'lucide-react';
import { Button } from './ui/button';

interface CodeBlockSelectorProps {
  nodes: Node[];
  sourceNode: Node;
  onSelect: (node: Node) => void;
  onClose: () => void;
}

export function CodeBlockSelector({ nodes, sourceNode, onSelect, onClose }: CodeBlockSelectorProps) {
  const otherNodes = nodes.filter(node => 
    node.id !== sourceNode.id && node.type === 'codeNode'
  );

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Create a temporary node structure
        const tempNode = {
          id: 'temp',
          type: 'codeNode',
          data: { content: text },
        };
        onSelect(tempNode as Node);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-200">Select Code Block to Compare</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <Button
              onClick={handlePaste}
              variant="secondary"
              className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20"
            >
              <ClipboardPaste className="w-4 h-4 mr-2" />
              Paste New Code Block to Compare
            </Button>
          </div>

          {otherNodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400">No other code blocks available for comparison.</p>
              <p className="text-zinc-500 text-sm mt-2">Try pasting another code block first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {otherNodes.map(node => (
                <div
                  key={node.id}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors cursor-pointer group"
                  onClick={() => onSelect(node)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-zinc-300 truncate flex-1">
                      {node.data.note || 'Untitled Code Block'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                    >
                      Compare
                    </Button>
                  </div>
                  <pre className="text-xs font-mono bg-zinc-900/50 rounded p-2 overflow-x-auto">
                    <code className="text-zinc-400">
                      {node.data.content.split('\n').slice(0, 5).join('\n')}
                      {node.data.content.split('\n').length > 5 && '\n...'}
                    </code>
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}