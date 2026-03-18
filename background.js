chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-automation") {
    chrome.storage.local.get(["enabled"], (result) => {
      chrome.storage.local.set({ enabled: !result.enabled });
    });
  }
});
