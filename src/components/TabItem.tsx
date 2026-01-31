import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TabInfo, WindowInfo } from '../types';

interface TabItemProps {
  tab: TabInfo;
  windows: WindowInfo[];
  isFocused?: boolean;
  onClose: (tabId: number) => void;
  onActivate: (tabId: number, windowId: number) => void;
  onMoveToWindow: (tabId: number, targetWindowId: number) => void;
  onMoveToNewWindow: (tabId: number) => void;
  theme: 'light' | 'dark';
}

export function TabItem({
  tab,
  windows,
  isFocused = false,
  onClose,
  onActivate,
  onMoveToWindow,
  onMoveToNewWindow,
  theme
}: TabItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showWindowSubmenu, setShowWindowSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowWindowSubmenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  };

  const handleClick = () => {
    onActivate(tab.id, tab.windowId);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
    setShowWindowSubmenu(false);
  };

  const handleMoveToNewWindow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveToNewWindow(tab.id);
    setShowMenu(false);
  };

  const handleMoveToWindow = (e: React.MouseEvent, targetWindowId: number) => {
    e.stopPropagation();
    onMoveToWindow(tab.id, targetWindowId);
    setShowMenu(false);
    setShowWindowSubmenu(false);
  };

  const handleCloseFromMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
    setShowMenu(false);
  };

  const getFaviconUrl = () => {
    if (tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')) {
      return tab.favIconUrl;
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tab.url)}&sz=32`;
  };

  const isDark = theme === 'dark';
  const otherWindows = windows.filter(w => w.id !== tab.windowId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded group cursor-pointer relative ${
        isDark
          ? `hover:bg-gray-700 ${tab.active ? 'bg-gray-700' : ''}`
          : `hover:bg-gray-100 ${tab.active ? 'bg-gray-100' : ''}`
      } ${isFocused ? (isDark ? 'bg-gray-700 ring-1 ring-blue-500' : 'bg-gray-100 ring-1 ring-blue-500') : ''}`}
      onClick={handleClick}
    >
      <div
        {...attributes}
        {...listeners}
        tabIndex={-1}
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

      {/* Menu button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={handleMenuClick}
          tabIndex={-1}
          className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded ${
            isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
          } ${showMenu ? 'opacity-100' : ''}`}
          title="More options"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div className={`absolute right-0 top-full mt-1 py-1 w-48 rounded-lg shadow-lg z-20 border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <button
              onClick={handleMoveToNewWindow}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Move to New Window
            </button>

            {/* Move to window submenu */}
            {otherWindows.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setShowWindowSubmenu(true)}
                onMouseLeave={() => setShowWindowSubmenu(false)}
              >
                <button
                  tabIndex={-1}
                  className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between ${
                    isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Move to Window
                  </span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                  </svg>
                </button>

                {/* Submenu */}
                {showWindowSubmenu && (
                  <div className={`absolute left-full top-0 ml-1 py-1 w-40 rounded-lg shadow-lg z-30 border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    {otherWindows.map(w => (
                      <button
                        key={w.id}
                        onClick={(e) => handleMoveToWindow(e, w.id)}
                        tabIndex={-1}
                        className={`w-full px-3 py-1.5 text-left text-sm ${
                          isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Window {w.id} ({w.tabs.length})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={`my-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

            <button
              onClick={handleCloseFromMenu}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-500 ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close Tab
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleClose}
        tabIndex={-1}
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
