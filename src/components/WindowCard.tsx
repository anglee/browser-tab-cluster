import { useState } from 'react';
import { Checkbox } from './Checkbox';
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
  GroupOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { WindowInfo, SortOption, TabGroupInfo } from '../types';
import { TabItem, TAB_GROUP_COLORS } from './TabItem';

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
  tabGroups: TabGroupInfo[];
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
  tabGroups,
  theme,
}: WindowCardProps) {
  const [selectedTabs, setSelectedTabs] = useState<Set<number>>(new Set());
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

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
  };

  const handleBulkMoveToWindow = (targetWindowId: number) => {
    const tabIds = Array.from(selectedTabs);
    tabIds.forEach(tabId => {
      onMoveToWindow(tabId, targetWindowId);
    });
    setSelectedTabs(new Set());
  };

  const handleBulkClose = () => {
    const tabIds = Array.from(selectedTabs);
    tabIds.forEach(tabId => {
      onCloseTab(tabId);
    });
    setSelectedTabs(new Set());
  };

  const handleSort = (option: SortOption) => {
    onSort(window.id, option);
  };

  const isDark = theme === 'dark';
  const otherWindows = allWindows.filter(w => w.id !== window.id);
  const selectedTabCount = selectedTabs.size;

  const allSelected = selectedTabCount === window.tabs.length && window.tabs.length > 0;
  const someSelected = selectedTabCount > 0 && !allSelected;

  // Detect if selected tabs exactly match all tabs of a specific group.
  // Use allWindows (unfiltered) to check group membership, so search filtering
  // doesn't cause a partial selection to incorrectly match a group.
  const unfilteredWindow = allWindows.find(w => w.id === window.id);
  const selectedGroupMatch = (() => {
    if (selectedTabCount === 0 || !unfilteredWindow) return null;
    const selectedIds = Array.from(selectedTabs);
    const firstTab = unfilteredWindow.tabs.find(t => t.id === selectedIds[0]);
    if (!firstTab || firstTab.groupId === -1) return null;
    const groupId = firstTab.groupId;
    const groupTabIds = unfilteredWindow.tabs.filter(t => t.groupId === groupId).map(t => t.id);
    if (groupTabIds.length !== selectedTabCount) return null;
    if (!groupTabIds.every(id => selectedTabs.has(id))) return null;
    return tabGroups.find(g => g.id === groupId) || null;
  })();

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedTabs(new Set());
    } else {
      setSelectedTabs(new Set(window.tabs.map(t => t.id)));
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl outline-none overflow-visible ${
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
        onMouseDown={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${window.focused ? '' : 'cursor-pointer hover:underline'} ${isDark ? 'text-mist-300' : 'text-mist-700'}`}
            {...(!window.focused && { onMouseDown: (e: React.MouseEvent) => { e.stopPropagation(); onFocusWindow(window.id); } })}
          >
            Window {displayNumber}
            {window.focused && (
              <span className={`ml-2 text-xs ${isDark ? 'text-white/60' : 'text-mist-950/60'}`}>(current)</span>
            )}
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
            />{window.tabs.length} tabs
          </span>
        </div>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {/* Group Actions Button - visible when selected tabs exactly match a group */}
          {selectedGroupMatch && (
            <Dropdown
              onOpenChange={(open) => setGroupMenuOpen(open)}
              menu={{ items: (() => {
                const groupTabIds = (unfilteredWindow || window).tabs.filter(t => t.groupId === selectedGroupMatch.id).map(t => t.id);
                const otherGroups = tabGroups.filter(g => g.id !== selectedGroupMatch.id);
                const items: MenuProps['items'] = [
                  { key: 'move-new-window', icon: <PlusOutlined />, label: 'Move to New Window',
                    onClick: ({ domEvent }) => {
                      domEvent.stopPropagation();
                      chrome.windows.create({ tabId: groupTabIds[0] }, (newWindow) => {
                        if (newWindow && groupTabIds.length > 1) {
                          chrome.tabs.move(groupTabIds.slice(1), { windowId: newWindow.id!, index: -1 });
                        }
                      });
                      setSelectedTabs(new Set());
                    } },
                ];
                if (otherWindows.length > 0) {
                  items.push({
                    key: 'move-to-window', icon: <SelectOutlined />, label: 'Move to Window',
                    children: otherWindows.map(w => ({
                      key: `window-${w.id}`,
                      label: <span className="flex items-center justify-between gap-4 w-full">
                        <span>Window {getWindowNumber(w.id)}</span>
                        <span className="text-xs text-gray-400">{w.tabs.length} tabs</span>
                      </span>,
                      onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => {
                        domEvent.stopPropagation();
                        chrome.tabs.move(groupTabIds, { windowId: w.id, index: -1 });
                        setSelectedTabs(new Set());
                      },
                    })) as MenuProps['items'],
                  });
                }
                if (otherGroups.length > 0) {
                  items.push({
                    key: 'merge-with-group', icon: <GroupOutlined />, label: 'Merge with Group',
                    children: otherGroups.map(g => ({
                      key: `group-${g.id}`,
                      label: <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                          style={{ backgroundColor: (TAB_GROUP_COLORS[g.color] || TAB_GROUP_COLORS.grey)[isDark ? 'dark' : 'light'] }} />
                        {g.title || 'Unnamed group'}
                      </span>,
                      onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => {
                        domEvent.stopPropagation();
                        chrome.tabs.group({ tabIds: groupTabIds, groupId: g.id });
                        setSelectedTabs(new Set());
                      },
                    })) as MenuProps['items'],
                  });
                }
                items.push(
                  { type: 'divider' },
                  { key: 'ungroup', icon: <GroupOutlined />, label: 'Ungroup',
                    onClick: ({ domEvent }) => { domEvent.stopPropagation(); chrome.tabs.ungroup(groupTabIds); setSelectedTabs(new Set()); } },
                  { key: 'close-group', icon: <CloseOutlined />, label: 'Close Group', danger: true,
                    onClick: ({ domEvent }) => { domEvent.stopPropagation(); chrome.tabs.remove(groupTabIds); setSelectedTabs(new Set()); } },
                );
                return items;
              })() }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Tooltip title={"Actions for group"} placement="top" mouseEnterDelay={0.3} open={groupMenuOpen ? false : undefined}>
                <Button type="text" size="small" icon={<GroupOutlined />} onMouseDown={(e) => e.stopPropagation()} style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>{selectedGroupMatch.title || 'Unnamed group'}</Button>
              </Tooltip>
            </Dropdown>
          )}

          {/* Bulk Actions Button - only visible when 1+ tabs selected and no group match */}
          {selectedTabCount >= 1 && !selectedGroupMatch && (
            <Dropdown
                onOpenChange={(open) => setActionsMenuOpen(open)}
                menu={{ items: (() => {
                  const items: MenuProps['items'] = [
                    { key: 'new-window', icon: <PlusOutlined />, label: 'Move to New Window',
                      onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleBulkMoveToNewWindow(); } },
                  ];
                  if (otherWindows.length > 0) {
                    items.push({
                      key: 'move-to-window', icon: <SelectOutlined />, label: 'Move to Window',
                      children: otherWindows.map(w => ({
                        key: `window-${w.id}`, label: <span className="flex items-center justify-between gap-4 w-full">
                          <span>Window {getWindowNumber(w.id)}</span>
                          <span className="text-xs text-gray-400">{w.tabs.length} tabs</span>
                        </span>,
                        onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => { domEvent.stopPropagation(); handleBulkMoveToWindow(w.id); },
                      })) as MenuProps['items'],
                    });
                  }
                  items.push({
                    key: 'create-group', icon: <GroupOutlined />, label: 'Create New Group',
                    onClick: async ({ domEvent }) => {
                      domEvent.stopPropagation();
                      const tabIds = Array.from(selectedTabs);
                      const existingNames = new Set(tabGroups.map(g => g.title));
                      let n = 1;
                      while (existingNames.has(`Tab Group ${n}`)) n++;
                      const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: window.id } });
                      await chrome.tabGroups.update(groupId, { title: `Tab Group ${n}` });
                      setSelectedTabs(new Set());
                    },
                  });
                  if (tabGroups.length > 0) {
                    items.push({
                      key: 'move-to-group', icon: <GroupOutlined />, label: 'Move to Group',
                      children: tabGroups.map(g => ({
                        key: `group-${g.id}`,
                        label: <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                            style={{ backgroundColor: (TAB_GROUP_COLORS[g.color] || TAB_GROUP_COLORS.grey)[isDark ? 'dark' : 'light'] }} />
                          {g.title || 'Unnamed group'}
                        </span>,
                        onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => {
                          domEvent.stopPropagation();
                          chrome.tabs.group({ tabIds: Array.from(selectedTabs), groupId: g.id });
                          setSelectedTabs(new Set());
                        },
                      })) as MenuProps['items'],
                    });
                  }
                  items.push(
                    { type: 'divider' },
                    { key: 'close', icon: <CloseOutlined />, label: `Close All ${selectedTabCount} tabs`, danger: true,
                      onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleBulkClose(); } },
                  );
                  return items;
                })() }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Tooltip title={`Actions for ${selectedTabCount} tabs`} placement="top" mouseEnterDelay={0.3} open={actionsMenuOpen ? false : undefined}>
                  <Button type="text" size="small" icon={<FileTextOutlined />} style={{ color: isDark ? '#60a5fa' : '#2563eb' }} onMouseDown={(e) => e.stopPropagation()}>{selectedTabCount}</Button>
                </Tooltip>
              </Dropdown>
          )}

          {!isSearching && (
            <>
              <Dropdown
                menu={{ items: [
                  { key: 'domain', label: 'By Domain', onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleSort('domain'); } },
                  { key: 'title', label: 'By Title', onClick: ({ domEvent }) => { domEvent.stopPropagation(); handleSort('title'); } },
                ] }}
                trigger={['click']}
                placement="bottomRight"
                onOpenChange={(open) => setSortMenuOpen(open)}
              >
                <Tooltip title="Sort tabs" placement="top" mouseEnterDelay={0.3} open={sortMenuOpen ? false : undefined}>
                  <Button
                    type="text"
                    size="small"
                    icon={<SortAscendingOutlined />}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              </Dropdown>

              <Tooltip title="Remove duplicates" placement="top" mouseEnterDelay={0.3}>
                <Button type="text" size="small" icon={<MergeOutlined rotate={90} />} onMouseDown={(e) => { e.stopPropagation(); onDedupe(window.id); }} />
              </Tooltip>

              <Tooltip title="Close window" placement="top" mouseEnterDelay={0.3}>
                <Button type="text" size="small" icon={<CloseOutlined />} onMouseDown={(e) => { e.stopPropagation(); onCloseWindow(window.id); }} className="hover:!text-red-400" />
              </Tooltip>
            </>
          )}

          {/* Collapse Toggle */}
          <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'} placement="top" mouseEnterDelay={0.3}>
            <Button
              type="text"
              size="small"
              icon={<span className={`inline-block transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}><RightOutlined /></span>}
              onMouseDown={(e) => { e.stopPropagation(); onToggleCollapse(); }}
            />
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
              tabGroup={tabGroups.find(g => g.id === tab.groupId)}
              tabGroups={tabGroups}
              onMoveToGroup={(tabId, groupId) => {
                chrome.tabs.group({ tabIds: tabId, groupId });
              }}
              onToggleGroupSelect={(groupId) => {
                const groupTabIds = (unfilteredWindow || window).tabs.filter(t => t.groupId === groupId).map(t => t.id);
                const allGroupSelected = groupTabIds.every(id => selectedTabs.has(id));
                setSelectedTabs(prev => {
                  const next = new Set(prev);
                  groupTabIds.forEach(id => allGroupSelected ? next.delete(id) : next.add(id));
                  return next;
                });
              }}
              theme={theme}
            />
          ))}
        </SortableContext>
        </div>
      )}
    </div>
  );
}
