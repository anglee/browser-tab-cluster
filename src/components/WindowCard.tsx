import { useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { WindowInfo, SortOption } from '../types';
import { TabItem } from './TabItem';

interface WindowCardProps {
  window: WindowInfo;
  allWindows: WindowInfo[];
  isSelected: boolean;
  onSelect: (windowId: number, selected: boolean) => void;
  onCloseTab: (tabId: number) => void;
  onCloseWindow: (windowId: number) => void;
  onActivateTab: (tabId: number, windowId: number) => void;
  onFocusWindow: (windowId: number) => void;
  onMoveToWindow: (tabId: number, targetWindowId: number) => void;
  onMoveToNewWindow: (tabId: number) => void;
  onSort: (windowId: number, option: SortOption) => void;
  onDedupe: (windowId: number) => void;
  theme: 'light' | 'dark';
}

export function WindowCard({
  window,
  allWindows,
  isSelected,
  onSelect,
  onCloseTab,
  onCloseWindow,
  onActivateTab,
  onFocusWindow,
  onMoveToWindow,
  onMoveToNewWindow,
  onSort,
  onDedupe,
  theme,
}: WindowCardProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [focusedTabIndex, setFocusedTabIndex] = useState<number>(-1);

  const { setNodeRef, isOver } = useDroppable({
    id: `window-${window.id}`,
    data: { windowId: window.id },
  });

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedTabIndex >= 0) {
        // Activate the focused tab
        const tab = window.tabs[focusedTabIndex];
        if (tab) {
          onActivateTab(tab.id, window.id);
        }
      } else {
        // Focus the window in Chrome
        onFocusWindow(window.id);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (window.tabs.length > 0) {
        const newIndex = focusedTabIndex === -1 ? 0 : Math.min(focusedTabIndex + 1, window.tabs.length - 1);
        setFocusedTabIndex(newIndex);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (focusedTabIndex > 0) {
        setFocusedTabIndex(focusedTabIndex - 1);
      } else if (focusedTabIndex === 0) {
        // Move back to card level (no tab highlighted)
        setFocusedTabIndex(-1);
      }
    }
  };

  const handleCardBlur = (e: React.FocusEvent) => {
    // Only reset if focus moved outside the card
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setFocusedTabIndex(-1);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(window.id, e.target.checked);
  };

  const handleSort = (option: SortOption) => {
    onSort(window.id, option);
    setShowSortMenu(false);
  };

  const isDark = theme === 'dark';

  return (
    <div
      ref={setNodeRef}
      tabIndex={0}
      onKeyDown={handleCardKeyDown}
      onBlur={handleCardBlur}
      className={`rounded-lg border outline-none break-inside-avoid mb-4 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } ${
        isOver ? 'border-blue-500 ring-2 ring-blue-500/50' : isDark ? 'border-gray-700' : 'border-gray-300'
      } ${isSelected ? 'ring-2 ring-green-500/50' : ''} focus:ring-2 focus:ring-blue-500`}
    >
      <div className={`flex items-center justify-between px-3 py-2 border-b ${
        isDark ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            tabIndex={-1}
            className={`w-4 h-4 rounded text-green-500 focus:ring-green-500 ${
              isDark ? 'border-gray-600 bg-gray-700 focus:ring-offset-gray-800' : 'border-gray-300 bg-white focus:ring-offset-white'
            }`}
          />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Window {window.id}
            {window.focused && (
              <span className="ml-2 text-xs text-green-500">(current)</span>
            )}
          </span>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            ({window.tabs.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              tabIndex={-1}
              className={`p-1.5 rounded ${
                isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
              title="Sort tabs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
            {showSortMenu && (
              <div className={`absolute right-0 top-full mt-1 py-1 w-36 rounded-lg shadow-lg z-10 border ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                <button
                  onClick={() => handleSort('domain')}
                  tabIndex={-1}
                  className={`w-full px-3 py-1.5 text-left text-sm ${
                    isDark ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  By Domain
                </button>
                <button
                  onClick={() => handleSort('title')}
                  tabIndex={-1}
                  className={`w-full px-3 py-1.5 text-left text-sm ${
                    isDark ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  By Title
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onDedupe(window.id)}
            tabIndex={-1}
            className={`p-1.5 rounded ${
              isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
            title="Remove duplicates"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={() => onCloseWindow(window.id)}
            tabIndex={-1}
            className={`p-1.5 rounded hover:text-red-400 ${
              isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
            }`}
            title="Close window"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-2">
        <SortableContext
          items={window.tabs.map(t => `tab-${t.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {window.tabs.map((tab, index) => (
            <TabItem
              key={tab.id}
              tab={tab}
              windows={allWindows}
              isFocused={focusedTabIndex === index}
              onClose={onCloseTab}
              onActivate={onActivateTab}
              onMoveToWindow={onMoveToWindow}
              onMoveToNewWindow={onMoveToNewWindow}
              theme={theme}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
