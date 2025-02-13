import { useCallback } from 'react';
import { Node } from 'reactflow';

const SNAP_DISTANCE = 24; // Increased from 12 to 24
const GUIDE_COLOR = 'rgb(37, 99, 235)'; // Brighter blue
const GUIDE_WIDTH = 3; // Increased from 2 to 3

interface SnapGuide {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function useSnapToGrid() {
  const findSnapPoints = useCallback((nodes: Node[], activeNode: Node) => {
    const guides: SnapGuide[] = [];
    let snapX: number | null = null;
    let snapY: number | null = null;

    // Get active node dimensions from DOM
    const activeElement = document.querySelector(`[data-id="${activeNode.id}"]`);
    if (!activeElement) return { guides, snapX, snapY };

    const viewport = document.querySelector('.react-flow__viewport');
    if (!viewport) return { guides, snapX, snapY };

    const transform = viewport.style.transform;
    const match = transform.match(/scale\(([\d.]+)\)/);
    const scale = match ? parseFloat(match[1]) : 1;

    const activeBounds = activeElement.getBoundingClientRect();
    const activeLeft = activeNode.position.x;
    const activeTop = activeNode.position.y;
    const activeRight = activeLeft + activeBounds.width / scale;
    const activeBottom = activeTop + activeBounds.height / scale;
    const activeCenterX = activeLeft + (activeBounds.width / scale) / 2;
    const activeCenterY = activeTop + (activeBounds.height / scale) / 2;

    nodes.forEach((node) => {
      if (node.id === activeNode.id) return;

      const element = document.querySelector(`[data-id="${node.id}"]`);
      if (!element) return;

      const bounds = element.getBoundingClientRect();
      const left = node.position.x;
      const top = node.position.y;
      const right = left + bounds.width / scale;
      const bottom = top + bounds.height / scale;
      const centerX = left + (bounds.width / scale) / 2;
      const centerY = top + (bounds.height / scale) / 2;

      // Check horizontal alignments
      [
        { point: activeLeft, target: left, type: 'left' },
        { point: activeRight, target: right, type: 'right' },
        { point: activeCenterX, target: centerX, type: 'center' },
      ].forEach(({ point, target, type }) => {
        const diff = Math.abs(point - target);
        if (diff < SNAP_DISTANCE / scale) {
          guides.push({
            x1: target,
            y1: Math.min(activeTop, top) - 100,
            x2: target,
            y2: Math.max(activeBottom, bottom) + 100,
          });
          snapX = target - (type === 'right' ? activeBounds.width / scale : type === 'center' ? activeBounds.width / scale / 2 : 0);
        }
      });

      // Check vertical alignments
      [
        { point: activeTop, target: top, type: 'top' },
        { point: activeBottom, target: bottom, type: 'bottom' },
        { point: activeCenterY, target: centerY, type: 'center' },
      ].forEach(({ point, target, type }) => {
        const diff = Math.abs(point - target);
        if (diff < SNAP_DISTANCE / scale) {
          guides.push({
            x1: Math.min(activeLeft, left) - 100,
            y1: target,
            x2: Math.max(activeRight, right) + 100,
            y2: target,
          });
          snapY = target - (type === 'bottom' ? activeBounds.height / scale : type === 'center' ? activeBounds.height / scale / 2 : 0);
        }
      });
    });

    return { guides, snapX, snapY };
  }, []);

  const drawGuides = useCallback((guides: SnapGuide[]) => {
    clearGuides();

    const viewport = document.querySelector('.react-flow__viewport');
    if (!viewport) return;

    const transform = viewport.style.transform;
    const match = transform.match(/scale\(([\d.]+)\)/);
    const scale = match ? parseFloat(match[1]) : 1;

    // Create a container for guides
    const container = document.createElement('div');
    container.className = 'snap-guides-container';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '99999';
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = '0 0';

    // Get the ReactFlow container for proper positioning
    const reactFlowContainer = document.querySelector('.react-flow');
    if (!reactFlowContainer) return;

    reactFlowContainer.appendChild(container);

    // Draw new guides
    guides.forEach((guide) => {
      const guideElement = document.createElement('div');
      guideElement.className = 'snap-guide';
      guideElement.style.position = 'absolute';
      guideElement.style.backgroundColor = GUIDE_COLOR;
      guideElement.style.zIndex = '99999';

      if (guide.x1 === guide.x2) {
        // Vertical guide
        guideElement.style.width = `${GUIDE_WIDTH}px`;
        guideElement.style.height = `${guide.y2 - guide.y1}px`;
        guideElement.style.left = `${guide.x1 - GUIDE_WIDTH / 2}px`;
        guideElement.style.top = `${guide.y1}px`;
      } else {
        // Horizontal guide
        guideElement.style.height = `${GUIDE_WIDTH}px`;
        guideElement.style.width = `${guide.x2 - guide.x1}px`;
        guideElement.style.left = `${guide.x1}px`;
        guideElement.style.top = `${guide.y1 - GUIDE_WIDTH / 2}px`;
      }

      container.appendChild(guideElement);
    });
  }, []);

  const clearGuides = useCallback(() => {
    const container = document.querySelector('.snap-guides-container');
    if (container) {
      container.remove();
    }
  }, []);

  return { findSnapPoints, drawGuides, clearGuides };
}