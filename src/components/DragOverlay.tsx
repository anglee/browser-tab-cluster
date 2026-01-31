import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import { TabInfo } from '../types';

interface DragOverlayProps {
  activeTab: TabInfo | null;
}

export function DragOverlay({ activeTab }: DragOverlayProps) {
  if (!activeTab) return null;

  const getFaviconUrl = () => {
    if (activeTab.favIconUrl && !activeTab.favIconUrl.startsWith('chrome://')) {
      return activeTab.favIconUrl;
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(activeTab.url)}&sz=32`;
  };

  return (
    <DndDragOverlay>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg shadow-xl border border-blue-500">
        <img
          src={getFaviconUrl()}
          alt=""
          className="w-4 h-4 flex-shrink-0"
        />
        <span className="text-sm text-gray-200 max-w-xs truncate">
          {activeTab.title || 'Untitled'}
        </span>
      </div>
    </DndDragOverlay>
  );
}
