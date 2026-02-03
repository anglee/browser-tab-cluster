import { useState, useRef, useEffect } from 'react';
import {
  MoreOutlined,
  PlusOutlined,
  ImportOutlined,
  HistoryOutlined,
  SelectOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { ClosedTabInfo, WindowInfo } from '../types';
import { Submenu, SubmenuItem } from './Submenu';
import { Tooltip } from './Tooltip';

interface ClosedTabItemProps {
  tab: ClosedTabInfo;
  windows: WindowInfo[];
  getWindowNumber: (windowId: number) => number;
  hasFocus?: boolean;
  isChecked?: boolean;
  onToggleCheck?: (sessionId: string, checked: boolean) => void;
  onRestore: (sessionId: string) => void;
  onRestoreInNewWindow: (sessionId: string) => void;
  onRestoreInCurrentWindow: (sessionId: string) => void;
  onRestoreToWindow: (sessionId: string, windowId: number) => void;
  onDelete: (sessionId: string) => void;
  theme: 'light' | 'dark';
}

function formatTimeAgo(closedTime: number): string {
  const now = Date.now();
  const diff = now - closedTime;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function ClosedTabItem({
  tab,
  windows,
  getWindowNumber,
  hasFocus = false,
  isChecked = false,
  onToggleCheck,
  onRestore,
  onRestoreInNewWindow,
  onRestoreInCurrentWindow,
  onRestoreToWindow,
  onDelete,
  theme,
}: ClosedTabItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleClick = () => {
    onRestore(tab.sessionId);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestore(tab.sessionId);
    setShowMenu(false);
  };

  const handleRestoreInNewWindow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestoreInNewWindow(tab.sessionId);
    setShowMenu(false);
  };

  const handleRestoreInCurrentWindow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestoreInCurrentWindow(tab.sessionId);
    setShowMenu(false);
  };

  const handleRestoreToWindow = (windowId: number) => {
    onRestoreToWindow(tab.sessionId, windowId);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(tab.sessionId);
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

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded group cursor-pointer relative ${
        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
      } ${hasFocus ? 'border border-dashed border-blue-500' : ''}`}
      onClick={handleClick}
    >
      {/* Checkbox for multi-select */}
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => {
          e.stopPropagation();
          onToggleCheck?.(tab.sessionId, e.target.checked);
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

      <Tooltip text={getDomain()} theme={theme}>
        <img
          src={getFaviconUrl()}
          alt=""
          className="w-4 h-4 flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>';
          }}
        />
      </Tooltip>

      <Tooltip text={<>{tab.title || 'Untitled'}<br /><span className="text-gray-400">{tab.url}</span></>} theme={theme} flex1 wrap>
        <span className={`text-sm truncate block ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {tab.title || 'Untitled'}
        </span>
      </Tooltip>

      <span className={`text-xs flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {formatTimeAgo(tab.closedTime)}
      </span>

      {/* Menu button */}
      <div className="relative" ref={menuRef}>
        <Tooltip text="More options" theme={theme} position="bottom-right">
          <button
            onClick={handleMenuClick}
            tabIndex={-1}
            className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded ${
              isDark
                ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
            } ${showMenu ? 'opacity-100' : ''}`}
          >
            <MoreOutlined className="text-xs" />
          </button>
        </Tooltip>

        {/* Dropdown menu */}
        {showMenu && (
          <div
            className={`absolute right-0 top-full mt-1 py-1 w-56 rounded-lg shadow-lg z-20 border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <button
              onClick={handleRestore}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <HistoryOutlined className="text-base" />
              Restore to Original Location
            </button>

            <button
              onClick={handleRestoreInNewWindow}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <PlusOutlined className="text-base" />
              Restore in New Window
            </button>

            <button
              onClick={handleRestoreInCurrentWindow}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ImportOutlined className="text-base" />
              Restore in Current Window
            </button>

            {/* Restore to Window submenu */}
            {windows.length > 0 && (
              <Submenu
                label="Restore to Window"
                icon={<SelectOutlined className="text-base" />}
                theme={theme}
              >
                {windows.map((w) => (
                  <SubmenuItem
                    key={w.id}
                    onClick={() => handleRestoreToWindow(w.id)}
                    theme={theme}
                  >
                    Window {getWindowNumber(w.id)} ({w.tabs.length})
                    {w.focused && <span className="text-green-500 ml-1">(current)</span>}
                  </SubmenuItem>
                ))}
              </Submenu>
            )}

            <div className={`my-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

            <button
              onClick={handleDelete}
              tabIndex={-1}
              className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-500 ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <DeleteOutlined className="text-base" />
              Hide
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
