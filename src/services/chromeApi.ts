import { WindowInfo, ClosedTabInfo, TabGroupInfo } from '../types';

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
        groupId: t.groupId ?? -1,
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

export async function getTabGroups(): Promise<TabGroupInfo[]> {
  if (!chrome.tabGroups) return [];
  const groups = await chrome.tabGroups.query({});
  return groups.map(g => ({
    id: g.id,
    title: g.title || '',
    color: g.color,
  }));
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

  const groupCleanups: (() => void)[] = [];
  if (chrome.tabGroups) {
    const groupListeners = {
      groupCreated: () => callback(),
      groupUpdated: () => callback(),
      groupRemoved: () => callback(),
      groupMoved: () => callback(),
    };
    chrome.tabGroups.onCreated.addListener(groupListeners.groupCreated);
    chrome.tabGroups.onUpdated.addListener(groupListeners.groupUpdated);
    chrome.tabGroups.onRemoved.addListener(groupListeners.groupRemoved);
    chrome.tabGroups.onMoved.addListener(groupListeners.groupMoved);
    groupCleanups.push(() => {
      chrome.tabGroups.onCreated.removeListener(groupListeners.groupCreated);
      chrome.tabGroups.onUpdated.removeListener(groupListeners.groupUpdated);
      chrome.tabGroups.onRemoved.removeListener(groupListeners.groupRemoved);
      chrome.tabGroups.onMoved.removeListener(groupListeners.groupMoved);
    });
  }

  return () => {
    chrome.tabs.onCreated.removeListener(listeners.tabCreated);
    chrome.tabs.onRemoved.removeListener(listeners.tabRemoved);
    chrome.tabs.onUpdated.removeListener(listeners.tabUpdated);
    chrome.tabs.onMoved.removeListener(listeners.tabMoved);
    chrome.tabs.onAttached.removeListener(listeners.tabAttached);
    chrome.tabs.onDetached.removeListener(listeners.tabDetached);
    chrome.windows.onCreated.removeListener(listeners.windowCreated);
    chrome.windows.onRemoved.removeListener(listeners.windowRemoved);
    groupCleanups.forEach(fn => fn());
  };
}

// Tab group API functions

/**
 * Move an entire tab group to another window, keeping the group intact.
 * Prefers chrome.tabGroups.move (preserves the group and its identity); falls
 * back to move-then-regroup (restoring title/color under a new group id) on
 * Chrome versions that reject cross-window group moves.
 */
export async function moveGroupToWindow(groupId: number, targetWindowId: number): Promise<void> {
  try {
    await chrome.tabGroups.move(groupId, { windowId: targetWindowId, index: -1 });
  } catch {
    const group = await chrome.tabGroups.get(groupId);
    const tabs = await chrome.tabs.query({ groupId });
    const tabIds = tabs
      .sort((a, b) => a.index - b.index)
      .map(t => t.id)
      .filter((id): id is number => id !== undefined);
    if (tabIds.length === 0) return;
    await chrome.tabs.move(tabIds, { windowId: targetWindowId, index: -1 });
    const newGroupId = await chrome.tabs.group({
      tabIds,
      createProperties: { windowId: targetWindowId },
    });
    await chrome.tabGroups.update(newGroupId, { title: group.title, color: group.color });
  }
}

/**
 * Move an entire tab group into a brand-new window, keeping the group intact.
 * The window is created empty (creating it around a group tab would eject that
 * tab from the group); its placeholder new-tab is closed after the move.
 */
export async function moveGroupToNewWindow(groupId: number): Promise<void> {
  const newWindow = await chrome.windows.create({});
  if (!newWindow.id) return;
  const placeholderTabId = newWindow.tabs?.[0]?.id;
  await moveGroupToWindow(groupId, newWindow.id);
  if (placeholderTabId !== undefined) {
    await chrome.tabs.remove(placeholderTabId);
  }
}

// Recently closed tabs API functions

// Hidden-tab filtering happens in mergeClosedTabs (closedTabLog.ts), which needs the
// unfiltered session list to dedupe log entries against.
export async function getRecentlyClosed(): Promise<ClosedTabInfo[]> {
  const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });
  const closedTabs: ClosedTabInfo[] = [];

  const isExtensionUrl = (url: string) => url.startsWith('chrome-extension://');

  for (const session of sessions) {
    if (session.tab) {
      // Individual closed tab - skip extension pages
      if (!isExtensionUrl(session.tab.url || '')) {
        closedTabs.push({
          sessionId: session.tab.sessionId!,
          source: 'session',
          title: session.tab.title || '',
          url: session.tab.url || '',
          favIconUrl: session.tab.favIconUrl,
          closedTime: session.lastModified * 1000, // Convert to milliseconds
        });
      }
    } else if (session.window) {
      // Closed window - flatten all tabs, skip extension pages
      for (const tab of session.window.tabs || []) {
        if (!isExtensionUrl(tab.url || '')) {
          closedTabs.push({
            sessionId: tab.sessionId!,
            source: 'session',
            title: tab.title || '',
            url: tab.url || '',
            favIconUrl: tab.favIconUrl,
            closedTime: session.lastModified * 1000,
          });
        }
      }
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
