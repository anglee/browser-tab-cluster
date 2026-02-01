import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  HolderOutlined,
  PushpinFilled,
  PushpinOutlined,
  MoreOutlined,
  PlusOutlined,
  SelectOutlined,
  RightOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { TabInfo, WindowInfo } from '../types';

interface TabItemProps {
  tab: TabInfo;
  windows: WindowInfo[];
  hasFocus?: boolean;
  isChecked?: boolean;
  onToggleCheck?: (tabId: number, checked: boolean) => void;
  onClose: (tabId: number) => void;
  onActivate: (tabId: number, windowId: number) => void;
  onMoveToWindow: (tabId: number, targetWindowId: number) => void;
  onMoveToNewWindow: (tabId: number) => void;
  onTogglePin: (tabId: number, pinned: boolean) => void;
  theme: 'light' | 'dark';
}

export function TabItem({
  tab,
  windows,
  hasFocus = false,
  isChecked = false,
  onToggleCheck,
  onClose,
  onActivate,
  onMoveToWindow,
  onMoveToNewWindow,
  onTogglePin,
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

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(tab.id, !tab.pinned);
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
      } ${hasFocus ? 'border border-dashed border-blue-500' : ''}`}
      onClick={handleClick}
    >
      {/* Checkbox for multi-select */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => {
          e.stopPropagation();
          onToggleCheck?.(tab.id, e.target.checked);
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        className={`w-3.5 h-3.5 rounded flex-shrink-0 cursor-pointer ${
          isChecked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } transition-opacity ${
          isDark
            ? 'border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800'
            : 'border-gray-300 bg-white text-blue-500 focus:ring-blue-500 focus:ring-offset-white'
        }`}
      />

      <div
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className={`cursor-grab active:cursor-grabbing p-1 ${
          isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <HolderOutlined className="text-xs" />
      </div>

      {tab.pinned && (
        <span title="Pinned">
          <PushpinFilled className="text-xs text-blue-400 flex-shrink-0" />
        </span>
      )}

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
          <MoreOutlined className="text-xs" />
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
              <PlusOutlined className="text-base" />
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
                    <SelectOutlined className="text-base" />
                    Move to Window
                  </span>
                  <RightOutlined className="text-xs" />
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

            <button
              onClick={handleTogglePin}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <PushpinOutlined className="text-base" />
              {tab.pinned ? 'Unpin' : 'Pin'}
            </button>

            <div className={`my-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

            <button
              onClick={handleCloseFromMenu}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-500 ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <CloseOutlined className="text-base" />
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
        <CloseOutlined className="text-xs" />
      </button>
    </div>
  );
}
