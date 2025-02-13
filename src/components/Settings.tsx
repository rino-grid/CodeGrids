import React, { useState, useEffect, useRef } from 'react';
import { Settings2, CloudOff, Grid, Timer, Magnet, Eye } from 'lucide-react';
import { Button } from './ui/button';

interface SettingsState {
  gridSize: number;
  snapThreshold: number;
  showGrid: boolean;
  animationSpeed: 'normal' | 'fast';
}

const SETTINGS_KEY = 'code-canvas-settings';

const defaultSettings: SettingsState = {
  gridSize: 80,
  snapThreshold: 24,
  showGrid: true,
  animationSpeed: 'normal'
};

export function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
  }, [settings]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const handleChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const SettingButton = ({ 
    active, 
    onClick, 
    children 
  }: { 
    active: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`h-9 px-3 rounded-md text-sm font-medium transition-all duration-200 flex-1
        ${active 
          ? 'bg-white/10 text-white border border-white/20' 
          : 'bg-zinc-800/50 text-zinc-400 border border-transparent hover:bg-zinc-700/50 hover:text-zinc-300'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="lg"
        className="h-11 px-4 bg-zinc-900/90 hover:bg-zinc-800/90 backdrop-blur-sm text-zinc-500 hover:text-zinc-400 flex items-center gap-2"
        disabled
      >
        <CloudOff className="w-4 h-4" />
        <span className="text-sm">Go Online</span>
        <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">Soon</span>
      </Button>

      <div 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 bg-zinc-900/90 hover:bg-zinc-800/90 backdrop-blur-sm"
        >
          <Settings2 className="w-5 h-5 text-zinc-400" />
        </Button>

        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[320px] bg-zinc-900/95 backdrop-blur-sm rounded-lg border border-zinc-800/50 shadow-xl">
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                  <Grid className="w-4 h-4" />
                  <span>Grid Size</span>
                </div>
                <div className="flex gap-2">
                  <SettingButton 
                    active={settings.gridSize === 40} 
                    onClick={() => handleChange('gridSize', 40)}
                  >
                    Small
                  </SettingButton>
                  <SettingButton 
                    active={settings.gridSize === 80} 
                    onClick={() => handleChange('gridSize', 80)}
                  >
                    Medium
                  </SettingButton>
                  <SettingButton 
                    active={settings.gridSize === 120} 
                    onClick={() => handleChange('gridSize', 120)}
                  >
                    Large
                  </SettingButton>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                  <Timer className="w-4 h-4" />
                  <span>Counter Animation</span>
                </div>
                <div className="flex gap-2">
                  <SettingButton 
                    active={settings.animationSpeed === 'normal'} 
                    onClick={() => handleChange('animationSpeed', 'normal')}
                  >
                    Normal
                  </SettingButton>
                  <SettingButton 
                    active={settings.animationSpeed === 'fast'} 
                    onClick={() => handleChange('animationSpeed', 'fast')}
                  >
                    Fast
                  </SettingButton>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                  <Magnet className="w-4 h-4" />
                  <span>Snap Sensitivity</span>
                </div>
                <div className="flex gap-2">
                  <SettingButton 
                    active={settings.snapThreshold === 12} 
                    onClick={() => handleChange('snapThreshold', 12)}
                  >
                    Low
                  </SettingButton>
                  <SettingButton 
                    active={settings.snapThreshold === 24} 
                    onClick={() => handleChange('snapThreshold', 24)}
                  >
                    Medium
                  </SettingButton>
                  <SettingButton 
                    active={settings.snapThreshold === 36} 
                    onClick={() => handleChange('snapThreshold', 36)}
                  >
                    High
                  </SettingButton>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                  <Eye className="w-4 h-4" />
                  <span>Grid Visibility</span>
                </div>
                <div className="flex gap-2">
                  <SettingButton 
                    active={settings.showGrid} 
                    onClick={() => handleChange('showGrid', true)}
                  >
                    Show
                  </SettingButton>
                  <SettingButton 
                    active={!settings.showGrid} 
                    onClick={() => handleChange('showGrid', false)}
                  >
                    Hide
                  </SettingButton>
                </div>
              </div>

              <button
                className="w-full text-left text-xs text-zinc-500 hover:text-zinc-400 transition-colors mt-4 pt-4 border-t border-zinc-800/50"
                onClick={() => {
                  setSettings(defaultSettings);
                  localStorage.removeItem(SETTINGS_KEY);
                }}
              >
                Reset to defaults
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}