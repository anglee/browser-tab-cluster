import { useState } from 'react';
import { Checkbox } from './Checkbox';
import {
  HistoryOutlined,
  ReloadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  PlusOutlined,
  ImportOutlined,
  UndoOutlined,
  SelectOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { ClosedTabInfo, WindowInfo } from '../types';
import { ClosedTabItem } from './ClosedTabItem';

interface RecentlyClosedCardProps {
  closedTabs: ClosedTabInfo[];
  windows: WindowInfo[];
  getWindowNumber: (windowId: number) => number;
  isCardFocused: boolean;
  focusedTabIndex: number;
  searchCandidateTabIndex: number;
  isSearching: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  // Single item handlers (switch to restored tab)
  onRestore: (sessionId: string) => void;
  onRestoreInNewWindow: (sessionId: string) => void;
  onRestoreInCurrentWindow: (sessionId: string) => void;
  onRestoreToWindow: (sessionId: string, windowId: number) => void;
  onDelete: (sessionId: string) => void;
  // Bulk handlers (controlled switching)
  onBulkRestore: (sessionIds: string[]) => void;
  onBulkRestoreInNewWindow: (sessionIds: string[]) => void;
  onBulkRestoreInCurrentWindow: (sessionIds: string[]) => void;
  onBulkRestoreToWindow: (sessionIds: string[], windowId: number) => void;
  onRestoreAll: () => void;
  onClearAll: () => void;
  theme: 'light' | 'dark';
}

export function RecentlyClosedCard({
  closedTabs,
  windows,
  getWindowNumber,
  isCardFocused,
  focusedTabIndex,
  searchCandidateTabIndex,
  isSearching,
  isCollapsed,
  onToggleCollapse,
  onRestore,
  onRestoreInNewWindow,
  onRestoreInCurrentWindow,
  onRestoreToWindow,
  onDelete,
  onBulkRestore,
  onBulkRestoreInNewWindow,
  onBulkRestoreInCurrentWindow,
  onBulkRestoreToWindow,
  onRestoreAll,
  onClearAll,
  theme,
}: RecentlyClosedCardProps) {
  const [selectedTabs, setSelectedTabs] = useState<Set<string>>(new Set());
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [showRestoreAllConfirm, setShowRestoreAllConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const handleTabCheck = (sessionId: string, checked: boolean) => {
    setSelectedTabs((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(sessionId);
      } else {
        next.delete(sessionId);
      }
      return next;
    });
  };

  const handleBulkRestore = () => {
    const sessionIds = Array.from(selectedTabs);
    onBulkRestore(sessionIds);
    setSelectedTabs(new Set());
  };

  const handleBulkRestoreInNewWindow = () => {
    const sessionIds = Array.from(selectedTabs);
    onBulkRestoreInNewWindow(sessionIds);
    setSelectedTabs(new Set());
  };

  const handleBulkRestoreInCurrentWindow = () => {
    const sessionIds = Array.from(selectedTabs);
    onBulkRestoreInCurrentWindow(sessionIds);
    setSelectedTabs(new Set());
  };

  const handleBulkRestoreToWindow = (windowId: number) => {
    const sessionIds = Array.from(selectedTabs);
    onBulkRestoreToWindow(sessionIds, windowId);
    setSelectedTabs(new Set());
  };

  const handleBulkDelete = () => {
    const sessionIds = Array.from(selectedTabs);
    sessionIds.forEach((sessionId) => {
      onDelete(sessionId);
    });
    setSelectedTabs(new Set());
  };

  const handleRestoreAllClick = () => {
    setShowRestoreAllConfirm(true);
  };

  const handleRestoreAllConfirm = () => {
    onRestoreAll();
    setShowRestoreAllConfirm(false);
  };

  const handleClearAllClick = () => {
    setShowClearAllConfirm(true);
  };

  const handleClearAllConfirm = () => {
    onClearAll();
    setShowClearAllConfirm(false);
  };

  const isDark = theme === 'dark';
  const selectedTabCount = selectedTabs.size;

  const allSelected = selectedTabCount === closedTabs.length && closedTabs.length > 0;
  const someSelected = selectedTabCount > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedTabs(new Set());
    } else {
      setSelectedTabs(new Set(closedTabs.map(t => t.sessionId)));
    }
  };

  if (closedTabs.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-xl outline-none overflow-visible ${
        isDark ? 'bg-white/5' : 'bg-mist-950/[0.025]'
      } ${
        isCardFocused
          ? isDark ? 'ring-2 ring-mist-600' : 'ring-2 ring-mist-400'
          : isDark ? 'border border-white/10' : 'border border-mist-950/10'
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-1.5 cursor-pointer border-b rounded-t-xl ${
          isDark ? 'bg-mist-900 border-white/10' : 'bg-mist-200 border-mist-950/10'
        }`}
        onMouseDown={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <HistoryOutlined
            className={`text-base ${isDark ? 'text-mist-400' : 'text-mist-500'}`}
          />
          <span className={`text-sm font-medium ${isDark ? 'text-mist-300' : 'text-mist-700'}`}>
            Recently Closed
          </span>
          <span
            className={`text-xs flex items-center gap-1 cursor-pointer ${isDark ? 'text-mist-400' : 'text-mist-500'}`}
            onMouseDown={(e) => { e.stopPropagation(); handleSelectAll(); }}
          >
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAll}
              className="translate-y-px"
              theme={theme}
            />{closedTabs.length} tabs
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Bulk Actions Button - only visible when 2+ tabs selected */}
          {selectedTabCount >= 1 && (
            <Dropdown
              onOpenChange={(open) => setActionsMenuOpen(open)}
              menu={{ items: (() => {
                const items: MenuProps['items'] = [
                  { key: 'restore', icon: <UndoOutlined />, label: 'Restore to Original Location',
                    onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleBulkRestore(); } },
                  { key: 'new-window', icon: <PlusOutlined />, label: 'Restore in New Window',
                    onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleBulkRestoreInNewWindow(); } },
                  { key: 'current-window', icon: <ImportOutlined />, label: 'Restore in Current Window',
                    onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleBulkRestoreInCurrentWindow(); } },
                ];
                if (windows.length > 0) {
                  items.push({
                    key: 'restore-to-window', icon: <SelectOutlined />, label: 'Restore to Window',
                    children: windows.map((w) => ({
                      key: `window-${w.id}`,
                      label: <span className="flex items-center justify-between gap-4 w-full">
                          <span>Window {getWindowNumber(w.id)}{w.focused && <span className={`ml-1 ${isDark ? 'text-white/60' : 'text-mist-950/60'}`}>(current)</span>}</span>
                          <span className="text-xs text-gray-400">{w.tabs.length} tabs</span>
                        </span>,
                      onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => { domEvent.stopPropagation(); handleBulkRestoreToWindow(w.id); },
                    })) as MenuProps['items'],
                  });
                }
                items.push(
                  { type: 'divider' },
                  { key: 'hide', icon: <DeleteOutlined />, label: `Hide ${selectedTabCount} Selected`, danger: true,
                    onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleBulkDelete(); } },
                );
                return items;
              })() }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Tooltip title={`Actions for ${selectedTabCount} tabs`} placement="top" mouseEnterDelay={0.3} open={actionsMenuOpen ? false : undefined}>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  tabIndex={-1}
                  className={`p-1.5 rounded flex items-center gap-1 ${
                    isDark
                      ? 'text-blue-400 hover:text-blue-300 hover:bg-mist-700'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-mist-200'
                  }`}
                >
                  <FileTextOutlined className="text-base" />
                  <span className="text-xs font-medium">{selectedTabCount}</span>
                </button>
              </Tooltip>
            </Dropdown>
          )}

          {!isSearching && (
            <>
              <div className="relative">
                <Tooltip title="Restore all" placement="top" mouseEnterDelay={0.3}>
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); handleRestoreAllClick(); }}
                    tabIndex={-1}
                    className={`p-1.5 rounded ${
                      isDark
                        ? 'text-mist-400 hover:text-mist-200 hover:bg-mist-700'
                        : 'text-mist-500 hover:text-mist-700 hover:bg-mist-200'
                    }`}
                  >
                    <ReloadOutlined className="text-base" />
                  </button>
                </Tooltip>
                {showRestoreAllConfirm && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`absolute right-0 top-full mt-1 p-3 w-56 rounded-xl shadow-lg z-20 ring-1 ${
                      isDark ? 'bg-mist-900 ring-white/10' : 'bg-mist-50 ring-mist-950/10'
                    }`}
                  >
                    <p className={`text-sm mb-3 ${isDark ? 'text-mist-200' : 'text-mist-700'}`}>
                      Restore all {closedTabs.length} tabs in a new window?
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowRestoreAllConfirm(false)}
                        tabIndex={-1}
                        className={`px-3 py-1 text-sm rounded ${
                          isDark
                            ? 'text-mist-300 hover:bg-mist-700'
                            : 'text-mist-600 hover:bg-mist-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRestoreAllConfirm}
                        tabIndex={-1}
                        className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <Tooltip title="Clear all" placement="top" mouseEnterDelay={0.3}>
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); handleClearAllClick(); }}
                    tabIndex={-1}
                    className={`p-1.5 rounded hover:text-red-400 ${
                      isDark ? 'text-mist-400 hover:bg-mist-700' : 'text-mist-500 hover:bg-mist-200'
                    }`}
                  >
                    <DeleteOutlined className="text-base" />
                  </button>
                </Tooltip>
                {showClearAllConfirm && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`absolute right-0 top-full mt-1 p-3 w-56 rounded-xl shadow-lg z-20 ring-1 ${
                      isDark ? 'bg-mist-900 ring-white/10' : 'bg-mist-50 ring-mist-950/10'
                    }`}
                  >
                    <p className={`text-sm mb-3 ${isDark ? 'text-mist-200' : 'text-mist-700'}`}>
                      Clear all recently closed tabs? This cannot be undone.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowClearAllConfirm(false)}
                        tabIndex={-1}
                        className={`px-3 py-1 text-sm rounded ${
                          isDark
                            ? 'text-mist-300 hover:bg-mist-700'
                            : 'text-mist-600 hover:bg-mist-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClearAllConfirm}
                        tabIndex={-1}
                        className="px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Collapse Toggle */}
          <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'} placement="top" mouseEnterDelay={0.3}>
            <button
              onMouseDown={(e) => { e.stopPropagation(); onToggleCollapse(); }}
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
          {closedTabs.map((tab, index) => (
            <ClosedTabItem
            key={tab.sessionId}
            tab={tab}
            windows={windows}
            getWindowNumber={getWindowNumber}
            hasFocus={focusedTabIndex === index || searchCandidateTabIndex === index}
            isChecked={selectedTabs.has(tab.sessionId)}
            onToggleCheck={handleTabCheck}
            onRestore={onRestore}
            onRestoreInNewWindow={onRestoreInNewWindow}
            onRestoreInCurrentWindow={onRestoreInCurrentWindow}
            onRestoreToWindow={onRestoreToWindow}
            onDelete={onDelete}
            theme={theme}
          />
          ))}
        </div>
      )}
    </div>
  );
}
