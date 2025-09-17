// This script runs in the background and holds the settings in memory.
// This allows the settings to persist across page reloads without using storage.

let currentSettings = {
  findText: '',
  replaceText: '',
  logShaderWGSL: false
};

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'set_settings') {
    // Message from the popup to save new settings
    currentSettings = message.data;
    console.log('[Service Worker] Settings updated:', currentSettings);
    sendResponse({ status: 'success' });
  } else if (message.action === 'get_settings') {
    // Message from the content script on page load to get the current settings
    console.log('[Service Worker] Sending settings to content script:', currentSettings);
    sendResponse(currentSettings);
  }
  // Return true to indicate you wish to send a response asynchronously
  return true; 
});

