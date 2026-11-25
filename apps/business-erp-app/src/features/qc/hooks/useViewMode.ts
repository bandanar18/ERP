import { useState, useEffect } from 'react';

// Global state to sync across tabs without full reloads
let globalViewMode: 'cards' | 'list' = 'cards';
const listeners = new Set<(mode: 'cards' | 'list') => void>();

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<'cards' | 'list'>(globalViewMode);

  useEffect(() => {
    listeners.add(setViewModeState);
    return () => {
      listeners.delete(setViewModeState);
    };
  }, []);

  const setViewMode = (mode: 'cards' | 'list') => {
    if (mode === globalViewMode) return;
    globalViewMode = mode;
    listeners.forEach(listener => listener(mode));
  };

  return { viewMode, setViewMode };
}
