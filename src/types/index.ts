export interface TabInfo {
  id: number;
  windowId: number;
  index: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
  pinned: boolean;
  groupId: number;
}

export interface TabGroupInfo {
  id: number;
  title: string;
  color: chrome.tabGroups.ColorEnum;
}

export interface WindowInfo {
  id: number;
  tabs: TabInfo[];
  focused: boolean;
  type: string;
  state: string;
}

export type SortOption = 'domain' | 'title' | 'position';

export interface DuplicateGroup {
  url: string;
  tabs: TabInfo[];
}

export interface ClosedTabInfo {
  // Real Chrome sessionId for 'session' entries, synthetic "log-..." id for 'log' entries
  sessionId: string;
  source: 'session' | 'log';
  title: string;
  url: string;
  favIconUrl?: string;
  closedTime: number;
}

// Entry in the persistent closed-tab log kept in chrome.storage.local by background.js
export interface ClosedTabLogEntry {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
  closedTime: number;
}
