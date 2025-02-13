import React from 'react';
import { ClipboardPaste, Check } from 'lucide-react';
import { Button } from './ui/button';

interface PasteButtonProps {
  isPasting: boolean;
  onClick: () => void;
}

export function PasteButton({ isPasting, onClick }: PasteButtonProps) {
  return (
    <Button 
      onClick={onClick} 
      size="lg" 
      variant={isPasting ? "secondary" : "default"}
      className={`flex items-center gap-2 h-11 px-6 transition-all duration-300 ease-in-out
        ${isPasting ? 'bg-white text-zinc-900 hover:bg-zinc-100' : ''}`}
    >
      <div className="w-5 h-5 relative">
        <div className={`absolute inset-0 transition-all duration-300 ease-in-out 
          ${isPasting ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
          <ClipboardPaste className="w-5 h-5" />
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ease-in-out
          ${isPasting ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <Check className="w-5 h-5" />
        </div>
      </div>
      <div className="w-[60px] relative h-5 overflow-hidden">
        <div className={`absolute inset-0 transition-all duration-300 ease-in-out flex items-center justify-center
          ${isPasting ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          Paste
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ease-in-out flex items-center justify-center
          ${isPasting ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          Pasted!
        </div>
      </div>
    </Button>
  );
}