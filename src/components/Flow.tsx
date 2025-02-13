import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  useNodesState,
  BackgroundVariant,
  Node,
  useReactFlow,
  Panel,
} from 'reactflow';
import { useNodeHistory } from '../hooks/useNodeHistory';
import { PasteButton } from './PasteButton';
import { InfoBar } from './InfoBar';
import { CodeNode } from './CodeNode';
import { DiffNode } from './DiffNode';
import { TutorialPanel } from './TutorialPanel';
import { Settings } from './Settings';
import { CodeBlockSelector } from './CodeBlockSelector';

const nodeTypes = {
  codeNode: CodeNode,
  diffNode: DiffNode,
};

const STORAGE_KEY = 'code-canvas-state';

export function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isCutting, setIsCutting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletedNode, setDeletedNode] = useState<Node | null>(null);
  const [compareSourceNode, setCompareSourceNode] = useState<Node | null>(null);
  const [settings, setSettings] = useState({
    gridSize: 80,
    snapThreshold: 24,
    showGrid: true,
  });

  const { getViewport, screenToFlowPosition } = useReactFlow();
  const { addToHistory, undo } = useNodeHistory(nodes);

  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent) => {
      setSettings(e.detail);
    };

    window.addEventListener('settingsChanged', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  }, [nodes]);

  const handleCopy = useCallback(async () => {
    if (selectedNode) {
      await navigator.clipboard.writeText(selectedNode.data.content);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    }
  }, [selectedNode]);

  const handleCut = useCallback(async () => {
    if (selectedNode) {
      await navigator.clipboard.writeText(selectedNode.data.content);
      setIsCutting(true);
      setDeletedNode(selectedNode);
      
      handleDeleteNode(selectedNode.id);
      
      setTimeout(() => {
        setIsCutting(false);
        setDeletedNode(null);
      }, 1000);
    }
  }, [selectedNode]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const newNodes = nds.filter((node) => node.id !== nodeId);
      addToHistory(newNodes, 'delete');
      return newNodes;
    });
    setSelectedNode(null);
  }, [setNodes, addToHistory]);

  const createDiffNode = useCallback((originalNode: Node, modifiedNode: Node) => {
    const position = {
      x: originalNode.position.x + 400,
      y: originalNode.position.y,
    };

    const newNode = {
      id: crypto.randomUUID(),
      type: 'diffNode',
      position,
      data: {
        original: originalNode.data.content,
        modified: modifiedNode.data.content,
        onDelete: () => handleDeleteNode(newNode.id),
      },
    };

    setNodes((nds) => {
      const newNodes = [...nds, newNode];
      addToHistory(newNodes, 'paste');
      return newNodes;
    });

    setCompareSourceNode(null);
  }, [setNodes, addToHistory, handleDeleteNode]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const previousNodes = undo();
        if (previousNodes) {
          setNodes(previousNodes);
        }
      }

      if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        await handleCopy();
      }

      if ((e.key === 'x' || e.key === 'X') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        await handleCut();
      }

      if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        await handlePaste();
      }

      // Add Delete key handler
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        e.preventDefault();
        handleDeleteNode(selectedNode.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, setNodes, handleCopy, handleCut, selectedNode, handleDeleteNode]);

  const getNodePosition = useCallback(() => {
    const viewport = getViewport();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    return screenToFlowPosition({
      x: centerX,
      y: centerY,
    });
  }, [getViewport, screenToFlowPosition]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const position = getNodePosition();
        const snappedPosition = {
          x: Math.round(position.x / settings.gridSize) * settings.gridSize,
          y: Math.round(position.y / settings.gridSize) * settings.gridSize,
        };
        
        const newNode = {
          id: crypto.randomUUID(),
          type: 'codeNode',
          position: snappedPosition,
          data: {
            content: text,
            note: '',
            onDelete: () => handleDeleteNode(newNode.id),
            onCreateDiff: () => setCompareSourceNode(newNode),
          },
          selected: false,
        };
        setNodes((nds) => {
          const newNodes = [...nds, newNode];
          addToHistory(newNodes, 'paste');
          return newNodes;
        });
        setIsPasting(true);
        setTimeout(() => setIsPasting(false), 2000);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
      }))
    );
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: false,
      }))
    );
  };

  const handleNodeDragStart = (_: React.MouseEvent, node: Node) => {
    setIsDragging(true);
    setDraggedNode(node);
    setSelectedNode(node);
    setNodes((nds) => {
      const newNodes = nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
      }));
      addToHistory(newNodes);
      return newNodes;
    });
  };

  const handleNodeDragStop = () => {
    setIsDragging(false);
    setDraggedNode(null);
    addToHistory(nodes, 'move');
  };

  const handleNodesChange = useCallback((changes: any[]) => {
    const snappedChanges = changes.map(change => {
      if (change.type === 'position' && change.position) {
        return {
          ...change,
          position: {
            x: Math.round(change.position.x / settings.gridSize) * settings.gridSize,
            y: Math.round(change.position.y / settings.gridSize) * settings.gridSize,
          },
        };
      }
      return change;
    });

    onNodesChange(snappedChanges);
    if (!isDragging && changes.some(change => change.type === 'position')) {
      addToHistory(nodes);
    }
  }, [onNodesChange, isDragging, nodes, addToHistory, settings.gridSize]);

  const activeNode = draggedNode || selectedNode || deletedNode;

  return (
    <div className="h-screen w-screen bg-zinc-950">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <PasteButton isPasting={isPasting} onClick={handlePaste} />
        <Settings />
      </div>
      
      <ReactFlow
        nodes={nodes}
        onNodesChange={handleNodesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        snapToGrid={true}
        snapGrid={[settings.gridSize, settings.gridSize]}
        fitView
        className="bg-zinc-950"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Panel position="top-left">
          <TutorialPanel />
        </Panel>
        
        {settings.showGrid && (
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={settings.gridSize} 
            size={3} 
            className="bg-zinc-950" 
            color="rgba(255, 255, 255, 0.2)" 
          />
        )}
      </ReactFlow>

      <InfoBar
        node={activeNode}
        onCopy={handleCopy}
        onDelete={() => {
          if (activeNode) {
            handleDeleteNode(activeNode.id);
          }
        }}
        isCopying={isCopying}
        isCutting={isCutting}
      />

      {compareSourceNode && (
        <CodeBlockSelector
          nodes={nodes}
          sourceNode={compareSourceNode}
          onSelect={(targetNode) => createDiffNode(compareSourceNode, targetNode)}
          onClose={() => setCompareSourceNode(null)}
        />
      )}
    </div>
  );
}