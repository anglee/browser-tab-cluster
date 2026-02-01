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
} from '@ant-design/icons';
import { ClosedTabInfo, WindowInfo } from '../types';
import { ClosedTabItem } from './ClosedTabItem';
import { Submenu, SubmenuItem } from './Submenu';
import { Tooltip } from './Tooltip';

interface RecentlyClosedCardProps {
  closedTabs: ClosedTabInfo[];
  windows: WindowInfo[];
  isCardFocused: boolean;
  focusedTabIndex: number;
  searchCandidateTabIndex: number;
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
  isCardFocused,
  focusedTabIndex,
  searchCandidateTabIndex,
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
      className={`rounded-lg border outline-none break-inside-avoid mb-4 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } ${isDark ? 'border-gray-700' : 'border-gray-300'} ${
        isCardFocused ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${
          isDark ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <HistoryOutlined
            className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Recently Closed
          </span>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            ({closedTabs.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Bulk Actions Button - only visible when 2+ tabs selected */}
          {selectedTabCount >= 2 && (
            <div className="relative">
              <Tooltip text={`Actions for ${selectedTabCount} tabs`} theme={theme} position="bottom-right">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  tabIndex={-1}
                  className={`p-1.5 rounded flex items-center gap-1 ${
                    isDark
                      ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-gray-200'
                  }`}
                >
                  <FileTextOutlined className="text-base" />
                  <span className="text-xs font-medium">{selectedTabCount}</span>
                </button>
              </Tooltip>
              {showActionsMenu && (
                <div
                  className={`absolute right-0 top-full mt-1 py-1 w-56 rounded-lg shadow-lg z-20 border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <button
                    onClick={handleBulkRestore}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <UndoOutlined className="text-base" />
                    Restore to Original Location
                  </button>

                  <button
                    onClick={handleBulkRestoreInNewWindow}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <PlusOutlined className="text-base" />
                    Restore in New Window
                  </button>

                  <button
                    onClick={handleBulkRestoreInCurrentWindow}
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
                          onClick={() => handleBulkRestoreToWindow(w.id)}
                          theme={theme}
                        >
                          Window {w.id} ({w.tabs.length})
                          {w.focused && <span className="text-green-500 ml-1">(current)</span>}
                        </SubmenuItem>
                      ))}
                    </Submenu>
                  )}

                  <div
                    className={`my-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                  />

                  <button
                    onClick={handleBulkDelete}
                    tabIndex={-1}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 text-red-500 ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <DeleteOutlined className="text-base" />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <Tooltip text="Restore all" theme={theme} position="bottom-right">
              <button
                onClick={handleRestoreAllClick}
                tabIndex={-1}
                className={`p-1.5 rounded ${
                  isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ReloadOutlined className="text-base" />
              </button>
            </Tooltip>
            {showRestoreAllConfirm && (
              <div
                className={`absolute right-0 top-full mt-1 p-3 w-56 rounded-lg shadow-lg z-20 border ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Restore all {closedTabs.length} tabs in a new window?
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowRestoreAllConfirm(false)}
                    tabIndex={-1}
                    className={`px-3 py-1 text-sm rounded ${
                      isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
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
                onClick={handleClearAllClick}
                tabIndex={-1}
                className={`p-1.5 rounded hover:text-red-400 ${
                  isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                <DeleteOutlined className="text-base" />
              </button>
            </Tooltip>
            {showClearAllConfirm && (
              <div
                className={`absolute right-0 top-full mt-1 p-3 w-56 rounded-lg shadow-lg z-20 border ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  Clear all recently closed tabs? This cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowClearAllConfirm(false)}
                    tabIndex={-1}
                    className={`px-3 py-1 text-sm rounded ${
                      isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
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
        </div>
      </div>

      <div className="p-2">
        {closedTabs.map((tab, index) => (
          <ClosedTabItem
            key={tab.sessionId}
            tab={tab}
            windows={windows}
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
    </div>
  );
}
