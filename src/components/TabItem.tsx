import { useState } from 'react';
import { Checkbox } from './Checkbox';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  HolderOutlined,
  PushpinFilled,
  PushpinOutlined,
  MoreOutlined,
  PlusOutlined,
  SelectOutlined,
  CloseOutlined,
  GroupOutlined,
} from '@ant-design/icons';
import { Tooltip, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { TabInfo, WindowInfo, TabGroupInfo } from '../types';

interface TabItemProps {
  tab: TabInfo;
  windows: WindowInfo[];
  getWindowNumber: (windowId: number) => number;
  hasFocus?: boolean;
  isChecked?: boolean;
  onToggleCheck?: (tabId: number, checked: boolean) => void;
  onClose: (tabId: number) => void;
  onActivate: (tabId: number, windowId: number) => void;
  onMoveToWindow: (tabId: number, targetWindowId: number) => void;
  onMoveToNewWindow: (tabId: number) => void;
  onTogglePin: (tabId: number, pinned: boolean) => void;
  tabGroup?: TabGroupInfo;
  tabGroups: TabGroupInfo[];
  onToggleGroupSelect?: (groupId: number) => void;
  onMoveToGroup: (tabId: number, groupId: number) => void;
  theme: 'light' | 'dark';
}

export const TAB_GROUP_COLORS: Record<string, { light: string; dark: string }> = {
  grey:   { light: '#5F6368', dark: '#DADCE0' },
  blue:   { light: '#1A73E8', dark: '#8AB4F8' },
  red:    { light: '#D93025', dark: '#F28B82' },
  yellow: { light: '#F9AB00', dark: '#FDD663' },
  green:  { light: '#188038', dark: '#81C995' },
  pink:   { light: '#D01884', dark: '#FF8BCB' },
  purple: { light: '#A142F4', dark: '#C58AF9' },
  cyan:   { light: '#007B83', dark: '#78D9EC' },
  orange: { light: '#FA903E', dark: '#FCAD70' },
};

export function TabItem({
  tab,
  windows,
  getWindowNumber,
  hasFocus = false,
  isChecked = false,
  onToggleCheck,
  onClose,
  onActivate,
  onMoveToWindow,
  onMoveToNewWindow,
  onTogglePin,
  tabGroup,
  tabGroups,
  onToggleGroupSelect,
  onMoveToGroup,
  theme
}: TabItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `tab-${tab.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  };

  const handleClick = () => {
    onActivate(tab.id, tab.windowId);
  };

  const getFaviconUrl = () => {
    if (tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://')) {
      return tab.favIconUrl;
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tab.url)}&sz=32`;
  };

  const getDomain = () => {
    try {
      return new URL(tab.url).hostname;
    } catch {
      return tab.url;
    }
  };

  const isDark = theme === 'dark';
  const otherWindows = windows.filter(w => w.id !== tab.windowId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 ${tabGroup ? '-mx-2 px-4 py-1.5' : 'px-2 py-1.5' } rounded group cursor-pointer relative ${
        isDark
          ? `hover:bg-mist-950 ${tab.active ? 'bg-mist-900' : ''}`
          : `hover:bg-mist-50 ${tab.active ? 'bg-mist-100' : ''}`
      } ${hasFocus ? (isDark ? 'border border-dashed border-mist-500' : 'border border-dashed border-mist-950') : ''}`}
      onClick={handleClick}
    >
      {tabGroup && (
        <Tooltip title={`Tab group: ${tabGroup.title}` || 'Unnamed group'} placement="top" mouseEnterDelay={0.3}>
          <span
            className="absolute left-0 top-px bottom-px w-2 cursor-pointer"
            style={{ backgroundColor: (TAB_GROUP_COLORS[tabGroup.color] || TAB_GROUP_COLORS.grey)[isDark ? 'dark' : 'light'] }}
            onClick={(e) => { e.stopPropagation(); onToggleGroupSelect?.(tabGroup.id); }}
          />
        </Tooltip>
      )}

      {/* Checkbox for multi-select — enlarged click zone for Fitts' law */}
      <div
        className={`cursor-hand -mr-3 flex items-center self-stretch p-2 -m-2 ${isChecked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
        onClick={(e) => { e.stopPropagation(); onToggleCheck?.(tab.id, !isChecked); }}
      >
        <Checkbox
          checked={isChecked}
          onChange={() => onToggleCheck?.(tab.id, !isChecked)}
          theme={theme}
        />
      </div>

      <div
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className={`cursor-grab active:cursor-grabbing p-1 ${
          isDark ? 'text-mist-500 hover:text-mist-300' : 'text-mist-400 hover:text-mist-600'
        }`}
      >
        <HolderOutlined className="text-xs" />
      </div>

      {tab.pinned && (
        <span title="Pinned">
          <PushpinFilled className="text-xs text-blue-400 flex-shrink-0" />
        </span>
      )}
      <Tooltip title={getDomain()} placement="bottom" mouseEnterDelay={0.3}>
        <img
          src={getFaviconUrl()}
          alt=""
          className="w-4 h-4 flex-shrink-0"
          onError={e => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>';
          }}
        />
      </Tooltip>

      <div className="flex-1 min-w-0">
        <Tooltip title={<>{tab.title || 'Untitled'}<br /><span className="text-mist-400">{tab.url}</span></>} placement="bottom" mouseEnterDelay={0.3} overlayInnerStyle={{ maxWidth: '20rem', wordBreak: 'break-all', whiteSpace: 'pre-line' }}>
          <span className={`text-sm truncate block ${isDark ? 'text-mist-400' : 'text-mist-700'}`}>
            {tab.title || 'Untitled'}
          </span>
        </Tooltip>
      </div>

      {/* Menu button */}
      <Dropdown
          onOpenChange={(open) => setMenuOpen(open)}
          menu={{ items: (() => {
            const items: MenuProps['items'] = [
              { key: 'new-window', icon: <PlusOutlined />, label: 'Move to New Window',
                onClick: ({ domEvent }) => { domEvent.stopPropagation(); onMoveToNewWindow(tab.id); } },
            ];
            if (otherWindows.length > 0) {
              items.push({
                key: 'move-to-window', icon: <SelectOutlined />, label: 'Move to Window',
                children: otherWindows.map(w => ({
                  key: `window-${w.id}`, label: <span className="flex items-center justify-between gap-4 w-full">
                    <span>Window {getWindowNumber(w.id)}</span>
                    <span className="text-xs text-gray-400">{w.tabs.length} tabs</span>
                  </span>,
                  onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => { domEvent.stopPropagation(); onMoveToWindow(tab.id, w.id); },
                })) as MenuProps['items'],
              });
            }
            const availableGroups = tabGroups.filter(g => g.id !== tab.groupId);
            if (availableGroups.length > 0) {
              items.push({
                key: 'move-to-group', icon: <GroupOutlined />, label: 'Move to Group',
                children: availableGroups.map(g => ({
                  key: `group-${g.id}`,
                  label: <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                      style={{ backgroundColor: (TAB_GROUP_COLORS[g.color] || TAB_GROUP_COLORS.grey)[isDark ? 'dark' : 'light'] }} />
                    {g.title || 'Unnamed group'}
                  </span>,
                  onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => { domEvent.stopPropagation(); onMoveToGroup(tab.id, g.id); },
                })) as MenuProps['items'],
              });
            }
            items.push(
              { key: 'pin', icon: <PushpinOutlined />, label: tab.pinned ? 'Unpin' : 'Pin',
                onClick: ({ domEvent }) => { domEvent.stopPropagation(); onTogglePin(tab.id, !tab.pinned); } },
              { type: 'divider' },
              { key: 'close', icon: <CloseOutlined />, label: 'Close Tab', danger: true,
                onClick: ({ domEvent }) => { domEvent.stopPropagation(); onClose(tab.id); } },
            );
            return items;
          })() }}
          trigger={['click']}
          placement="bottomRight"
        >
        <Tooltip title="More options" placement="bottomRight" mouseEnterDelay={0.3} open={menuOpen ? false : undefined}>
          <button
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded ${
              isDark ? 'text-mist-500 hover:text-mist-300 hover:bg-mist-600' : 'text-mist-400 hover:text-mist-600 hover:bg-mist-200'
            }`}
          >
            <MoreOutlined className="text-xs" />
          </button>
        </Tooltip>
      </Dropdown>

      <Tooltip title="Close tab" placement="bottomRight" mouseEnterDelay={0.3}>
        <button
          onClick={handleClose}
          tabIndex={-1}
          className={`p-1 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? 'text-mist-500' : 'text-mist-400'
          }`}
        >
          <CloseOutlined className="text-xs" />
        </button>
      </Tooltip>
    </div>
  );
}
