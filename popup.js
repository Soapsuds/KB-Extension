const btn = document.getElementById("toggleBtn");

// Get current state
chrome.storage.local.get(["enabled"], (result) => {
  updateUI(!!result.enabled);
});

btn.addEventListener("click", () => {
  chrome.storage.local.get(["enabled"], (result) => {
    const newState = !result.enabled;
    chrome.storage.local.set({ enabled: newState }, () => {
      updateUI(newState);
    });
  });
});

function updateUI(isEnabled) {
  btn.textContent = isEnabled ? "Automation: ON" : "Automation: OFF";
  btn.className = isEnabled ? "on" : "off";
}
