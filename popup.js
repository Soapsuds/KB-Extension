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

// popup.js
document.getElementById('copyBtn').addEventListener('click', async () => {
    const statusMsg = document.getElementById('statusMsg');
    
    // 1. Find the active SendPro tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) return;

    // 2. Send a message to content.js asking for the list
    chrome.tabs.sendMessage(tab.id, { action: "GET_PROCESSED_NAMES" }, (response) => {
        if (chrome.runtime.lastError || !response) {
            statusMsg.innerText = "Error: Is SendPro open?";
            return;
        }

        // 3. Write the returned string to the clipboard
        navigator.clipboard.writeText(response.data).then(() => {
            const btn = document.getElementById('copyBtn');
            btn.innerText = "Copied!";
            statusMsg.innerText = `Copied ${response.count} names to clipboard.`;
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                btn.innerText = "Copy Names List";
                statusMsg.innerText = "";
            }, 2000);
        });
    });
});
