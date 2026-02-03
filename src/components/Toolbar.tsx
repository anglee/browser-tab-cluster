import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  SearchOutlined,
  CloseOutlined,
  ForkOutlined,
  MergeOutlined,
  SortAscendingOutlined,
  SunOutlined,
  MoonOutlined,
  VerticalAlignMiddleOutlined,
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
      isDark ? 'bg-mist-900 border-mist-700' : 'bg-mist-50 border-mist-200'
    }`}>
      {/* Logo */}
      <div className="flex-shrink-0">
        <svg
          viewBox="0 0 32 32"
          className="w-7 h-7"
        >
          <clipPath id="rounded-clip">
            <rect x="0" y="0" width="32" height="32" rx="2" ry="2"/>
          </clipPath>
          <rect x="0" y="0" width="32" height="32" rx="2" ry="2" fill="#a5af9a"/>
          <path d="M0,32 L0,2 Q0,0 2,0 L18,0 L32,32 Z" fill="#647c87" clipPath="url(#rounded-clip)"/>
        </svg>
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
          className={`w-full px-3 py-1.5 pl-8 text-sm rounded focus:outline-none focus:ring-2 ${
            isDark
              ? 'bg-mist-950 ring-1 ring-mist-700 text-mist-100 placeholder-mist-400 focus:ring-mist-600'
              : 'bg-mist-50 ring-1 ring-mist-200 text-mist-950 placeholder-mist-500 focus:ring-mist-400'
          }`}
        />
        <SearchOutlined
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-mist-400' : 'text-mist-500'}`}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            tabIndex={-1}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-mist-400 hover:text-mist-200' : 'text-mist-500 hover:text-mist-700'
            }`}
          >
            <CloseOutlined className="text-sm" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={`text-sm px-2 ${isDark ? 'text-mist-400' : 'text-mist-500'}`}>
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
                    ? 'bg-mist-700 text-white'
                    : 'bg-mist-200 text-mist-950'
                  : isDark
                    ? 'text-mist-300 hover:bg-mist-700 hover:text-white'
                    : 'text-mist-600 hover:bg-mist-100 hover:text-mist-950'
              }`}
            >
              <ForkOutlined className="text-lg" />
            </button>
          </Tooltip>

          {/* Merge Popover */}
          {showMergePopover && (
            <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl shadow-lg ring-1 z-50 ${
              isDark ? 'bg-mist-900 ring-white/10' : 'bg-mist-50 ring-mist-950/10'
            }`}>
              <div className={`px-3 py-2 border-b ${isDark ? 'border-white/10' : 'border-mist-950/10'}`}>
                <span className={`text-sm font-medium ${isDark ? 'text-mist-200' : 'text-mist-700'}`}>
                  Select windows to merge
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {windows.map(win => (
                  <label
                    key={win.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                      isDark ? 'hover:bg-mist-700' : 'hover:bg-mist-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedForMerge.has(win.id)}
                      onChange={() => handleToggleWindowSelection(win.id)}
                      className={`w-4 h-4 rounded text-blue-500 focus:ring-blue-500 ${
                        isDark ? 'border-mist-600 bg-mist-700' : 'border-mist-300 bg-mist-50'
                      }`}
                    />
                    <span className={`text-sm flex-1 truncate ${isDark ? 'text-mist-200' : 'text-mist-700'}`}>
                      Window {getWindowNumber(win.id)}
                      {win.focused && (
                        <span className={`ml-1 text-xs ${isDark ? 'text-white/60' : 'text-mist-950/60'}`}>(current)</span>
                      )}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-mist-400' : 'text-mist-500'}`}>
                      {win.tabs.length} tabs
                    </span>
                  </label>
                ))}
              </div>

              <div className={`flex justify-end gap-2 px-3 py-2 border-t ${isDark ? 'border-white/10' : 'border-mist-950/10'}`}>
                <button
                  onClick={handleCancel}
                  className={`px-3 py-1.5 text-sm rounded ${
                    isDark
                      ? 'text-mist-300 hover:bg-mist-700'
                      : 'text-mist-600 hover:bg-mist-100'
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
                        ? 'bg-mist-700 text-mist-500 cursor-not-allowed'
                        : 'bg-mist-200 text-mist-400 cursor-not-allowed'
                  }`}
                >
                  Merge Selected ({selectedForMerge.size})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-mist-600' : 'bg-mist-300'}`} />

        {/* Dedupe All */}
        <Tooltip text="Remove all duplicates" theme={theme} position="bottom-right">
          <button
            onClick={onDedupeAll}
            tabIndex={-1}
            className={`p-2 rounded transition-colors ${
              isDark
                ? 'text-mist-300 hover:bg-mist-700 hover:text-white'
                : 'text-mist-600 hover:bg-mist-100 hover:text-mist-950'
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
                ? 'text-mist-300 hover:bg-mist-700 hover:text-white'
                : 'text-mist-600 hover:bg-mist-100 hover:text-mist-950'
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
                ? 'text-mist-300 hover:bg-mist-700 hover:text-white'
                : 'text-mist-600 hover:bg-mist-100 hover:text-mist-950'
            }`}
          >
            {allCollapsed ? (
              <ArrowsAltOutlined className="text-base -rotate-45" />
            ) : (
              <VerticalAlignMiddleOutlined className="text-lg" />
            )}
          </button>
        </Tooltip>

        {/* Divider */}
        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-mist-600' : 'bg-mist-300'}`} />

        {/* Theme Toggle */}
        <Tooltip text="Toggle theme" theme={theme} position="bottom-right">
          <button
            onClick={onToggleTheme}
            tabIndex={-1}
            className={`p-2 rounded transition-colors ${
              isDark
                ? 'text-mist-300 hover:bg-mist-700 hover:text-white'
                : 'text-mist-600 hover:bg-mist-100 hover:text-mist-950'
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
