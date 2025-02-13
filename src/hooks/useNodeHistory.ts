import { useState, useCallback } from 'react';
import { Node } from 'reactflow';

export function useNodeHistory(initialNodes: Node[]) {
  const [history, setHistory] = useState<Node[][]>([[...initialNodes]]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  const addToHistory = useCallback((newNodes: Node[], action?: string) => {
    // Only add to history for specific actions
    if (action && !['paste', 'cut', 'delete', 'move'].includes(action)) {
      return;
    }

    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push([...newNodes]);
    setHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
  }, [history, currentHistoryIndex]);

  const undo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(prev => prev - 1);
      return history[currentHistoryIndex - 1];
    }
    return null;
  }, [currentHistoryIndex, history]);

  return { addToHistory, undo };
}