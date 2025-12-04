/**
 * Toast overlay for NotebookLM
 * Creates a lightweight toast notification that stays visible even when switching tabs
 * and doesn't rely on NotebookLM's DOM structure.
 */

// i18n helper
function i18n(key, subs, fallback = '') {
  try {
    const msg = chrome?.i18n?.getMessage?.(key, subs);
    return msg?.trim() ? msg : fallback || '';
  } catch (err) {
    console.warn('i18n.getMessage failed', { key, subs, err });
    return fallback || '';
  }
}

// Helper for toast messages to prepend brand prefix consistently
function toastI18n(key, subs, fallback = '') {
  const prefix = i18n('brandPrefix', null, 'Web TL;DR:');
  const body = i18n(key, subs, fallback);
  return `${prefix} ${body}`.trim();
}

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
    toastElement.remove();
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
    opacity: '0',
  });

  // Create a message element
  const messageElement = document.createElement('span');
  messageElement.textContent = message;

  // Add icon based on iconType
  if (iconType !== 'none') {
    // Create icon element
    /** @type {HTMLDivElement} */
    const icon = document.createElement('div');
    icon.className = `web-tldr-${iconType}`;

    // Add styles based on an icon type
    if (iconType === 'spinner') {
      Object.assign(icon.style, {
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTopColor: 'white',
        marginRight: '10px',
        animation: 'web-tldr-spin 1s linear infinite',
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
        width: '16px',
        height: '16px',
        marginRight: '10px',
        position: 'relative',
      });

      // Create checkmark
      icon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#4CAF50" stroke-width="2"/>
                    <path d="M5 8L7 10L11 6" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
    } else if (iconType === 'error') {
      Object.assign(icon.style, {
        width: '16px',
        height: '16px',
        marginRight: '10px',
        position: 'relative',
      });

      // Create X mark
      icon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
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
 * @param {string|null} iconType - Optional icon type to update ('spinner', 'success', 'error', or 'none')
 */
function updateToast(message, iconType = null) {
  // Check if the message indicates a success or error to automatically set the icon type
  if (iconType === null) {
    if (message.includes('successfully')) {
      iconType = 'success';
    } else if (message.includes('error') || message.includes('Error')) {
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
  /** @type {HTMLDivElement} */
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
      animation: 'web-tldr-spin 1s linear infinite',
    });
  } else if (iconType === 'success') {
    Object.assign(icon.style, {
      width: '16px',
      height: '16px',
      marginRight: '10px',
      position: 'relative',
    });

    icon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#4CAF50" stroke-width="2"/>
                    <path d="M5 8L7 10L11 6" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
  } else if (iconType === 'error') {
    Object.assign(icon.style, {
      width: '16px',
      height: '16px',
      marginRight: '10px',
      position: 'relative',
    });

    icon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="#F44336" stroke-width="2"/>
                    <path d="M5.5 5.5L10.5 10.5M5.5 10.5L10.5 5.5" stroke="#F44336" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
  }
  messageElement.before(icon);
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
      toastElement.remove();
      toastElement = null;
    }
  }, 300);
}

/**
 * Creates and shows a full-page overlay
 */
