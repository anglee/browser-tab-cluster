import { WindowInfo, ClosedTabInfo } from '../types';

export async function getAllWindows(): Promise<WindowInfo[]> {
  const windows = await chrome.windows.getAll({ populate: true });
  return windows
    .filter(w => w.type === 'normal')
    .map(w => ({
      id: w.id!,
      tabs: (w.tabs || []).map(t => ({
        id: t.id!,
        windowId: t.windowId!,
        index: t.index,
        title: t.title || '',
        url: t.url || '',
        favIconUrl: t.favIconUrl,
        active: t.active,
        pinned: t.pinned,
      })),
      focused: w.focused,
      type: w.type!,
      state: w.state!,
    }));
}

export async function closeTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId);
}

export async function closeTabs(tabIds: number[]): Promise<void> {
  await chrome.tabs.remove(tabIds);
}

export async function closeWindow(windowId: number): Promise<void> {
  await chrome.windows.remove(windowId);
}

export async function focusTab(tabId: number, windowId: number): Promise<void> {
  await chrome.windows.update(windowId, { focused: true });
  await chrome.tabs.update(tabId, { active: true });
}

export async function moveTab(
  tabId: number,
  windowId: number,
  index: number
): Promise<void> {
  await chrome.tabs.move(tabId, { windowId, index });
}

export async function moveTabs(
  tabIds: number[],
  windowId: number,
  index: number
): Promise<void> {
  await chrome.tabs.move(tabIds, { windowId, index });
}

export async function createWindow(tabIds: number[]): Promise<chrome.windows.Window> {
  const [firstTabId, ...restTabIds] = tabIds;
  const newWindow = await chrome.windows.create({ tabId: firstTabId });
  if (restTabIds.length > 0 && newWindow.id) {
    await chrome.tabs.move(restTabIds, { windowId: newWindow.id, index: -1 });
  }
  return newWindow;
}

export function subscribeToChanges(callback: () => void): () => void {
  const listeners = {
    tabCreated: () => callback(),
    tabRemoved: () => callback(),
    tabUpdated: () => callback(),
    tabMoved: () => callback(),
    tabAttached: () => callback(),
    tabDetached: () => callback(),
    windowCreated: () => callback(),
    windowRemoved: () => callback(),
  };

  chrome.tabs.onCreated.addListener(listeners.tabCreated);
  chrome.tabs.onRemoved.addListener(listeners.tabRemoved);
  chrome.tabs.onUpdated.addListener(listeners.tabUpdated);
  chrome.tabs.onMoved.addListener(listeners.tabMoved);
  chrome.tabs.onAttached.addListener(listeners.tabAttached);
  chrome.tabs.onDetached.addListener(listeners.tabDetached);
  chrome.windows.onCreated.addListener(listeners.windowCreated);
  chrome.windows.onRemoved.addListener(listeners.windowRemoved);

  return () => {
    chrome.tabs.onCreated.removeListener(listeners.tabCreated);
    chrome.tabs.onRemoved.removeListener(listeners.tabRemoved);
    chrome.tabs.onUpdated.removeListener(listeners.tabUpdated);
    chrome.tabs.onMoved.removeListener(listeners.tabMoved);
    chrome.tabs.onAttached.removeListener(listeners.tabAttached);
    chrome.tabs.onDetached.removeListener(listeners.tabDetached);
    chrome.windows.onCreated.removeListener(listeners.windowCreated);
    chrome.windows.onRemoved.removeListener(listeners.windowRemoved);
  };
}

// Recently closed tabs API functions

const MAX_RECENTLY_CLOSED_TABS = 30;

export async function getRecentlyClosed(hiddenIds?: Set<string>): Promise<ClosedTabInfo[]> {
  const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });
  const closedTabs: ClosedTabInfo[] = [];

  const isExtensionUrl = (url: string) => url.startsWith('chrome-extension://');
  const isHidden = (sessionId: string) => hiddenIds?.has(sessionId) ?? false;

  for (const session of sessions) {
    if (session.tab) {
      // Individual closed tab - skip extension pages and hidden tabs
      const sessionId = session.tab.sessionId!;
      if (!isExtensionUrl(session.tab.url || '') && !isHidden(sessionId)) {
        closedTabs.push({
          sessionId,
          title: session.tab.title || '',
          url: session.tab.url || '',
          favIconUrl: session.tab.favIconUrl,
          closedTime: session.lastModified * 1000, // Convert to milliseconds
        });
        if (closedTabs.length >= MAX_RECENTLY_CLOSED_TABS) break;
      }
    } else if (session.window) {
      // Closed window - flatten all tabs, skip extension pages and hidden tabs
      for (const tab of session.window.tabs || []) {
        const sessionId = tab.sessionId!;
        if (!isExtensionUrl(tab.url || '') && !isHidden(sessionId)) {
          closedTabs.push({
            sessionId,
            title: tab.title || '',
            url: tab.url || '',
            favIconUrl: tab.favIconUrl,
            closedTime: session.lastModified * 1000,
          });
          if (closedTabs.length >= MAX_RECENTLY_CLOSED_TABS) break;
        }
      }
      if (closedTabs.length >= MAX_RECENTLY_CLOSED_TABS) break;
    }
  }

  return closedTabs;
}

export async function restoreClosedTab(sessionId: string): Promise<chrome.sessions.Session> {
  return chrome.sessions.restore(sessionId);
}

export function subscribeToSessionChanges(callback: () => void): () => void {
  chrome.sessions.onChanged.addListener(callback);
  return () => {
    chrome.sessions.onChanged.removeListener(callback);
  };
}
