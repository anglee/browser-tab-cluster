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
  CloseOutlined,
} from '@ant-design/icons';
import { TabInfo, WindowInfo } from '../types';
import { Submenu, SubmenuItem } from './Submenu';
import { Tooltip } from './Tooltip';

interface TabItemProps {
  tab: TabInfo;
  windows: WindowInfo[];
  getWindowNumber: (windowId: number) => number;
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
  getWindowNumber,
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
  };

  const handleMoveToNewWindow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveToNewWindow(tab.id);
    setShowMenu(false);
  };

  const handleMoveToWindow = (targetWindowId: number) => {
    onMoveToWindow(tab.id, targetWindowId);
    setShowMenu(false);
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

  const getDomain = () => {
    try {
      return new URL(tab.url).hostname;
    } catch {
      return tab.url;
    }
  };

  const isDark = theme === 'dark';
  const otherWindows = windows.filter(w => w.id !== tab.windowId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded group cursor-pointer relative ${
        isDark
          ? `hover:bg-mist-950 ${tab.active ? 'bg-mist-900' : ''}`
          : `hover:bg-mist-50 ${tab.active ? 'bg-mist-100' : ''}`
      } ${hasFocus ? (isDark ? 'border border-dashed border-mist-500' : 'border border-dashed border-mist-950') : ''}`}
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
            ? 'border-mist-600 bg-mist-700 accent-mist-400'
            : 'border-mist-300 bg-mist-50 accent-mist-600'
        }`}
      />

      <div
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className={`cursor-grab active:cursor-grabbing p-1 ${
          isDark ? 'text-mist-500 hover:text-mist-300' : 'text-mist-400 hover:text-mist-600'
        }`}
      >
        <HolderOutlined className="text-xs" />
      </div>

      {tab.pinned && (
        <span title="Pinned">
          <PushpinFilled className="text-xs text-blue-400 flex-shrink-0" />
        </span>
      )}

      <Tooltip text={getDomain()} theme={theme}>
        <img
          src={getFaviconUrl()}
          alt=""
          className="w-4 h-4 flex-shrink-0"
          onError={e => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>';
          }}
        />
      </Tooltip>

      <Tooltip text={<>{tab.title || 'Untitled'}<br /><span className="text-mist-400">{tab.url}</span></>} theme={theme} flex1 wrap>
        <span className={`text-sm truncate block ${isDark ? 'text-mist-200' : 'text-mist-700'}`}>
          {tab.title || 'Untitled'}
        </span>
      </Tooltip>

      {/* Menu button */}
      <div className="relative" ref={menuRef}>
        <Tooltip text="More options" theme={theme} position="bottom-right">
          <button
            onClick={handleMenuClick}
            tabIndex={-1}
            className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded ${
              isDark ? 'text-mist-500 hover:text-mist-300 hover:bg-mist-600' : 'text-mist-400 hover:text-mist-600 hover:bg-mist-200'
            } ${showMenu ? 'opacity-100' : ''}`}
          >
            <MoreOutlined className="text-xs" />
          </button>
        </Tooltip>

        {/* Dropdown menu */}
        {showMenu && (
          <div className={`absolute right-0 top-full mt-1 py-1 w-48 rounded-xl shadow-lg z-20 ring-1 ${
            isDark ? 'bg-mist-900 ring-white/10' : 'bg-mist-50 ring-mist-950/10'
          }`}>
            <button
              onClick={handleMoveToNewWindow}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                isDark ? 'text-mist-200 hover:bg-mist-700' : 'text-mist-700 hover:bg-mist-100'
              }`}
            >
              <PlusOutlined className="text-base" />
              Move to New Window
            </button>

            {/* Move to window submenu */}
            {otherWindows.length > 0 && (
              <Submenu
                label="Move to Window"
                icon={<SelectOutlined className="text-base" />}
                theme={theme}
              >
                {otherWindows.map(w => (
                  <SubmenuItem
                    key={w.id}
                    onClick={() => handleMoveToWindow(w.id)}
                    theme={theme}
                  >
                    Window {getWindowNumber(w.id)} ({w.tabs.length})
                  </SubmenuItem>
                ))}
              </Submenu>
            )}

            <button
              onClick={handleTogglePin}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                isDark ? 'text-mist-200 hover:bg-mist-700' : 'text-mist-700 hover:bg-mist-100'
              }`}
            >
              <PushpinOutlined className="text-base" />
              {tab.pinned ? 'Unpin' : 'Pin'}
            </button>

            <div className={`my-1 border-t ${isDark ? 'border-white/10' : 'border-mist-950/10'}`} />

            <button
              onClick={handleCloseFromMenu}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-500 ${
                isDark ? 'hover:bg-mist-700' : 'hover:bg-mist-100'
              }`}
            >
              <CloseOutlined className="text-base" />
              Close Tab
            </button>
          </div>
        )}
      </div>

      <Tooltip text="Close tab" theme={theme} position="bottom-right">
        <button
          onClick={handleClose}
          tabIndex={-1}
          className={`p-1 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? 'text-mist-500' : 'text-mist-400'
          }`}
        >
          <CloseOutlined className="text-xs" />
        </button>
      </Tooltip>
    </div>
  );
}
