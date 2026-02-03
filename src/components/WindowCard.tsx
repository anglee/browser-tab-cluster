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
  CloseOutlined,
  SortAscendingOutlined,
  MergeOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { WindowInfo, SortOption } from '../types';
import { TabItem } from './TabItem';
import { Submenu, SubmenuItem } from './Submenu';
import { Tooltip } from './Tooltip';

interface WindowCardProps {
  window: WindowInfo;
  allWindows: WindowInfo[];
  displayNumber: number;
  getWindowNumber: (windowId: number) => number;
  isCardFocused: boolean;
  focusedTabIndex: number;
  searchCandidateTabIndex: number;
  isSearching: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseTab: (tabId: number) => void;
  onCloseWindow: (windowId: number) => void;
  onFocusWindow: (windowId: number) => void;
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
  displayNumber,
  getWindowNumber,
  isCardFocused,
  focusedTabIndex,
  searchCandidateTabIndex,
  isSearching,
  isCollapsed,
  onToggleCollapse,
  onCloseTab,
  onCloseWindow,
  onFocusWindow,
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
  };

  const handleBulkClose = () => {
    const tabIds = Array.from(selectedTabs);
    tabIds.forEach(tabId => {
      onCloseTab(tabId);
    });
    setSelectedTabs(new Set());
    setShowActionsMenu(false);
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
      className={`rounded-xl outline-none ${
        isDark ? 'bg-white/5' : 'bg-mist-950/[0.025]'
      } ${
        isOver
          ? isDark ? 'ring-2 ring-mist-600' : 'ring-2 ring-mist-400'
          : isCardFocused
            ? isDark ? 'ring-2 ring-mist-600' : 'ring-2 ring-mist-400'
            : isDark ? 'border border-white/10' : 'border border-mist-950/10'
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-1.5 cursor-pointer border-b rounded-t-xl ${
          isDark ? 'bg-mist-900 border-white/10' : 'bg-mist-200 border-mist-950/10'
        }`}
        onClick={() => onFocusWindow(window.id)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${isDark ? 'text-mist-200' : 'text-mist-700'}`}
          >
            Window {displayNumber}
            {window.focused && (
              <span className={`ml-2 text-xs ${isDark ? 'text-white/60' : 'text-mist-950/60'}`}>(current)</span>
            )}
          </span>
          <span className={`text-xs ${isDark ? 'text-mist-400' : 'text-mist-500'}`}>
            ({window.tabs.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Bulk Actions Button - only visible when 2+ tabs selected */}
          {selectedTabCount >= 2 && (
            <div className="relative">
              <Tooltip text={`Actions for ${selectedTabCount} tabs`} theme={theme} position="bottom-right">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowActionsMenu(!showActionsMenu); }}
                  tabIndex={-1}
                  className={`p-1.5 rounded flex items-center gap-1 ${
                    isDark ? 'text-blue-400 hover:text-blue-300 hover:bg-mist-700' : 'text-blue-600 hover:text-blue-700 hover:bg-mist-200'
                  }`}
                >
                  <FileTextOutlined className="text-base" />
                  <span className="text-xs font-medium">{selectedTabCount}</span>
                </button>
              </Tooltip>
              {showActionsMenu && (
                <div className={`absolute right-0 top-full mt-1 py-1 w-48 rounded-xl shadow-lg z-20 ring-1 ${
                  isDark ? 'bg-mist-900 ring-white/10' : 'bg-mist-50 ring-mist-950/10'
                }`}>
                  <button
                    onClick={handleBulkMoveToNewWindow}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDark ? 'text-mist-200 hover:bg-mist-700' : 'text-mist-700 hover:bg-mist-100'
                    }`}
                  >
                    <PlusOutlined className="text-base" />
                    Move to New Window
                  </button>

                  {otherWindows.length > 0 && (
                    <Submenu
                      label="Move to Window"
                      icon={<SelectOutlined className="text-base" />}
                      theme={theme}
                    >
                      {otherWindows.map(w => (
                        <SubmenuItem
                          key={w.id}
                          onClick={() => handleBulkMoveToWindow(w.id)}
                          theme={theme}
                        >
                          Window {getWindowNumber(w.id)} ({w.tabs.length})
                        </SubmenuItem>
                      ))}
                    </Submenu>
                  )}

                  <div className={`my-1 border-t ${isDark ? 'border-white/10' : 'border-mist-950/10'}`} />

                  <button
                    onClick={handleBulkClose}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-500 ${
                      isDark ? 'hover:bg-mist-700' : 'hover:bg-mist-100'
                    }`}
                  >
                    <CloseOutlined className="text-base" />
                    Close All Tabs
                  </button>
                </div>
              )}
            </div>
          )}

          {!isSearching && (
            <>
              <div className="relative">
                <Tooltip text="Sort tabs" theme={theme} position="bottom-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }}
                    tabIndex={-1}
                    className={`p-1.5 rounded ${
                      isDark ? 'text-mist-400 hover:text-mist-200 hover:bg-mist-700' : 'text-mist-500 hover:text-mist-700 hover:bg-mist-200'
                    }`}
                  >
                    <SortAscendingOutlined className="text-base" />
                  </button>
                </Tooltip>
                {showSortMenu && (
                  <div className={`absolute right-0 top-full mt-1 py-1 w-36 rounded-xl shadow-lg z-10 ring-1 ${
                    isDark ? 'bg-mist-900 ring-white/10' : 'bg-mist-50 ring-mist-950/10'
                  }`}>
                    <button
                      onClick={() => handleSort('domain')}
                      tabIndex={-1}
                      className={`w-full px-3 py-1.5 text-left text-sm ${
                        isDark ? 'text-mist-200 hover:bg-mist-600' : 'text-mist-700 hover:bg-mist-100'
                      }`}
                    >
                      By Domain
                    </button>
                    <button
                      onClick={() => handleSort('title')}
                      tabIndex={-1}
                      className={`w-full px-3 py-1.5 text-left text-sm ${
                        isDark ? 'text-mist-200 hover:bg-mist-600' : 'text-mist-700 hover:bg-mist-100'
                      }`}
                    >
                      By Title
                    </button>
                  </div>
                )}
              </div>

              <Tooltip text="Remove duplicates" theme={theme} position="bottom-right">
                <button
                  onClick={(e) => { e.stopPropagation(); onDedupe(window.id); }}
                  tabIndex={-1}
                  className={`p-1.5 rounded ${
                    isDark ? 'text-mist-400 hover:text-mist-200 hover:bg-mist-700' : 'text-mist-500 hover:text-mist-700 hover:bg-mist-200'
                  }`}
                >
                  <MergeOutlined className="text-base" rotate={90} />
                </button>
              </Tooltip>

              <Tooltip text="Close window" theme={theme} position="bottom-right">
                <button
                  onClick={(e) => { e.stopPropagation(); onCloseWindow(window.id); }}
                  tabIndex={-1}
                  className={`p-1.5 rounded hover:text-red-400 ${
                    isDark ? 'text-mist-400 hover:bg-mist-700' : 'text-mist-500 hover:bg-mist-200'
                  }`}
                >
                  <CloseOutlined className="text-base" />
                </button>
              </Tooltip>
            </>
          )}

          {/* Collapse Toggle */}
          <Tooltip text={isCollapsed ? 'Expand' : 'Collapse'} theme={theme} position="bottom-right">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
              tabIndex={-1}
              className={`p-1.5 rounded ${
                isDark ? 'text-mist-400 hover:text-mist-200 hover:bg-mist-700' : 'text-mist-500 hover:text-mist-700 hover:bg-mist-200'
              }`}
            >
              <span className={`inline-block transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}>
                <RightOutlined className="text-base" />
              </span>
            </button>
          </Tooltip>
        </div>
      </div>

      {!isCollapsed && (
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
              getWindowNumber={getWindowNumber}
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
      )}
    </div>
  );
}
