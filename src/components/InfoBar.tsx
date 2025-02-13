import React, { useEffect, useState, useRef } from 'react';
import { Node } from 'reactflow';
import { Copy, Trash2, Check, MessageSquare, GitCompare } from 'lucide-react';
import { Button } from './ui/button';

interface InfoBarProps {
  node: Node | null;
  onCopy: () => void;
  onDelete: () => void;
  isCopying?: boolean;
  isCutting?: boolean;
}

// Animation durations in milliseconds
const ANIMATION_SPEEDS = {
  normal: 3500, // Much slower for normal mode
  fast: 800     // Fast mode
};

export function InfoBar({ node, onCopy, onDelete, isCopying = false, isCutting = false }: InfoBarProps) {
  const [displayLines, setDisplayLines] = useState(0);
  const [displayChars, setDisplayChars] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [note, setNote] = useState('');
  const animationRef = useRef<number>();
  const noteInputRef = useRef<HTMLInputElement>(null);
  const previousValuesRef = useRef({ lines: 0, chars: 0 });
  const speedRef = useRef<'normal' | 'fast'>('normal');

  // Load initial speed from settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('code-canvas-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      speedRef.current = settings.animationSpeed || 'normal';
    }
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent) => {
      if (e.detail.animationSpeed) {
        speedRef.current = e.detail.animationSpeed;
      }
    };

    window.addEventListener('settingsChanged', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (node?.data?.content) {
      setIsVisible(true);
      setNote(node.data.note || '');

      const content = node.data.content as string;
      const targetLines = content.split('\n').length;
      const targetChars = content.length;

      // Store current display values as starting point
      const startLines = previousValuesRef.current.lines;
      const startChars = previousValuesRef.current.chars;

      // Update previous values for next animation
      previousValuesRef.current = { lines: targetLines, chars: targetChars };

      if (isCutting) {
        // Animate to zero when cutting
        let startTime: number | null = null;
        const duration = 1000; // Match the cutting animation duration

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          const easeInQuad = (t: number) => t * t;
          const easedProgress = easeInQuad(progress);

          const newLines = Math.max(0, Math.round(targetLines * (1 - easedProgress)));
          const newChars = Math.max(0, Math.round(targetChars * (1 - easedProgress)));

          setDisplayLines(newLines);
          setDisplayChars(newChars);

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animate between values
        let startTime: number | null = null;
        const duration = ANIMATION_SPEEDS[speedRef.current];

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          
          // Use easeOutElastic for a more natural counting feel
          const easeOutElastic = (t: number) => {
            const p = 0.3;
            return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
          };
          const easedProgress = easeOutElastic(progress);

          // Interpolate between start and target values
          const newLines = Math.max(0, Math.round(startLines + (targetLines - startLines) * easedProgress));
          const newChars = Math.max(0, Math.round(startChars + (targetChars - startChars) * easedProgress));

          setDisplayLines(newLines);
          setDisplayChars(newChars);

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      }

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      setIsVisible(false);
      // Store zero values when hiding
      previousValuesRef.current = { lines: 0, chars: 0 };
      setDisplayLines(0);
      setDisplayChars(0);
    }
  }, [node, isCutting]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
    if (node) {
      node.data.note = e.target.value;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      noteInputRef.current?.blur();
    }
  };

  const getButtonText = () => {
    if (isCutting) return 'Cut!';
    if (isCopying) return 'Copied!';
    return 'Copy';
  };

  const getButtonVariant = () => {
    if (isCutting) return 'destructive';
    if (isCopying) return 'secondary';
    return 'secondary';
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-zinc-900/95 border-t border-zinc-800 backdrop-blur-sm p-4 
        flex items-center justify-between gap-4 transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
    >
      <div className="flex items-center gap-8 flex-1 min-w-0">
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400">Lines</span>
            <span className="text-sm font-mono text-zinc-200 tabular-nums">
              {displayLines.toString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400">Characters</span>
            <span className="text-sm font-mono text-zinc-200 tabular-nums">
              {displayChars.toString()}
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-zinc-800 flex-shrink-0"></div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-600 flex-shrink-0" />
          <input
            ref={noteInputRef}
            type="text"
            value={note}
            onChange={handleNoteChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none h-8"
            placeholder="Add a note about this code..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="lg"
          className="flex items-center gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 h-11 px-6"
          onClick={onDelete}
        >
          <Trash2 className="w-5 h-5" />
          <span>Delete</span>
        </Button>

        {node?.type === 'codeNode' && node.data.onCreateDiff && (
          <Button
            variant="ghost"
            size="lg"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 h-11 px-6"
            onClick={(e) => {
              e.stopPropagation();
              node.data.onCreateDiff();
            }}
          >
            <GitCompare className="w-5 h-5" />
            <span>Compare</span>
          </Button>
        )}

        <div className="w-[140px]">
          <Button
            variant={getButtonVariant()}
            size="lg"
            className="flex items-center gap-2 transition-all duration-300 ease-in-out w-full h-11"
            onClick={onCopy}
          >
            <div className="w-5 h-5 relative">
              <div className={`absolute inset-0 transition-all duration-300 ease-in-out 
                ${isCopying || isCutting ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                <Copy className="w-5 h-5" />
              </div>
              <div className={`absolute inset-0 transition-all duration-300 ease-in-out
                ${isCopying || isCutting ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                <Check className="w-5 h-5" />
              </div>
            </div>
            <div className="w-[60px] relative h-5 overflow-hidden">
              <div className={`absolute inset-0 transition-all duration-300 ease-in-out flex items-center justify-center
                ${isCopying || isCutting ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
                Copy
              </div>
              <div className={`absolute inset-0 transition-all duration-300 ease-in-out flex items-center justify-center
                ${isCopying || isCutting ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                {getButtonText()}
              </div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}