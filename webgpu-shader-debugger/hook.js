/**
 * This script is injected directly into the page's main execution context.
 * It directly patches the GPUDevice.prototype to hook createShaderModule.
 * It reads its initial settings from the DOM to avoid race conditions,
 * and then listens for live updates via custom DOM events.
 */
(() => {
    // Styling for debug logs to make them stand out
    const LOG_STYLE_INFO = 'color: #0077cc; font-weight: bold;';
    const LOG_STYLE_SUCCESS = 'color: #22a522; font-weight: bold;';
    const LOG_STYLE_UPDATE = 'color: #ff8c00; font-weight: bold;';
    const LOG_STYLE_ERROR = 'color: #ff0000; font-weight: bold;';

    console.log('%c[WGSL Intercept] Hook script injected. Awaiting settings...', LOG_STYLE_INFO);

    // This script runs very early, so we need to ensure GPUDevice is defined.
    if (typeof GPUDevice === 'undefined') {
        console.error('%c[WGSL Intercept] GPUDevice not found. Cannot apply hook.', LOG_STYLE_ERROR);
        return;
    }

    // 1. Synchronously read the initial settings placed in the DOM by content.js
    let settings = {
        findText: document.documentElement.dataset.wgslFind || '',
        replaceText: document.documentElement.dataset.wgslReplace || '',
        logShaderWGSL: true
    };

    console.log(`%c[WGSL Intercept] Initial settings loaded from DOM:`, LOG_STYLE_INFO, settings);

    // 2. Listen for live updates dispatched by content.js
    window.addEventListener('wgsl_update_settings', (event) => {
        console.log(`%c[WGSL Intercept] Received "wgsl_update_settings" event!`, LOG_STYLE_UPDATE);
        if (event.detail) {
            settings.findText = event.detail.findText || '';
            settings.replaceText = event.detail.replaceText || '';
            settings.logShaderWGSL = event.detail.logShaderWGSL;
            console.log(`%c[WGSL Intercept] Settings updated live via event:`, LOG_STYLE_UPDATE, settings);
        } else {
            console.warn('[WGSL Intercept] Received update event, but no details were found.');
        }
    });
    console.log('%c[WGSL Intercept] Live update listener is active.', LOG_STYLE_INFO);


    const originalCreateShaderModule = GPUDevice.prototype.createShaderModule;
    if (typeof originalCreateShaderModule !== 'function') {
        console.error('%c[WGSL Intercept] Could not find original createShaderModule function to wrap!', LOG_STYLE_ERROR);
        return;
    }
    console.log('%c[WGSL Intercept] Successfully captured original createShaderModule function.', LOG_STYLE_INFO);


    GPUDevice.prototype.createShaderModule = function (descriptor) {
        // 'this' refers to the actual GPUDevice instance
        const device = this;

        // DEBUG LOG: Announce every intercepted call and show current settings.

        console.log(`%c[WGSL Intercept] Intercepted createShaderModule call. Current settings:`, LOG_STYLE_INFO, settings);

        if (descriptor && typeof descriptor.code === 'string') {
            const normalizeNewlines = (str) => {
                return str ? str.replace(/(\r\n|\r|\n)/g, '\n') : str;
            };

            const originalCode = normalizeNewlines(descriptor.code);
            if (settings.logShaderWGSL) {
                console.log('[WGSL Intercept] Original WGSL:\n', originalCode);
            }
            // Only attempt replacement if findText is not empty

            let findTextSanitized = normalizeNewlines(settings.findText);

            if (findTextSanitized && findTextSanitized.length > 0 && originalCode.includes(findTextSanitized)) {
                console.log('%c[WGSL Intercept] MATCH FOUND!', LOG_STYLE_SUCCESS);
                let replaceTextSanitized = normalizeNewlines(settings.replaceText);
                const modifiedCode = originalCode.replaceAll(findTextSanitized, replaceTextSanitized);

                console.log(`%c[WGSL Intercept] MODIFIED WGSL:\n`, LOG_STYLE_UPDATE, modifiedCode);

                const newDescriptor = { ...descriptor, code: modifiedCode };

                return originalCreateShaderModule.call(device, newDescriptor);
            } else {
                // DEBUG LOG: Explain why no replacement is happening
                if (!findTextSanitized || findTextSanitized.length === 0) {
                    console.log('[WGSL Intercept] No replacement: Find text is empty.');
                } else {
                    console.log(`[WGSL Intercept] No replacement: Shader code does not include "${findTextSanitized}".`);
                }
            }
        }

        // If no match, or if findText is empty, call the original function.
        return originalCreateShaderModule.call(device, descriptor);
    };

    console.log('%c[WGSL Intercept] Hook is active on GPUDevice.prototype.createShaderModule.', LOG_STYLE_SUCCESS);

})();

