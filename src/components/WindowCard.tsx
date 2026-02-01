import { useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import {
  FileTextOutlined,
  PlusOutlined,
  SelectOutlined,
  RightOutlined,
  CloseOutlined,
  SortAscendingOutlined,
  MergeOutlined,
} from '@ant-design/icons';
import { WindowInfo, SortOption } from '../types';
import { TabItem } from './TabItem';

interface WindowCardProps {
  window: WindowInfo;
  allWindows: WindowInfo[];
  isSelected: boolean;
  isCardFocused: boolean;
  focusedTabIndex: number;
  searchCandidateTabIndex: number;
  onSelect: (windowId: number, selected: boolean) => void;
  onCloseTab: (tabId: number) => void;
  onCloseWindow: (windowId: number) => void;
  onActivateTab: (tabId: number, windowId: number) => void;
  onMoveToWindow: (tabId: number, targetWindowId: number) => void;
  onMoveToNewWindow: (tabId: number) => void;
  onTogglePin: (tabId: number, pinned: boolean) => void;
  onSort: (windowId: number, option: SortOption) => void;
  onDedupe: (windowId: number) => void;
  theme: 'light' | 'dark';
}

export function WindowCard({
  window,
  allWindows,
  isSelected,
  isCardFocused,
  focusedTabIndex,
  searchCandidateTabIndex,
  onSelect,
  onCloseTab,
  onCloseWindow,
  onActivateTab,
  onMoveToWindow,
  onMoveToNewWindow,
  onTogglePin,
  onSort,
  onDedupe,
  theme,
}: WindowCardProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<Set<number>>(new Set());
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showBulkWindowSubmenu, setShowBulkWindowSubmenu] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `window-${window.id}`,
    data: { windowId: window.id },
  });

  const handleTabCheck = (tabId: number, checked: boolean) => {
    setSelectedTabs(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(tabId);
      } else {
        next.delete(tabId);
      }
      return next;
    });
  };

  const handleBulkMoveToNewWindow = () => {
    const tabIds = Array.from(selectedTabs);
    // Move all selected tabs to a new window
    if (tabIds.length > 0) {
      // Create new window with first tab, then move the rest
      chrome.windows.create({ tabId: tabIds[0] }, (newWindow) => {
        if (newWindow && tabIds.length > 1) {
          tabIds.slice(1).forEach(tabId => {
            chrome.tabs.move(tabId, { windowId: newWindow.id!, index: -1 });
          });
        }
      });
    }
    setSelectedTabs(new Set());
    setShowActionsMenu(false);
  };

  const handleBulkMoveToWindow = (targetWindowId: number) => {
    const tabIds = Array.from(selectedTabs);
    tabIds.forEach(tabId => {
      onMoveToWindow(tabId, targetWindowId);
    });
    setSelectedTabs(new Set());
    setShowActionsMenu(false);
    setShowBulkWindowSubmenu(false);
  };

  const handleBulkClose = () => {
    const tabIds = Array.from(selectedTabs);
    tabIds.forEach(tabId => {
      onCloseTab(tabId);
    });
    setSelectedTabs(new Set());
    setShowActionsMenu(false);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(window.id, e.target.checked);
  };

  const handleSort = (option: SortOption) => {
    onSort(window.id, option);
    setShowSortMenu(false);
  };

  const isDark = theme === 'dark';
  const otherWindows = allWindows.filter(w => w.id !== window.id);
  const selectedTabCount = selectedTabs.size;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border outline-none break-inside-avoid mb-4 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } ${
        isOver ? 'border-blue-500 ring-2 ring-blue-500/50' : isDark ? 'border-gray-700' : 'border-gray-300'
      } ${isSelected ? 'ring-2 ring-green-500/50' : ''} ${isCardFocused ? 'ring-2 ring-blue-500' : ''}`}
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
          {/* Bulk Actions Button - only visible when 2+ tabs selected */}
          {selectedTabCount >= 2 && (
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                tabIndex={-1}
                className={`p-1.5 rounded flex items-center gap-1 ${
                  isDark ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' : 'text-blue-600 hover:text-blue-700 hover:bg-gray-200'
                }`}
                title={`Actions for ${selectedTabCount} tabs`}
              >
                <FileTextOutlined className="text-base" />
                <span className="text-xs font-medium">{selectedTabCount}</span>
              </button>
              {showActionsMenu && (
                <div className={`absolute right-0 top-full mt-1 py-1 w-48 rounded-lg shadow-lg z-20 border ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <button
                    onClick={handleBulkMoveToNewWindow}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <PlusOutlined className="text-base" />
                    Move to New Window
                  </button>

                  {otherWindows.length > 0 && (
                    <div
                      className="relative"
                      onMouseEnter={() => setShowBulkWindowSubmenu(true)}
                      onMouseLeave={() => setShowBulkWindowSubmenu(false)}
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

                      {showBulkWindowSubmenu && (
                        <div className={`absolute left-full top-0 ml-1 py-1 w-40 rounded-lg shadow-lg z-30 border ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                          {otherWindows.map(w => (
                            <button
                              key={w.id}
                              onClick={() => handleBulkMoveToWindow(w.id)}
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
                    onClick={handleBulkClose}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-500 ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <CloseOutlined className="text-base" />
                    Close All Tabs
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              tabIndex={-1}
              className={`p-1.5 rounded ${
                isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
              title="Sort tabs"
            >
              <SortAscendingOutlined className="text-base" />
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
            <MergeOutlined className="text-base" rotate={90} />
          </button>

          <button
            onClick={() => onCloseWindow(window.id)}
            tabIndex={-1}
            className={`p-1.5 rounded hover:text-red-400 ${
              isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
            }`}
            title="Close window"
          >
            <CloseOutlined className="text-base" />
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
              hasFocus={focusedTabIndex === index || searchCandidateTabIndex === index}
              isChecked={selectedTabs.has(tab.id)}
              onToggleCheck={handleTabCheck}
              onClose={onCloseTab}
              onActivate={onActivateTab}
              onMoveToWindow={onMoveToWindow}
              onMoveToNewWindow={onMoveToNewWindow}
              onTogglePin={onTogglePin}
              theme={theme}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
