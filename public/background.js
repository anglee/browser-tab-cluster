// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-tab-cluster') {
    openTabCluster();
  }
});

// Open the tab cluster page in the currently focused window, pinned
function openTabCluster() {
  const managerUrl = chrome.runtime.getURL('manager/index.html');

  // Get the currently focused window first
  chrome.windows.getCurrent({ populate: false }, (currentWindow) => {
    const targetWindowId = currentWindow.id;

    // Check if tab cluster is already open
    chrome.tabs.query({ url: managerUrl }, (tabs) => {
      if (tabs.length > 0) {
        const existingTab = tabs[0];

        if (existingTab.windowId === targetWindowId) {
          // Already in the focused window, just activate and pin it
          chrome.tabs.update(existingTab.id, { active: true, pinned: true });
          // Send message to focus search input
          chrome.tabs.sendMessage(existingTab.id, { action: 'focus-search' });
        } else {
          // Move to the focused window, pin it, and activate
          chrome.tabs.move(existingTab.id, { windowId: targetWindowId, index: 0 }, () => {
            chrome.tabs.update(existingTab.id, { active: true, pinned: true });
            chrome.windows.update(targetWindowId, { focused: true });
            // Send message to focus search input
            chrome.tabs.sendMessage(existingTab.id, { action: 'focus-search' });
          });
        }
      } else {
        // Create new tab in the focused window, pinned
        chrome.tabs.create({ url: managerUrl, windowId: targetWindowId, pinned: true });
      }
    });
  });
}

// ---- Closed-tab log ----
// Records every tab close into chrome.storage.local so the manager can show
// recently closed tabs beyond the sessions API's ~25-session limit.
// tabs.onRemoved doesn't include url/title, so a tabId -> metadata cache is
// kept in chrome.storage.session (survives service worker restarts).

// KEEP IN SYNC with src/services/closedTabLog.ts (this file is not bundled and cannot import it)
const CLOSED_TAB_LOG_KEY = 'closedTabLog';
const CLOSED_TAB_LOG_CAP = 1000;
const NOISE_URL_PREFIXES = ['chrome://', 'chrome-extension://', 'edge://', 'devtools://', 'about:'];

const TAB_META_CACHE_KEY = 'tabMetaCache';

function isNoiseUrl(url) {
  if (!url) return true;
  return NOISE_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

// All cache/log mutations run through this chain so a burst of onRemoved events
// (e.g. closing a whole window) can't lose updates to read-modify-write races.
let opQueue = Promise.resolve();
function enqueue(op) {
  opQueue = opQueue.then(op).catch((err) => console.error('[closedTabLog]', err));
}

async function getTabMetaCache() {
  const result = await chrome.storage.session.get(TAB_META_CACHE_KEY);
  return result[TAB_META_CACHE_KEY] ?? {};
}

function setTabMetaCache(cache) {
  return chrome.storage.session.set({ [TAB_META_CACHE_KEY]: cache });
}

function tabMeta(tab) {
  return {
    url: tab.url || tab.pendingUrl || '',
    title: tab.title || '',
    favIconUrl: tab.favIconUrl,
  };
}

async function upsertTabMeta(tab) {
  if (!tab || tab.id === undefined || tab.incognito) return;
  const cache = await getTabMetaCache();
  cache[tab.id] = tabMeta(tab);
  await setTabMetaCache(cache);
}

async function seedTabMetaCache() {
  const tabs = await chrome.tabs.query({});
  const cache = await getTabMetaCache();
  for (const tab of tabs) {
    if (tab.id !== undefined && !tab.incognito) {
      cache[tab.id] = tabMeta(tab);
    }
  }
  await setTabMetaCache(cache);
}

async function logRemovedTab(tabId) {
  const cache = await getTabMetaCache();
  const meta = cache[tabId];
  if (meta) {
    delete cache[tabId];
    await setTabMetaCache(cache);
  }
  if (!meta || isNoiseUrl(meta.url)) return;

  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: meta.url,
    title: meta.title,
    closedTime: Date.now(),
  };
  if (meta.favIconUrl && /^https?:\/\//.test(meta.favIconUrl)) {
    entry.favIconUrl = meta.favIconUrl;
  }
  const result = await chrome.storage.local.get(CLOSED_TAB_LOG_KEY);
  const log = result[CLOSED_TAB_LOG_KEY] ?? [];
  await chrome.storage.local.set({
    [CLOSED_TAB_LOG_KEY]: [entry, ...log].slice(0, CLOSED_TAB_LOG_CAP),
  });
}

chrome.tabs.onCreated.addListener((tab) => {
  enqueue(() => upsertTabMeta(tab));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.title || changeInfo.favIconUrl) {
    enqueue(() => upsertTabMeta(tab));
  }
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  enqueue(async () => {
    const cache = await getTabMetaCache();
    delete cache[removedTabId];
    await setTabMetaCache(cache);
    const tab = await chrome.tabs.get(addedTabId);
    await upsertTabMeta(tab);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  enqueue(() => logRemovedTab(tabId));
});

// Runs after the synchronous listener registrations above, so on every service
// worker spin-up the seed is first in the queue — events that woke the worker
// execute after it and find the cache populated.
enqueue(seedTabMetaCache);
