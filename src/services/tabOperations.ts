import { TabInfo, WindowInfo, SortOption, DuplicateGroup } from '../types';
import { moveTabs, closeTabs, moveGroupToWindow } from './chromeApi';

export async function mergeWindows(
  sourceWindowIds: number[],
  targetWindowId: number,
  windows: WindowInfo[]
): Promise<void> {
  const sourceWindows = windows.filter(w => sourceWindowIds.includes(w.id));

  for (const window of sourceWindows) {
    // Cross-window tabs.move strips group membership, so groups must travel
    // via moveGroupToWindow (tabGroups.move keeps membership/title/color)
    const ungroupedTabIds = window.tabs.filter(t => t.groupId === -1).map(t => t.id);
    const groupIds = [...new Set(window.tabs.map(t => t.groupId).filter(id => id !== -1))];

    if (ungroupedTabIds.length > 0) {
      await moveTabs(ungroupedTabIds, targetWindowId, -1);
    }
    for (const groupId of groupIds) {
      await moveGroupToWindow(groupId, targetWindowId);
    }
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

/**
 * Compute the final tab order for a window, treating tab groups as sealed containers:
 * - Each group block keeps its position in the window; its tabs sort within the block
 * - Pinned tabs stay in place (Chrome would clamp moves into/out of the pinned region)
 * - Remaining ungrouped tabs sort among themselves across the remaining slots
 *
 * `tabs` must be all tabs of one window; slot i corresponds to window index i.
 */
export function computeSortedOrder(tabs: TabInfo[], option: SortOption): TabInfo[] {
  const byPosition = [...tabs].sort((a, b) => a.index - b.index);

  const groupMembers = new Map<number, TabInfo[]>();
  const ungrouped: TabInfo[] = [];
  for (const tab of byPosition) {
    if (tab.pinned) continue;
    if (tab.groupId !== -1) {
      const members = groupMembers.get(tab.groupId) ?? [];
      members.push(tab);
      groupMembers.set(tab.groupId, members);
    } else {
      ungrouped.push(tab);
    }
  }
  for (const [groupId, members] of groupMembers) {
    groupMembers.set(groupId, sortTabs(members, option));
  }
  const ungroupedSorted = sortTabs(ungrouped, option);

  let ungroupedNext = 0;
  const groupNext = new Map<number, number>();
  return byPosition.map(slotTab => {
    if (slotTab.pinned) return slotTab;
    if (slotTab.groupId !== -1) {
      const k = groupNext.get(slotTab.groupId) ?? 0;
      groupNext.set(slotTab.groupId, k + 1);
      return groupMembers.get(slotTab.groupId)![k];
    }
    return ungroupedSorted[ungroupedNext++];
  });
}

export async function applySortToWindow(
  _windowId: number,
  tabs: TabInfo[],
  option: SortOption
): Promise<void> {
  const byPosition = [...tabs].sort((a, b) => a.index - b.index);
  const finalOrder = computeSortedOrder(tabs, option);

  // Track positions locally so already-correct tabs are skipped accurately
  // (chrome.tabs.move removes then re-inserts, which splice mirrors)
  const current = byPosition.map(t => t.id);
  const moveTo = async (tabId: number, index: number) => {
    if (current[index] === tabId) return;
    await chrome.tabs.move(tabId, { index });
    current.splice(current.indexOf(tabId), 1);
    current.splice(index, 0, tabId);
  };

  // Phase 1: within-group moves only. Both source and target stay inside the
  // group's block, so Chrome preserves group membership.
  for (let i = 0; i < finalOrder.length; i++) {
    if (byPosition[i].groupId !== -1) {
      await moveTo(finalOrder[i].id, i);
    }
  }

  // Phase 2: ungrouped tabs into ungrouped slots, via extract-then-place.
  // Chrome ADOPTS a tab into a group when it is moved strictly inside the
  // group's current range, and interleaved index-based moves can transiently
  // shift a block onto an ungrouped slot. So: first park every out-of-place
  // ungrouped tab at the window end (always outside any group), then insert
  // them into their final slots in ascending order — any unsettled block then
  // sits exactly AT the insertion point, so the insert lands at its head
  // boundary (outside the group), never in its interior.
  const ungroupedSlots: number[] = [];
  for (let i = 0; i < byPosition.length; i++) {
    if (byPosition[i].groupId === -1 && !byPosition[i].pinned) {
      ungroupedSlots.push(i);
    }
  }
  const alreadyInPlace = ungroupedSlots.every(i => current[i] === finalOrder[i].id);
  if (!alreadyInPlace) {
    for (const i of ungroupedSlots) {
      const tabId = finalOrder[i].id;
      await chrome.tabs.move(tabId, { index: -1 });
      current.splice(current.indexOf(tabId), 1);
      current.push(tabId);
    }
    for (const i of ungroupedSlots) {
      await moveTo(finalOrder[i].id, i);
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
    // Start with origin + pathname
    let normalized = urlObj.origin + urlObj.pathname;
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    // Include search params for uniqueness
    if (urlObj.search) {
      normalized += urlObj.search;
    }
    // Preserve hash-based routes (#/ or #!/) — these are different pages in SPAs.
    // Strip plain anchor hashes (#section, #top) as before.
    if (urlObj.hash && (urlObj.hash.startsWith('#/') || urlObj.hash.startsWith('#!/'))) {
      normalized += urlObj.hash;
    }
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function findDuplicates(tabs: TabInfo[]): DuplicateGroup[] {
  // Tab groups are sealed containers: duplicates are only detected within the
  // same group, or among ungrouped tabs (groupId -1 spans windows, matching the
  // previous cross-window behavior for ungrouped tabs). A URL appearing both
  // inside and outside a group is never treated as a duplicate.
  const urlMap = new Map<string, { url: string; tabs: TabInfo[] }>();

  for (const tab of tabs) {
    const normalizedUrl = normalizeUrl(tab.url);
    const key = `${tab.groupId}|${normalizedUrl}`;
    const existing = urlMap.get(key) || { url: normalizedUrl, tabs: [] };
    existing.tabs.push(tab);
    urlMap.set(key, existing);
  }

  const duplicates: DuplicateGroup[] = [];
  for (const { url, tabs: tabList } of urlMap.values()) {
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
