/**
 * This script is the bridge between the service worker and the webpage.
 * It asks the service worker for the current settings on page load,
 * injects them into the DOM, and then injects the hook script.
 */
(async () => {
    console.log('[WGSL Intercept] Content script loaded.');

    // 1. Immediately ask the service worker for the current settings.
    const settings = await chrome.runtime.sendMessage({ action: 'get_settings' });
    const findText = settings.findText || '';
    const replaceText = settings.replaceText || '';

    // 2. Inject settings into the DOM via data attributes on the <html> element.
    document.documentElement.dataset.wgslFind = findText;
    document.documentElement.dataset.wgslReplace = replaceText;
    console.log('[WGSL Intercept] Injected initial settings from service worker into DOM.');

    // 3. Inject the hook script into the page.
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('hook.js');
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
    console.log('[WGSL Intercept] Injected hook.js into the page.');


    // 4. Listen for live update messages from the popup.
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'update_settings') {
            console.log('[WGSL Intercept] Received live update from popup.');
            const newSettings = message.data;
            document.documentElement.dataset.wgslFind = newSettings.findText;
            document.documentElement.dataset.wgslReplace = newSettings.replaceText;
            window.dispatchEvent(new CustomEvent('wgsl_update_settings', { detail: newSettings }));
        }
    });
})();

