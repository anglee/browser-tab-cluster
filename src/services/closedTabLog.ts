import { ClosedTabInfo, ClosedTabLogEntry } from '../types';

// KEEP IN SYNC with public/background.js (background.js is not bundled and cannot import these)
export const CLOSED_TAB_LOG_KEY = 'closedTabLog';
export const CLOSED_TAB_LOG_CAP = 1000;
export const LOG_ID_PREFIX = 'log-';

// A session's lastModified has seconds granularity; the window absorbs the rounding
// when matching our ms-precision log entries against session entries.
export const DEDUPE_WINDOW_MS = 5000;

export function isLogId(id: string): boolean {
  return id.startsWith(LOG_ID_PREFIX);
}

// KEEP IN SYNC with public/background.js
const NOISE_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://', 'devtools://', 'about:'];

export function isNoiseUrl(url: string): boolean {
  if (!url) return true;
  return NOISE_URL_PREFIXES.some(prefix => url.startsWith(prefix));
}

export function appendToLog(
  log: ClosedTabLogEntry[],
  entry: ClosedTabLogEntry,
  cap: number = CLOSED_TAB_LOG_CAP
): ClosedTabLogEntry[] {
  return [entry, ...log].slice(0, cap);
}

/**
 * Merge session-backed entries (chrome.sessions API) with our own closed-tab log.
 *
 * Log entries that duplicate a session entry (same URL, closed within DEDUPE_WINDOW_MS)
 * are absorbed by it — one-to-one, so two genuine same-URL closes both survive.
 * Dedupe runs against the UNFILTERED session list before hiddenIds are applied, so
 * hiding a session entry doesn't resurrect its log twin.
 */
export function mergeClosedTabs(
  sessionTabs: ClosedTabInfo[],
  logEntries: ClosedTabLogEntry[],
  hiddenIds: Set<string>
): ClosedTabInfo[] {
  const consumed = new Set<number>(); // indexes of session tabs that absorbed a log entry

  const logTabs: ClosedTabInfo[] = [];
  for (const entry of logEntries) {
    if (isNoiseUrl(entry.url)) continue;
    const twinIndex = sessionTabs.findIndex(
      (s, i) =>
        !consumed.has(i) &&
        s.url === entry.url &&
        Math.abs(s.closedTime - entry.closedTime) <= DEDUPE_WINDOW_MS
    );
    if (twinIndex !== -1) {
      consumed.add(twinIndex);
      continue;
    }
    logTabs.push({
      sessionId: entry.id,
      source: 'log',
      title: entry.title,
      url: entry.url,
      favIconUrl: entry.favIconUrl,
      closedTime: entry.closedTime,
    });
  }

  return [...sessionTabs, ...logTabs]
    .filter(tab => !hiddenIds.has(tab.sessionId))
    .sort((a, b) => {
      if (b.closedTime !== a.closedTime) return b.closedTime - a.closedTime;
      if (a.source !== b.source) return a.source === 'session' ? -1 : 1;
      return 0;
    });
}

// Storage wrappers

export async function getClosedTabLog(): Promise<ClosedTabLogEntry[]> {
  const result = await chrome.storage.local.get(CLOSED_TAB_LOG_KEY);
  return result[CLOSED_TAB_LOG_KEY] ?? [];
}

export async function removeLogEntries(ids: string[]): Promise<void> {
  const idSet = new Set(ids);
  const log = await getClosedTabLog();
  await chrome.storage.local.set({
    [CLOSED_TAB_LOG_KEY]: log.filter(entry => !idSet.has(entry.id)),
  });
}

export async function clearClosedTabLog(): Promise<void> {
  await chrome.storage.local.set({ [CLOSED_TAB_LOG_KEY]: [] });
}

export function subscribeToLogChanges(callback: () => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && CLOSED_TAB_LOG_KEY in changes) {
      callback();
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
