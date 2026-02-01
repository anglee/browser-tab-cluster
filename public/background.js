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
