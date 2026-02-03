import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  AppstoreOutlined,
  SearchOutlined,
  CloseOutlined,
  ForkOutlined,
  MergeOutlined,
  SortAscendingOutlined,
  SunOutlined,
  MoonOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
} from '@ant-design/icons';
import { Tooltip } from './Tooltip';
import { WindowInfo } from '../types';

export interface ToolbarHandle {
  focusSearch: () => void;
}

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFocus: () => void;
  tabCount: number;
  windowCount: number;
  windows: WindowInfo[];
  getWindowNumber: (windowId: number) => number;
  onMerge: (windowIds: number[]) => void;
  onDedupeAll: () => void;
  onSortAll: () => void;
  allCollapsed: boolean;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Toolbar = forwardRef<ToolbarHandle, ToolbarProps>(function Toolbar({
  searchQuery,
  onSearchChange,
  onFocus,
  tabCount,
  windowCount,
  windows,
  getWindowNumber,
  onMerge,
  onDedupeAll,
  onSortAll,
  allCollapsed,
  onCollapseAll,
  onExpandAll,
  theme,
  onToggleTheme,
}, ref) {
  const isDark = theme === 'dark';
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showMergePopover, setShowMergePopover] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<number>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Expose focusSearch method to parent
  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }));

  // Focus search input and select text when window gains focus or shortcut is pressed
  useEffect(() => {
    const focusAndSelectSearch = () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
      onFocus();
    };

    const handleMessage = (message: { action: string }) => {
      if (message.action === 'focus-search') {
        focusAndSelectSearch();
      }
    };

    window.addEventListener('focus', focusAndSelectSearch);
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      window.removeEventListener('focus', focusAndSelectSearch);
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [onFocus]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showMergePopover) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowMergePopover(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMergePopover]);

  const handleToggleMergePopover = () => {
    if (!showMergePopover) {
      // Reset selection when opening
      setSelectedForMerge(new Set());
    }
    setShowMergePopover(!showMergePopover);
  };

  const handleToggleWindowSelection = (windowId: number) => {
    setSelectedForMerge(prev => {
      const next = new Set(prev);
      if (next.has(windowId)) {
        next.delete(windowId);
      } else {
        next.add(windowId);
      }
      return next;
    });
  };

  const handleMergeSelected = () => {
    if (selectedForMerge.size >= 2) {
      onMerge(Array.from(selectedForMerge));
      setShowMergePopover(false);
      setSelectedForMerge(new Set());
    }
  };

  const handleCancel = () => {
    setShowMergePopover(false);
    setSelectedForMerge(new Set());
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 border-b ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Logo */}
      <div className="flex-shrink-0">
        <AppstoreOutlined className="text-2xl text-blue-500" />
      </div>

      {/* Search */}
      <div className="relative flex-shrink-0 w-64">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onFocus={onFocus}
          autoFocus
          className={`w-full px-3 py-1.5 pl-8 text-sm border rounded focus:outline-none focus:border-blue-500 ${
            isDark
              ? 'bg-gray-900 border-gray-600 text-gray-100 placeholder-gray-400'
              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
        <SearchOutlined
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            tabIndex={-1}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CloseOutlined className="text-sm" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={`text-sm px-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {windowCount} Windows | {tabCount} Tabs
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Merge Windows */}
        <div className="relative" ref={popoverRef}>
          <Tooltip
            text="Merge windows"
            theme={theme}
            position="bottom-right"
          >
            <button
              onClick={handleToggleMergePopover}
              tabIndex={-1}
              className={`p-2 rounded transition-colors ${
                showMergePopover
                  ? isDark
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-200 text-gray-900'
                  : isDark
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ForkOutlined className="text-lg" />
            </button>
          </Tooltip>

          {/* Merge Popover */}
          {showMergePopover && (
            <div className={`absolute right-0 top-full mt-2 w-72 rounded-lg shadow-lg border z-50 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Select windows to merge
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {windows.map(win => (
                  <label
                    key={win.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedForMerge.has(win.id)}
                      onChange={() => handleToggleWindowSelection(win.id)}
                      className={`w-4 h-4 rounded text-blue-500 focus:ring-blue-500 ${
                        isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                      }`}
                    />
                    <span className={`text-sm flex-1 truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      Window {getWindowNumber(win.id)}
                      {win.focused && (
                        <span className="ml-1 text-xs text-green-500">(current)</span>
                      )}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {win.tabs.length} tabs
                    </span>
                  </label>
                ))}
              </div>

              <div className={`flex justify-end gap-2 px-3 py-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={handleCancel}
                  className={`px-3 py-1.5 text-sm rounded ${
                    isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMergeSelected}
                  disabled={selectedForMerge.size < 2}
                  className={`px-3 py-1.5 text-sm rounded ${
                    selectedForMerge.size >= 2
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : isDark
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Merge Selected ({selectedForMerge.size})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

        {/* Dedupe All */}
        <Tooltip text="Remove all duplicates" theme={theme} position="bottom-right">
          <button
            onClick={onDedupeAll}
            tabIndex={-1}
            className={`p-2 rounded transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <MergeOutlined className="text-lg" rotate={90} />
          </button>
        </Tooltip>

        {/* Sort All */}
        <Tooltip text="Sort all windows by domain" theme={theme} position="bottom-right">
          <button
            onClick={onSortAll}
            tabIndex={-1}
            className={`p-2 rounded transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <SortAscendingOutlined className="text-lg" />
          </button>
        </Tooltip>

        {/* Collapse/Expand All */}
        <Tooltip text={allCollapsed ? 'Expand all cards' : 'Collapse all cards'} theme={theme} position="bottom-right">
          <button
            onClick={allCollapsed ? onExpandAll : onCollapseAll}
            tabIndex={-1}
            className={`p-2 rounded transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {allCollapsed ? (
              <ArrowsAltOutlined className="text-lg" />
            ) : (
              <ShrinkOutlined className="text-lg" />
            )}
          </button>
        </Tooltip>

        {/* Divider */}
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />

        {/* Theme Toggle */}
        <Tooltip text="Toggle theme" theme={theme} position="bottom-right">
          <button
            onClick={onToggleTheme}
            tabIndex={-1}
            className={`p-2 rounded transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {theme === 'dark' ? (
              <SunOutlined className="text-lg" />
            ) : (
              <MoonOutlined className="text-lg" />
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
});
