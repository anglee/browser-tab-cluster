import { useState } from 'react';
import { Checkbox } from './Checkbox';
import {
  MoreOutlined,
  PlusOutlined,
  ImportOutlined,
  HistoryOutlined,
  SelectOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { ClosedTabInfo, WindowInfo } from '../types';

interface ClosedTabItemProps {
  tab: ClosedTabInfo;
  windows: WindowInfo[];
  getWindowNumber: (windowId: number) => number;
  hasFocus?: boolean;
  isChecked?: boolean;
  onToggleCheck?: (sessionId: string, checked: boolean) => void;
  onRestore: (sessionId: string) => void;
  onRestoreInNewWindow: (sessionId: string) => void;
  onRestoreInCurrentWindow: (sessionId: string) => void;
  onRestoreToWindow: (sessionId: string, windowId: number) => void;
  onDelete: (sessionId: string) => void;
  theme: 'light' | 'dark';
}

function formatTimeAgo(closedTime: number): string {
  const now = Date.now();
  const diff = now - closedTime;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function ClosedTabItem({
  tab,
  windows,
  getWindowNumber,
  hasFocus = false,
  isChecked = false,
  onToggleCheck,
  onRestore,
  onRestoreInNewWindow,
  onRestoreInCurrentWindow,
  onRestoreToWindow,
  onDelete,
  theme,
}: ClosedTabItemProps) {
  const handleClick = () => {
    onRestore(tab.sessionId);
  };

  const [menuOpen, setMenuOpen] = useState(false);

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

  const menuItems: MenuProps['items'] = [
    { key: 'restore', icon: <HistoryOutlined />, label: 'Restore to Original Location',
      onClick: ({ domEvent }) => { domEvent.stopPropagation(); onRestore(tab.sessionId); } },
    { key: 'new-window', icon: <PlusOutlined />, label: 'Restore in New Window',
      onClick: ({ domEvent }) => { domEvent.stopPropagation(); onRestoreInNewWindow(tab.sessionId); } },
    { key: 'current-window', icon: <ImportOutlined />, label: 'Restore in Current Window',
      onClick: ({ domEvent }) => { domEvent.stopPropagation(); onRestoreInCurrentWindow(tab.sessionId); } },
    ...(windows.length > 0 ? [{
      key: 'restore-to-window', icon: <SelectOutlined />, label: 'Restore to Window',
      children: windows.map((w) => ({
        key: `window-${w.id}`,
        label: <>Window {getWindowNumber(w.id)} ({w.tabs.length} tabs){w.focused && <span className={`ml-1 ${isDark ? 'text-white/60' : 'text-mist-950/60'}`}>(current)</span>}</>,
        onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => { domEvent.stopPropagation(); onRestoreToWindow(tab.sessionId, w.id); },
      })) as MenuProps['items'],
    }] : []),
    { type: 'divider' },
    { key: 'hide', icon: <DeleteOutlined />, label: 'Hide', danger: true,
      onClick: ({ domEvent }) => { domEvent.stopPropagation(); onDelete(tab.sessionId); } },
  ];

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded group cursor-pointer relative ${
        isDark ? 'hover:bg-mist-950' : 'hover:bg-mist-50'
      } ${hasFocus ? (isDark ? 'border border-dashed border-mist-500' : 'border border-dashed border-mist-950') : ''}`}
      onClick={handleClick}
    >
      {/* Checkbox for multi-select — enlarged click zone for Fitts' law */}
      <div
        className={`cursor-hand flex items-center self-stretch p-2 -m-2 ${isChecked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
        onClick={(e) => { e.stopPropagation(); onToggleCheck?.(tab.sessionId, !isChecked); }}
      >
        <Checkbox
          checked={isChecked}
          onChange={() => onToggleCheck?.(tab.sessionId, !isChecked)}
          theme={theme}
        />
      </div>

      <Tooltip title={getDomain()} placement="bottom" mouseEnterDelay={0.3}>
        <img
          src={getFaviconUrl()}
          alt=""
          className="w-4 h-4 flex-shrink-0"
          onError={(e) => {
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

      <span className={`text-xs flex-shrink-0 ${isDark ? 'text-mist-500' : 'text-mist-400'}`}>
        {formatTimeAgo(tab.closedTime)}
      </span>

      {/* Menu button */}
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
        onOpenChange={(open) => setMenuOpen(open)}
      >
        <Tooltip title="More options" placement="bottomRight" mouseEnterDelay={0.3} open={menuOpen ? false : undefined}>
          <button
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded ${
              isDark
                ? 'text-mist-500 hover:text-mist-300 hover:bg-mist-600'
                : 'text-mist-400 hover:text-mist-600 hover:bg-mist-200'
            }`}
          >
            <MoreOutlined className="text-xs" />
          </button>
        </Tooltip>
      </Dropdown>
    </div>
  );
}