function showOverlay() {
  // Remove the existing overlay if present
  if (overlayElement?.parentNode) {
    overlayElement.remove();
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
    opacity: '0',
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
      overlayElement.remove();
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

    observer.observe(document.body, { childList: true, subtree: true });

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

/**
 * Wait until the Notebook title (h1.notebook-title) changes from a given initial value.
 * Falls back to timeout if it doesn't change in time.
 * @param {string|null} initialTitle The initial title textContent to compare against.
 * @param {number} timeout Milliseconds to wait before giving up.
 */
function waitForNotebookTitleChange(initialTitle, timeout = 10000) {
  return new Promise((resolve) => {
    const finish = () => resolve();

    // If we don't have an initial title, just resolve after a short tick to avoid blocking
    if (typeof initialTitle !== 'string') {
      return setTimeout(finish, 0);
    }

    const titleElement = document.querySelector('h1.notebook-title');
    // If already changed, resolve immediately
    if (titleElement && titleElement.textContent !== initialTitle) {
      return finish();
    }

    let timeoutId = setTimeout(() => {
      observer.disconnect();
      finish(); // Give up but continue
    }, timeout);

    const observer = new MutationObserver(() => {
      const titleElement = document.querySelector('h1.notebook-title');
      if (!titleElement) return;
      const current = titleElement.textContent;
      if (current !== initialTitle) {
        clearTimeout(timeoutId);
        observer.disconnect();
        finish();
      }
    });

    // Observe changes in the subtree where the title might live
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
}

// --- Title management for better tab readability ---
let __webTldrSourceTitle = null;

function getReadableSourceTitle(url, injectedTitle) {
  if (injectedTitle?.trim()) return injectedTitle.trim();
  try {
    const u = new URL(url);
    // Use pathname hint if available
    const path = u.pathname && u.pathname !== '/' ? decodeURIComponent(u.pathname).split('/').findLast(Boolean) : '';
    const host = u.hostname.replace(/^www\./, '');
    return path ? `${host} • ${path}` : host;
  } catch (err) {
    console.error('Error parsing URL:', err);
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
    error: '⚠️',
  };
  const emoji = emojis[status] || '';
  const source = __webTldrSourceTitle || i18n('titleSourceFallback', null, 'Page');
  // Keep the NotebookLM brand last so multiple tabs group nicely by source
  const brand = i18n('brandNotebookLM', null, 'NotebookLM');
  document.title = `${emoji} ${source} – ${brand}`;
}

// Shared post-import flow for both URL and Text sources
async function handlePromptAndGenerate() {
  updateToast(toastI18n('toastWaitingLoad', null, 'Waiting for page to load...'));

  const promptTextarea = await waitForElement('textarea.query-box-input');

  // Only run if the textarea is empty to avoid issues on reloads
  if (promptTextarea.value === '') {
    // Capture the initial notebook title using waitForElement to ensure existence
    const titleElement = await waitForElement('h1.notebook-title', 10000);
    const initialNotebookTitle = titleElement?.textContent ?? null;

    // Get the prompt text from settings, default to "TL;DR" if not set
    const promptData = await chrome.storage.local.get({ promptText: i18n('promptDefault', null, 'TL;DR') });
    const promptText = promptData.promptText;

    updateToast(toastI18n('toastEnteringPrompt', [promptText], `Entering "${promptText}" prompt...`));
    promptTextarea.value = promptText;
    promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for the submitting button to become enabled
    /** @type {HTMLButtonElement} */
    let submitButton = await waitForElement('button:not([disabled]).submit-button');

    // Wait until the notebook title changes from the initial value instead of a fixed sleep
    await waitForNotebookTitleChange(initialNotebookTitle, 15000);

    // The new title is the source title, so grab it for the tab title
    __webTldrSourceTitle = document.querySelector('h1.notebook-title')?.textContent || __webTldrSourceTitle;

    // Click the submitting button repeatedly until the textarea is empty
    updateToast(toastI18n('toastGenerating', null, 'Generating summary...'));
    setNotebookTitle('generating');
    const maxAttempts = 20;
    let attempts = 0;

    while (promptTextarea.value !== '' && attempts < maxAttempts) {
      submitButton = await waitForElement('button:not([disabled]).submit-button');
      submitButton.click();
      attempts++;

      // Wait for the UI to update
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Wait for the loading indicator to appear and then disappear before announcing success
    try {
      await waitForAppearanceThenDisappearance('div > div.thinking-animation', 60000, 300000);
    } catch (err) {
      console.error('Loading indicator not found:', err);
    }

    updateToast(toastI18n('toastSummarySuccess', null, 'Summary generated successfully!'));
    setNotebookTitle('success');
    removeToast(2000);
    removeOverlay();
  } else {
    updateToast(toastI18n('toastImportSuccess', null, 'Page imported successfully!'));
    setNotebookTitle('success');
    removeToast(2000);
    removeOverlay();
  }
}

async function importAndSummarizeSelectedText(selectedText, injectedTitle) {
  // Compute source title from snippet
  const snippet = (selectedText || '').trim();
  __webTldrSourceTitle =
    injectedTitle?.trim() || snippet.length > 80
      ? snippet.slice(0, 77) + '…'
      : snippet || i18n('titleSourceFallback', null, 'Page');
  showOverlay();
  showToast(toastI18n('toastStarting', null, 'Starting summarization process...'));
  setNotebookTitle('loading');

  try {
    updateToast(toastI18n('toastOpeningAddSource', null, 'Opening Add Source menu...'));
    /** @type {HTMLButtonElement} */
    const addSourceButton = await waitForElement('button:not([disabled]).create-new-button');
    addSourceButton.click();

    // Click the "Website" option from the menu

    // Try to select the "Text" option
    updateToast(toastI18n('toastSelectingText', null, 'Selecting Text option...'));
    /** @type {HTMLButtonElement} */
    const textOption = await waitForElement('#mat-mdc-chip-3');
    textOption.click();

    updateToast(
      toastI18n(
        'toastAddingText',
        [snippet.length > 30 ? snippet.slice(0, 27) + '…' : snippet],
        'Adding selected text...'
      )
    );
    const textInput = await waitForElement('textarea#mat-input-1');
    textInput.value = selectedText;
    textInput.dispatchEvent(new Event('input', { bubbles: true }));

    setNotebookTitle('importing');
    const importButton = await waitForElement('button:not([disabled]).mat-primary.mat-mdc-unelevated-button');
    importButton.closest('button').click();

    // Clear storage keys if present
    try {
      await chrome.storage.local.remove(['selectedTextToSummarize', 'selectedTextSourceTitle']);
    } catch (err) {
      console.error('Error clearing storage keys:', err);
    }

    await handlePromptAndGenerate();
  } catch (error) {
    console.error('[Web TL;DR for NotebookLM - controller] Text flow error:', error);
    updateToast(toastI18n('toastGenericError', null, 'An error occurred. Please try again.'));
    setNotebookTitle('error');
    removeToast(5000);
    removeOverlay();
  }
}

async function importAndSummarizeWebpage() {
  // Prefer URL passed via injected variable to avoid race conditions; fall back to storage for backward compatibility
  let url = globalThis?.__web_tldr_url;
  if (!url) {
    try {
      const data = await chrome.storage.local.get('urlToSummarize');
      url = data.urlToSummarize;
    } catch (err) {
      console.error('Error retrieving URL from storage:', err);
    }
  }
  // Compute source title as early as possible
  __webTldrSourceTitle = getReadableSourceTitle(url || location.href, globalThis?.__web_tldr_source_title);

  // Show overlay and initial toast
  showOverlay();
  showToast(toastI18n('toastStarting', null, 'Starting summarization process...'));
  setNotebookTitle('loading');

  if (!url) {
    console.error('URL not found for summarization. Aborting.');
    updateToast(i18n('errorUrlNotFound', null, 'Error: URL not found. Please try again.'));
    removeToast(5000);
    removeOverlay();
    return;
  }

  try {
    updateToast(toastI18n('toastOpeningAddSource', null, 'Opening Add Source menu...'));

    // Click the "+ Add Source" button
    /** @type {HTMLButtonElement} */
    const addSourceButton = await waitForElement('button:not([disabled]).create-new-button');
    addSourceButton.click();
    updateToast(toastI18n('toastSelectingWebsite', null, 'Selecting Website option...'));

    // Click the "Website" option from the menu
    /** @type {HTMLButtonElement} */
    const websiteOption = await waitForElement('#mat-mdc-chip-1');
    websiteOption.click();
    updateToast(
      toastI18n(
        'toastAddingUrl',
        [`${url.substring(0, 30)}${url.length > 30 ? '...' : ''}`],
        `Adding URL: ${url.substring(0, 30)}${url.length > 30 ? '...' : ''}`
      )
    );

    // Find the input, paste the URL, and click import
    const urlInput = await waitForElement('textarea[formcontrolname="newUrl"]');
    urlInput.value = url;
    urlInput.dispatchEvent(new Event('input', { bubbles: true }));
    updateToast(toastI18n('toastImporting', null, 'Importing webpage...'));
    setNotebookTitle('importing');

    const importButton = await waitForElement('button:not([disabled]).submit-button');
    importButton.closest('button').click();

    // Clean up a legacy storage key only if it matches our URL (backward compatibility)
    try {
      const existing = await chrome.storage.local.get('urlToSummarize');
      if (existing && existing.urlToSummarize === url) {
        await chrome.storage.local.remove('urlToSummarize');
      }
    } catch (err) {
      console.error('Error cleaning up legacy storage key:', err);
    }
    await handlePromptAndGenerate();
  } catch (error) {
    console.error('[Web TL;DR for NotebookLM - controller] An error occurred:', error);
    updateToast(toastI18n('toastGenericError', null, 'An error occurred. Please try again.'));
    setNotebookTitle('error');
    removeToast(5000);
    removeOverlay();
  }
}

async function __webTldrStart() {
  try {
    const { selectedTextToSummarize = null, selectedTextSourceTitle = null } = await chrome.storage.local.get({
      selectedTextToSummarize: null,
      selectedTextSourceTitle: null,
    });
    if (selectedTextToSummarize?.trim()) {
      const injectedTitle = globalThis?.__web_tldr_source_title || selectedTextSourceTitle;
      await importAndSummarizeSelectedText(selectedTextToSummarize, injectedTitle);
    } else {
      await importAndSummarizeWebpage();
    }
  } catch (e) {
    console.error('[Web TL;DR for NotebookLM - controller] Start failed, falling back to URL flow', e);
    await importAndSummarizeWebpage();
  }
}

setTimeout(__webTldrStart, 0);

/**
 * Wait for an element to first appear, then disappear.
 * This helps avoid detecting the absence too early when the element will show briefly.
 * @param {string} selector CSS selector of the element to observe
 * @param {number} appearTimeout How long to wait for initial appearance (ms)
 * @param {number} disappearTimeout How long to wait for a disappearance after it appears (ms)
 * @returns {Promise<boolean>} true if full cycle observed, false on timeout but continues
 */
async function waitForAppearanceThenDisappearance(selector, appearTimeout = 60000, disappearTimeout = 300000) {
  try {
    // Wait for the element to appear at least once
    const appeared = await waitForElement(selector, appearTimeout);
    if (!appeared) {
      console.log(
        `[Web TL;DR] waitForAppearanceThenDisappearance: '${selector}' did not appear within ${appearTimeout}ms. Proceeding.`
      );
      return false;
    }

    // Once it has appeared, wait for it to disappear
    if (!document.querySelector(selector)) {
      // Already gone by the time we check
      return true;
    }

    return await new Promise((resolve) => {
      let resolved = false;
      const resolveOnce = (val) => {
        if (!resolved) {
          resolved = true;
          resolve(val);
        }
      };

      const observer = new MutationObserver(() => {
        const exists = document.querySelector(selector);
        if (!exists) {
          observer.disconnect();
          resolveOnce(true);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
        console.log(
          `[Web TL;DR] waitForAppearanceThenDisappearance: '${selector}' did not disappear within ${disappearTimeout}ms. Proceeding.`
        );
        resolveOnce(false);
      }, disappearTimeout);

      // Also, poll quickly in case the mutation doesn’t fire for removals outside the observed subtree (defensive)
      const pollInterval = setInterval(() => {
        if (!document.querySelector(selector)) {
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          observer.disconnect();
          resolveOnce(true);
        }
      }, 250);
    });
  } catch (e) {
    console.warn('[Web TL;DR] waitForAppearanceThenDisappearance failed', e);
    return false;
  }
}
