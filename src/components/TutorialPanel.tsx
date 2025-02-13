import React, { useEffect, useState } from 'react';
import { Command } from 'lucide-react';

interface UsageCount {
  paste: number;
  copy: number;
  cut: number;
  undo: number;
}

const MAX_USES = 4;
const STORAGE_KEY = 'tutorial-usage-counts';

export function TutorialPanel() {
  const [isVisible, setIsVisible] = useState(true);
  const [usageCounts, setUsageCounts] = useState<UsageCount>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { paste: MAX_USES, copy: MAX_USES, cut: MAX_USES, undo: MAX_USES };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setUsageCounts({ paste: MAX_USES, copy: MAX_USES, cut: MAX_USES, undo: MAX_USES });
        setIsVisible(true);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'v' || e.key === 'V') {
          updateCount('paste');
        } else if (e.key === 'c' || e.key === 'C') {
          updateCount('copy');
        } else if (e.key === 'x' || e.key === 'X') {
          updateCount('cut');
        } else if (e.key === 'z' || e.key === 'Z') {
          updateCount('undo');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usageCounts));
    
    // Check if all counts are 0
    const allEmpty = Object.values(usageCounts).every(count => count === 0);
    if (allEmpty) {
      setIsVisible(false);
    }
  }, [usageCounts]);

  const updateCount = (action: keyof UsageCount) => {
    setUsageCounts(prev => ({
      ...prev,
      [action]: Math.max(0, prev[action] - 1)
    }));
  };

  const renderUsageSquares = (count: number) => (
    <div className="grid grid-cols-2 gap-0.5">
      {Array.from({ length: MAX_USES }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-sm transition-all duration-300 ${
            i < count
              ? 'bg-zinc-500'
              : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  );

  const isCommandDisabled = (action: keyof UsageCount) => usageCounts[action] === 0;

  if (!isVisible) return null;

  return (
    <div className="bg-zinc-900/90 p-3 rounded-lg backdrop-blur-sm">
      <div className="flex flex-col gap-1.5 text-xs">
        {[
          { key: 'paste' as const, label: 'V', desc: 'Paste code block' },
          { key: 'copy' as const, label: 'C', desc: 'Copy selected block' },
          { key: 'cut' as const, label: 'X', desc: 'Cut selected block' },
          { key: 'undo' as const, label: 'Z', desc: 'Undo last action' },
        ].map(({ key, label, desc }) => (
          <div
            key={key}
            className={`flex items-center gap-2 transition-colors duration-300 ${
              isCommandDisabled(key) ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-400">
                <Command className="w-3 h-3 inline-block mr-0.5" />
                {label}
              </kbd>
            </div>
            <span className="text-zinc-400 flex-1">{desc}</span>
            {renderUsageSquares(usageCounts[key])}
          </div>
        ))}
      </div>
    </div>
  );
}