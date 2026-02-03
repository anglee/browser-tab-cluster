import { useState } from 'react';
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
import { ClosedTabInfo, WindowInfo } from '../types';
import { ClosedTabItem } from './ClosedTabItem';
import { Submenu, SubmenuItem } from './Submenu';
import { Tooltip } from './Tooltip';

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
  const [showActionsMenu, setShowActionsMenu] = useState(false);
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
    setShowActionsMenu(false);
  };

  const handleBulkRestoreInNewWindow = () => {
    const sessionIds = Array.from(selectedTabs);
    onBulkRestoreInNewWindow(sessionIds);
    setSelectedTabs(new Set());
    setShowActionsMenu(false);
  };

  const handleBulkRestoreInCurrentWindow = () => {
    const sessionIds = Array.from(selectedTabs);
    onBulkRestoreInCurrentWindow(sessionIds);
    setSelectedTabs(new Set());
    setShowActionsMenu(false);
  };

  const handleBulkRestoreToWindow = (windowId: number) => {
    const sessionIds = Array.from(selectedTabs);
    onBulkRestoreToWindow(sessionIds, windowId);
    setSelectedTabs(new Set());
    setShowActionsMenu(false);
  };

  const handleBulkDelete = () => {
    const sessionIds = Array.from(selectedTabs);
    sessionIds.forEach((sessionId) => {
      onDelete(sessionId);
    });
    setSelectedTabs(new Set());
    setShowActionsMenu(false);
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

  if (closedTabs.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-xl outline-none ${
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
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <HistoryOutlined
            className={`text-base ${isDark ? 'text-mist-400' : 'text-mist-500'}`}
          />
          <span className={`text-sm font-medium ${isDark ? 'text-mist-200' : 'text-mist-700'}`}>
            Recently Closed
          </span>
          <span className={`text-xs ${isDark ? 'text-mist-400' : 'text-mist-500'}`}>
            ({closedTabs.length})
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
                    isDark
                      ? 'text-blue-400 hover:text-blue-300 hover:bg-mist-700'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-mist-200'
                  }`}
                >
                  <FileTextOutlined className="text-base" />
                  <span className="text-xs font-medium">{selectedTabCount}</span>
                </button>
              </Tooltip>
              {showActionsMenu && (
                <div
                  className={`absolute right-0 top-full mt-1 py-1 w-56 rounded-xl shadow-lg z-20 ring-1 ${
                    isDark ? 'bg-mist-900 ring-white/10' : 'bg-mist-50 ring-mist-950/10'
                  }`}
                >
                  <button
                    onClick={handleBulkRestore}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDark ? 'text-mist-200 hover:bg-mist-700' : 'text-mist-700 hover:bg-mist-100'
                    }`}
                  >
                    <UndoOutlined className="text-base" />
                    Restore to Original Location
                  </button>

                  <button
                    onClick={handleBulkRestoreInNewWindow}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDark ? 'text-mist-200 hover:bg-mist-700' : 'text-mist-700 hover:bg-mist-100'
                    }`}
                  >
                    <PlusOutlined className="text-base" />
                    Restore in New Window
                  </button>

                  <button
                    onClick={handleBulkRestoreInCurrentWindow}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDark ? 'text-mist-200 hover:bg-mist-700' : 'text-mist-700 hover:bg-mist-100'
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
                          onClick={() => handleBulkRestoreToWindow(w.id)}
                          theme={theme}
                        >
                          Window {getWindowNumber(w.id)} ({w.tabs.length})
                          {w.focused && <span className={`ml-1 ${isDark ? 'text-white/60' : 'text-mist-950/60'}`}>(current)</span>}
                        </SubmenuItem>
                      ))}
                    </Submenu>
                  )}

                  <div
                    className={`my-1 border-t ${isDark ? 'border-white/10' : 'border-mist-950/10'}`}
                  />

                  <button
                    onClick={handleBulkDelete}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-500 ${
                      isDark ? 'hover:bg-mist-700' : 'hover:bg-mist-100'
                    }`}
                  >
                    <DeleteOutlined className="text-base" />
                    Hide Selected
                  </button>
                </div>
              )}
            </div>
          )}

          {!isSearching && (
            <>
              <div className="relative">
                <Tooltip text="Restore all" theme={theme} position="bottom-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRestoreAllClick(); }}
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
                <Tooltip text="Clear all" theme={theme} position="bottom-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearAllClick(); }}
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
