import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  AppstoreOutlined,
  SearchOutlined,
  CloseOutlined,
  ForkOutlined,
  MergeOutlined,
  SortAscendingOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { Tooltip } from './Tooltip';

export interface ToolbarHandle {
  focusSearch: () => void;
}

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFocus: () => void;
  tabCount: number;
  windowCount: number;
  selectedCount: number;
  onMerge: () => void;
  onDedupeAll: () => void;
  onSortAll: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Toolbar = forwardRef<ToolbarHandle, ToolbarProps>(function Toolbar({
  searchQuery,
  onSearchChange,
  onFocus,
  tabCount,
  windowCount,
  selectedCount,
  onMerge,
  onDedupeAll,
  onSortAll,
  theme,
  onToggleTheme,
}, ref) {
  const isDark = theme === 'dark';
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        <Tooltip
          text={selectedCount >= 2 ? `Merge ${selectedCount} windows` : 'Select 2+ windows to merge'}
          theme={theme}
          position="bottom-right"
        >
          <button
            onClick={onMerge}
            disabled={selectedCount < 2}
            tabIndex={-1}
            className={`p-2 rounded transition-colors relative ${
              selectedCount >= 2
                ? isDark
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                : isDark
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <ForkOutlined className="text-lg" />
            {selectedCount >= 2 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-green-500 text-white rounded-full flex items-center justify-center">
                {selectedCount}
              </span>
            )}
          </button>
        </Tooltip>

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
