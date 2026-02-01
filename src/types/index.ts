export interface TabInfo {
  id: number;
  windowId: number;
  index: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
  pinned: boolean;
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
  sessionId: string;
  title: string;
  url: string;
  favIconUrl?: string;
  closedTime: number;
}
