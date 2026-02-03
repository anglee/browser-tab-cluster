import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import { TabInfo } from '../types';

interface DragOverlayProps {
  activeTab: TabInfo | null;
  theme?: 'light' | 'dark';
}

export function DragOverlay({ activeTab, theme = 'dark' }: DragOverlayProps) {
  if (!activeTab) return null;

  const getFaviconUrl = () => {
    if (activeTab.favIconUrl && !activeTab.favIconUrl.startsWith('chrome://')) {
      return activeTab.favIconUrl;
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(activeTab.url)}&sz=32`;
  };

  const isDark = theme === 'dark';

  return (
    <DndDragOverlay>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl ring-2 ring-blue-500 ${
        isDark ? 'bg-mist-900' : 'bg-mist-50'
      }`}>
        <img
          src={getFaviconUrl()}
          alt=""
          className="w-4 h-4 flex-shrink-0"
        />
        <span className={`text-sm max-w-xs truncate ${isDark ? 'text-mist-200' : 'text-mist-700'}`}>
          {activeTab.title || 'Untitled'}
        </span>
      </div>
    </DndDragOverlay>
  );
}
