import { TabInfo, WindowInfo, SortOption, DuplicateGroup } from '../types';
import { moveTabs, closeTabs } from './chromeApi';

export async function mergeWindows(
  sourceWindowIds: number[],
  targetWindowId: number,
  windows: WindowInfo[]
): Promise<void> {
  const sourceWindows = windows.filter(w => sourceWindowIds.includes(w.id));
  const tabIds = sourceWindows.flatMap(w => w.tabs.map(t => t.id));

  if (tabIds.length > 0) {
    await moveTabs(tabIds, targetWindowId, -1);
  }
}

export function sortTabs(tabs: TabInfo[], option: SortOption): TabInfo[] {
  const sorted = [...tabs];

  switch (option) {
    case 'domain':
      sorted.sort((a, b) => {
        const domainA = getDomain(a.url);
        const domainB = getDomain(b.url);
        return domainA.localeCompare(domainB);
      });
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'position':
      sorted.sort((a, b) => a.index - b.index);
      break;
  }

  return sorted;
}

export async function applySortToWindow(
  _windowId: number,
  tabs: TabInfo[],
  option: SortOption
): Promise<void> {
  const sorted = sortTabs(tabs, option);

  for (let i = 0; i < sorted.length; i++) {
    const tab = sorted[i];
    if (tab.index !== i) {
      await chrome.tabs.move(tab.id, { index: i });
    }
  }
}

function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove hash and trailing slash
    let normalized = urlObj.origin + urlObj.pathname;
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    // Include search params for uniqueness
    if (urlObj.search) {
      normalized += urlObj.search;
    }
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function findDuplicates(tabs: TabInfo[]): DuplicateGroup[] {
  const urlMap = new Map<string, TabInfo[]>();

  for (const tab of tabs) {
    const normalizedUrl = normalizeUrl(tab.url);
    const existing = urlMap.get(normalizedUrl) || [];
    existing.push(tab);
    urlMap.set(normalizedUrl, existing);
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [url, tabList] of urlMap) {
    if (tabList.length > 1) {
      duplicates.push({ url, tabs: tabList });
    }
  }

  return duplicates;
}

export async function removeDuplicates(duplicates: DuplicateGroup[]): Promise<number> {
  const tabsToClose: number[] = [];

  for (const group of duplicates) {
    // Keep the first tab (leftmost), close the rest
    const [, ...toClose] = group.tabs;
    tabsToClose.push(...toClose.map(t => t.id));
  }

  if (tabsToClose.length > 0) {
    await closeTabs(tabsToClose);
  }

  return tabsToClose.length;
}
