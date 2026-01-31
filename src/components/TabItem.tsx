import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TabInfo } from '../types';

interface TabItemProps {
  tab: TabInfo;
  onClose: (tabId: number) => void;
  onActivate: (tabId: number, windowId: number) => void;
  theme: 'light' | 'dark';
}

export function TabItem({ tab, onClose, onActivate, theme }: TabItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `tab-${tab.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  };

  const handleClick = () => {
    onActivate(tab.id, tab.windowId);
  };

  const getFaviconUrl = () => {
    if (tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')) {
      return tab.favIconUrl;
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tab.url)}&sz=32`;
  };

  const isDark = theme === 'dark';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded group cursor-pointer ${
        isDark
          ? `hover:bg-gray-700 ${tab.active ? 'bg-gray-700' : ''}`
          : `hover:bg-gray-100 ${tab.active ? 'bg-gray-100' : ''}`
      }`}
      onClick={handleClick}
    >
      <div
        {...attributes}
        {...listeners}
        className={`cursor-grab active:cursor-grabbing p-1 ${
          isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </div>

      <img
        src={getFaviconUrl()}
        alt=""
        className="w-4 h-4 flex-shrink-0"
        onError={e => {
          (e.target as HTMLImageElement).src =
            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>';
        }}
      />

      <span className={`flex-1 text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`} title={tab.title}>
        {tab.title || 'Untitled'}
      </span>

      {tab.pinned && (
        <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582a1 1 0 01.646.934v2.161a1 1 0 01-.646.934L11 11.516V15a1 1 0 01-.293.707l-1 1a1 1 0 01-1.414 0l-1-1A1 1 0 017 15v-3.484l-3.954-1.582A1 1 0 012.4 9V6.839a1 1 0 01.646-.934L7 4.323V3a1 1 0 011-1h2z" />
        </svg>
      )}

      <button
        onClick={handleClose}
        className={`p-1 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}
        title="Close tab"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
