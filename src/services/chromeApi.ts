import { WindowInfo } from '../types';

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
