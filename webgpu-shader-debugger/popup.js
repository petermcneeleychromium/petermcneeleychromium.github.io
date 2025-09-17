/**
 * This script controls the UI of the extension's popup.
 * It is loaded with 'defer' to ensure the DOM is ready before it runs.
 * It sends messages to the service worker and content script.
 */

// Since the script is deferred, we can be sure these elements exist when this code runs.
const findInput = document.getElementById('find-text');
const replaceInput = document.getElementById('replace-text');
const logShaderWGSLInput = document.getElementById('log-shader-wgsl');
const saveButton = document.getElementById('save-button');
const statusDiv = document.getElementById('status');

console.log('Popup script loaded. Elements:', { findInput, replaceInput, saveButton });

// Load saved settings from the service worker when the popup opens
chrome.runtime.sendMessage({ action: 'get_settings' }, (result) => {
    if (chrome.runtime.lastError) {
        console.error('Error getting settings:', chrome.runtime.lastError.message);
        return;
    }
    console.log('Received settings from service worker:', result);
    if (findInput && result.findText) {
        findInput.value = result.findText;
    }
    if (replaceInput && result.replaceText) {
        replaceInput.value = result.replaceText;
    }
    if (logShaderWGSLInput && result.logShaderWGSL != undefined) {
        logShaderWGSLInput.checked = result.logShaderWGSL;
    }
});

// Add click listener only if the button was found
if (saveButton) {
    saveButton.addEventListener('click', () => {
        console.log('Save button clicked.');
        const findText = findInput.value;
        const replaceText = replaceInput.value;
        const logShaderWGSL = logShaderWGSLInput.checked;
        const newSettings = { findText, replaceText,logShaderWGSL };

        // 1. Save settings to the service worker for persistence
        chrome.runtime.sendMessage({ action: 'set_settings', data: newSettings }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error setting settings:', chrome.runtime.lastError.message);
                return;
            }
            if (response && response.status === 'success') {
                console.log('Settings successfully sent to service worker.');
                statusDiv.textContent = 'Settings saved!';
                setTimeout(() => statusDiv.textContent = '', 2000);
            }
        });

        // 2. Send a message to the active tab's content script for a live update
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'update_settings',
                    data: newSettings
                }, (response) => {
                    if (chrome.runtime.lastError) {
                         console.error('Could not send live update to content script:', chrome.runtime.lastError.message);
                    } else {
                         console.log('Live update message sent to content script.');
                    }
                });
            }
        });
    });
} else {
    console.error('Save button not found in the DOM.');
}

