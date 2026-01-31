// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-tab-cluster') {
    openTabCluster();
  }
});

// Open the tab cluster page
function openTabCluster() {
  const managerUrl = chrome.runtime.getURL('manager/index.html');

  // Check if tab cluster is already open
  chrome.tabs.query({ url: managerUrl }, (tabs) => {
    if (tabs.length > 0) {
      // Focus existing tab
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      // Open new tab
      chrome.tabs.create({ url: managerUrl });
    }
  });
}
