/**
 * Toast overlay for NotebookLM
 * Creates a lightweight toast notification that stays visible even when switching tabs
 * and doesn't rely on NotebookLM's DOM structure.
 */

// Toast and overlay management
let toastElement = null;
let overlayElement = null;

/**
 * Creates and shows a toast notification
 * @param {string} message - The message to display in the toast
 * @param {string} iconType - The type of icon to show: 'spinner', 'success', 'error', or 'none'
 */
function showToast(message, iconType = 'spinner') {
    // Remove existing toast if present
    if (toastElement?.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
    }

    // Create toast element
    toastElement = document.createElement('div');
    toastElement.id = 'web-tldr-toast';

    // Set toast styles - positioned at bottom-right
    Object.assign(toastElement.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        maxWidth: '300px',
        display: 'flex',
        alignItems: 'center',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0'
    });

    // Create message element
    const messageElement = document.createElement('span');
    messageElement.textContent = message;

    // Add icon based on iconType
    if (iconType !== 'none') {
        // Create icon element
        const icon = document.createElement('div');
        icon.className = `web-tldr-${iconType}`;

        // Add styles based on icon type
        if (iconType === 'spinner') {
            Object.assign(icon.style, {
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: 'white',
                marginRight: '10px',
                animation: 'web-tldr-spin 1s linear infinite'
            });

            // Add spinner animation if not already added
            if (!document.getElementById('web-tldr-spinner-style')) {
                const style = document.createElement('style');
                style.id = 'web-tldr-spinner-style';
                style.textContent = `
                    @keyframes web-tldr-spin {
                        to { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        } else if (iconType === 'success') {
            Object.assign(icon.style, {
                width: '16px', height: '16px', marginRight: '10px', position: 'relative'
            });

            // Create checkmark
            icon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#4CAF50" stroke-width="2"/>
                    <path d="M5 8L7 10L11 6" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
        } else if (iconType === 'error') {
            Object.assign(icon.style, {
                width: '16px', height: '16px', marginRight: '10px', position: 'relative'
            });

            // Create X mark
            icon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#F44336" stroke-width="2"/>
                    <path d="M5.5 5.5L10.5 10.5M5.5 10.5L10.5 5.5" stroke="#F44336" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
        }

        toastElement.appendChild(icon);
    }

    // Add a message to toast
    toastElement.appendChild(messageElement);

    // Add toast to the body
    document.body.appendChild(toastElement);

    // Fade in the toast
    setTimeout(() => {
        toastElement.style.opacity = '1';
    }, 10);
}

/**
 * Updates the message in an existing toast
 * @param {string} message - The new message to display
 * @param {string} iconType - Optional icon type to update ('spinner', 'success', 'error', or 'none')
 */
function updateToast(message, iconType = null) {
    // Check if the message indicates a success or error to automatically set the icon type
    if (iconType === null) {
        if (message.includes("successfully")) {
            iconType = 'success';
        } else if (message.includes("error") || message.includes("Error")) {
            iconType = 'error';
        } else {
            iconType = 'spinner';
        }
    }

    if (!toastElement) {
        showToast(message, iconType);
        return;
    }
    // Update message text
    const messageElement = toastElement.querySelector('span');
    if (messageElement) {
        messageElement.textContent = message;
    }

    // Update icon if iconType is provided
    if (!iconType || iconType === 'none') {
        return;
    }
    const existingIcon = toastElement.querySelector('div[class^="web-tldr-"]');
    if (existingIcon) {
        existingIcon.remove();
    }
    const icon = document.createElement('div');
    icon.className = `web-tldr-${iconType}`;
    if (iconType === 'spinner') {
        Object.assign(icon.style, {
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'white',
            marginRight: '10px',
            animation: 'web-tldr-spin 1s linear infinite'
        });
    } else if (iconType === 'success') {
        Object.assign(icon.style, {
            width: '16px', height: '16px', marginRight: '10px', position: 'relative'
        });

        icon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#4CAF50" stroke-width="2"/>
                    <path d="M5 8L7 10L11 6" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
    } else if (iconType === 'error') {
        Object.assign(icon.style, {
            width: '16px', height: '16px', marginRight: '10px', position: 'relative'
        });

        icon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#F44336" stroke-width="2"/>
                    <path d="M5.5 5.5L10.5 10.5M5.5 10.5L10.5 5.5" stroke="#F44336" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
    }
    toastElement.insertBefore(icon, messageElement);
}

/**
 * Removes the toast after a specified duration
 * @param {number} duration - Milliseconds to wait before removing the toast
 */
function removeToast(duration = 0) {
    if (!toastElement) return;

    if (duration > 0) {
        setTimeout(() => removeToastNow(), duration);
    } else {
        removeToastNow();
    }
}

/**
 * Removes the toast immediately
 */
function removeToastNow() {
    if (!toastElement) return;

    toastElement.style.opacity = '0';
    setTimeout(() => {
        if (toastElement?.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
            toastElement = null;
        }
    }, 300);
}

/**
 * Creates and shows a full-page overlay
 */
function showOverlay() {
    // Remove existing overlay if present
    if (overlayElement?.parentNode) {
        overlayElement.parentNode.removeChild(overlayElement);
    }

    // Create overlay element
    overlayElement = document.createElement('div');
    overlayElement.id = 'web-tldr-overlay';

    // Set overlay styles
    Object.assign(overlayElement.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: '9998',
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease-in-out',
        opacity: '0'
    });

    // Add overlay to body
    document.body.appendChild(overlayElement);

    // Fade in the overlay
    setTimeout(() => {
        overlayElement.style.opacity = '1';
    }, 10);
}

/**
 * Removes the overlay
 */
function removeOverlay() {
    if (!overlayElement) return;

    overlayElement.style.opacity = '0';
    setTimeout(() => {
        if (overlayElement?.parentNode) {
            overlayElement.parentNode.removeChild(overlayElement);
            overlayElement = null;
        }
    }, 300);
}

/**
 * Wait for an element to appear in the DOM with timeout.
 * @param {string} selector The CSS selector.
 * @param {number} timeout Milliseconds to wait before giving up.
 * @returns {Promise<Element|null>}
 */
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
        let resolved = false;
        let timeoutId;

        const resolveOnce = (value) => {
            if (!resolved) {
                resolved = true;
                resolve(value);
            }
        };

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                if (timeoutId) clearTimeout(timeoutId);
                resolveOnce(element);
            }
        });

        // Check immediately in case it's already there
        const initialElement = document.querySelector(selector);
        if (initialElement) {
            return resolveOnce(initialElement);
        }

        observer.observe(document.body, {childList: true, subtree: true});

        // Timeout logic
        timeoutId = setTimeout(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolveOnce(element);
            } else {
                observer.disconnect();
                console.log(`Timeout: Element "${selector}" not found after ${timeout}ms, but continuing execution.`);
                resolveOnce(null);
            }
        }, timeout);
    });
}

// --- Title management for better tab readability ---
let __webTldrOriginalTitle = document.title;
let __webTldrSourceTitle = null;

function getReadableSourceTitle(url, injectedTitle) {
    if (injectedTitle && injectedTitle.trim()) return injectedTitle.trim();
    try {
        const u = new URL(url);
        // Use pathname hint if available
        const path = u.pathname && u.pathname !== '/' ? decodeURIComponent(u.pathname).split('/').filter(Boolean).slice(-1)[0] : '';
        const host = u.hostname.replace(/^www\./, '');
        const guess = path ? `${host} • ${path}` : host;
        return guess;
    } catch (_) {
        return url;
    }
}

function setNotebookTitle(status) {
    // status: 'loading' | 'importing' | 'generating' | 'success' | 'error'
    const emojis = {
        loading: '⏳',
        importing: '⏳',
        generating: '✨',
        success: '✅',
        error: '⚠️'
    };
    const emoji = emojis[status] || '';
    const source = __webTldrSourceTitle || 'Page';
    // Keep the NotebookLM brand last so multiple tabs group nicely by source
    document.title = `${emoji} ${source} – NotebookLM`;
}

async function importAndSummarizeWebpage() {
    // Prefer URL passed via injected variable to avoid race conditions; fall back to storage for backward compatibility
    let url = typeof window !== 'undefined' ? window.__web_tldr_url : undefined;
    if (!url) {
        try {
            const data = await chrome.storage.local.get('urlToSummarize');
            url = data.urlToSummarize;
        } catch (_) {
            /* ignore */
        }
    }
    // Compute source title as early as possible
    __webTldrSourceTitle = getReadableSourceTitle(url || location.href, typeof window !== 'undefined' ? window.__web_tldr_source_title : null);

    // Show overlay and initial toast
    showOverlay();
    showToast("Web TL;DR: Starting summarization process...");
    setNotebookTitle('loading');

    if (!url) {
        console.error("URL not found for summarization. Aborting.");
        updateToast("Error: URL not found. Please try again.");
        removeToast(5000);
        removeOverlay();
        return;
    }

    try {
        updateToast("Web TL;DR: Opening Add Source menu...");

        // Click the "+ Add Source" button
        const addSourceButton = await waitForElement('button:not([disabled]).create-new-button');
        addSourceButton.click();
        updateToast("Web TL;DR: Selecting Website option...");

        // Click the "Website" option from the menu
        const websiteOption = await waitForElement('#mat-mdc-chip-2');
        websiteOption.click();
        updateToast(`Web TL;DR: Adding URL: ${url.substring(0, 30)}${url.length > 30 ? '...' : ''}`);

        // Find the input, paste the URL, and click import
        const urlInput = await waitForElement('textarea[formcontrolname="newUrl"]');
        urlInput.value = url;
        urlInput.dispatchEvent(new Event('input', {bubbles: true}));
        updateToast("Web TL;DR: Importing webpage...");
        setNotebookTitle('importing');

        const importButton = await waitForElement('button:not([disabled]).submit-button');
        importButton.closest('button').click();

        // Clean up a legacy storage key only if it matches our URL (backward compatibility)
        try {
            const existing = await chrome.storage.local.get('urlToSummarize');
            if (existing && existing.urlToSummarize === url) {
                await chrome.storage.local.remove('urlToSummarize');
            }
        } catch (_) {
            /* ignore */
        }
        updateToast("Web TL;DR: Waiting for page to load...");

        const promptTextarea = await waitForElement('textarea.query-box-input');

        // Only run if the textarea is empty to avoid issues on reloads
        if (promptTextarea.value === "") {
            // Get the prompt text from settings, default to "TL;DR" if not set
            const promptData = await chrome.storage.local.get({promptText: 'TL;DR'});
            const promptText = promptData.promptText;

            updateToast(`Web TL;DR: Entering "${promptText}" prompt...`);
            promptTextarea.value = promptText;
            promptTextarea.dispatchEvent(new Event('input', {bubbles: true}));

            // Wait for the submitting button to become enabled
            let submitButton = await waitForElement('button:not([disabled]).submit-button');

            // Brief pause to ensure the UI thread is ready
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Click the submitting button repeatedly until the textarea is empty
            updateToast("Web TL;DR: Generating summary...");
            setNotebookTitle('generating');
            const maxAttempts = 20;
            let attempts = 0;

            while (promptTextarea.value !== "" && attempts < maxAttempts) {
                submitButton = await waitForElement('button:not([disabled]).submit-button');
                submitButton.click();
                attempts++;

                // Wait for the UI to update
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            updateToast("Web TL;DR: Summary generated successfully!");
            setNotebookTitle('success');
            removeToast(2000);
            removeOverlay();
        } else {
            updateToast("Web TL;DR: Page imported successfully!");
            setNotebookTitle('success');
            removeToast(2000);
            removeOverlay();
        }
    } catch (error) {
        console.error("[Web TL;DR for NotebookLM - controller] An error occurred:", error);
        updateToast(`Web TL;DR: An error occurred. Please try again.`);
        setNotebookTitle('error');
        removeToast(5000);
        removeOverlay();
    }
}

setTimeout(importAndSummarizeWebpage, 0);
