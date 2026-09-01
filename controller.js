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

// Guards against huge payloads reaching the DOM; the line clamp is what bounds the visible height
const TOAST_DETAIL_MAX_LENGTH = 120;

/**
 * Renders the secondary detail line of a toast, clamped to two lines with the full text on hover
 * @param {HTMLElement} body - The toast body column
 * @param {string} detail - The detail text, or an empty value to remove the line
 */
function setToastDetail(body, detail) {
  const existing = body.querySelector('#web-tldr-toast-detail');
  if (!detail) {
    existing?.remove();
    return;
  }

  const element = existing ?? document.createElement('div');
  if (!existing) {
    element.id = 'web-tldr-toast-detail';
    Object.assign(element.style, {
      marginTop: '6px',
      padding: '4px 8px',
      borderRadius: '6px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.72)',
      fontSize: '12px',
      lineHeight: '1.4',
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: '2',
      overflow: 'hidden',
      wordBreak: 'break-word',
    });
    body.appendChild(element);
  }

  element.textContent =
    detail.length > TOAST_DETAIL_MAX_LENGTH ? `${detail.slice(0, TOAST_DETAIL_MAX_LENGTH - 1)}…` : detail;
  element.title = detail;
}

/**
 * Creates and shows a toast notification
 * @param {string} message - The message to display in the toast
 * @param {string} iconType - The type of icon to show: 'spinner', 'success', 'error', or 'none'
 * @param {string} detail - Optional detail text shown on its own clamped line
 */
function showToast(message, iconType = 'spinner', detail = '') {
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
    alignItems: 'flex-start',
    transition: 'opacity 0.3s ease-in-out',
    opacity: '0',
  });

  // Stack the message and the optional detail line in a column beside the icon
  const body = document.createElement('div');
  body.style.minWidth = '0';

  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  body.appendChild(messageElement);

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

    Object.assign(icon.style, { marginTop: '2px', flex: 'none' });
    toastElement.appendChild(icon);
  }

  // Add a message to toast
  toastElement.appendChild(body);
  setToastDetail(body, detail);

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
 * @param {string} iconType - Icon type to show ('spinner', 'success', 'error', or 'none')
 * @param {string} detail - Optional detail text; an empty value clears the existing detail line
 */
function updateToast(message, iconType = 'spinner', detail = '') {
  if (!toastElement) {
    showToast(message, iconType, detail);
    return;
  }
  // Update message text
  const messageElement = toastElement.querySelector('span');
  if (messageElement) {
    messageElement.textContent = message;
    setToastDetail(messageElement.parentElement, detail);
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
  Object.assign(icon.style, { marginTop: '2px', flex: 'none' });
  toastElement.prepend(icon);
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
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
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
 * Wait for any element to matching a list of predicate functions.
 * @param {Array<() => Element|null>} predicates List of functions that return an element if found.
 * @param {number} timeout Milliseconds to wait before giving up.
 * @returns {Promise<Element|null>}
 */
function waitForAnyElement(predicates, timeout = 10000) {
  return new Promise((resolve) => {
    let resolved = false;
    let timeoutId;

    const resolveOnce = (value) => {
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    };

    const checkPredicates = () => {
      for (const predicate of predicates) {
        const element = predicate();
        if (element) {
          observer.disconnect();
          if (timeoutId) clearTimeout(timeoutId);
          resolveOnce(element);
          return true;
        }
      }
      return false;
    };

    const observer = new MutationObserver(() => {
      if (checkPredicates()) return;
    });

    // Check immediately in case it's already there
    if (checkPredicates()) return;

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['disabled', 'class', 'aria-disabled'],
    });

    // Timeout logic
    timeoutId = setTimeout(() => {
      if (checkPredicates()) return;
      observer.disconnect();
      console.log(`Timeout: No matching element found after ${timeout}ms, but continuing execution.`);
      resolveOnce(null);
    }, timeout);
  });
}

/**
 * Wait for an element to appear in the DOM with timeout.
 * @param {string} selector The CSS selector.
 * @param {number} timeout Milliseconds to wait before giving up.
 * @returns {Promise<Element|null>}
 */
function waitForElement(selector, timeout = 10000) {
  return waitForAnyElement([() => document.querySelector(selector)], timeout);
}

const COPIED_TEXT_LABELS = ['Text', 'Copied text', 'Copied Text', '文字', '複製的文字', '复制的文字'];

function findSourceOption(labels, iconName) {
  const buttons = Array.from(document.querySelectorAll('div.drop-zone-actions > button'));
  const byIcon = buttons.find((button) => {
    if (button.offsetParent === null) return false;

    return Array.from(button.querySelectorAll('mat-icon'))
      .some((icon) => icon.textContent.trim() === iconName);
  });
  if (byIcon) return byIcon;

  const label = Array.from(document.querySelectorAll('span'))
    .find((span) => labels.includes(span.textContent.trim()) && span.offsetParent !== null);
  return label ? (label.closest('button') || label) : null;
}

function isPlayBooksSourceButton(element) {
  if (!element) return false;
  const button = typeof element.closest === 'function' ? (element.closest('button') || element) : element;
  if (button.classList?.contains('play-books-icon-button')) return true;
  if (typeof button.querySelector === 'function' &&
      button.querySelector('.play-books-drop-zone-icon, .play-books-button-content')) {
    return true;
  }
  const ariaLabel = button.getAttribute?.('aria-label') || '';
  const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
  return /play\s*(books|圖書|图书)/i.test(ariaLabel) || /play\s*(books|圖書|图书)/i.test(text);
}

function isPlayBooksPickerVisible() {
  const picker =
    document.querySelector('play-books-picker') ||
    document.querySelector('.play-books-picker-container') ||
    document.querySelector('.play-books-header-logo');
  return !!(picker && picker.offsetParent !== null);
}

function findPlayBooksBackButton() {
  if (!isPlayBooksPickerVisible()) return null;
  const backButton =
    document.querySelector('add-sources-dialog button.back-button') ||
    document.querySelector('.state-header button.back-button') ||
    document.querySelector('button.back-button');
  return backButton && backButton.offsetParent !== null ? backButton : null;
}

function findCopiedTextOption() {
  const byLabelOrIcon = findSourceOption(COPIED_TEXT_LABELS, 'content_paste');
  if (byLabelOrIcon && !isPlayBooksSourceButton(byLabelOrIcon)) return byLabelOrIcon;

  const chip = document.querySelector('#mat-mdc-chip-3');
  if (chip && !isPlayBooksSourceButton(chip)) return chip;

  const buttons = Array.from(document.querySelectorAll('div.drop-zone-actions > button'))
    .filter((button) => button.offsetParent !== null && !isPlayBooksSourceButton(button));
  return buttons[3] || buttons[buttons.length - 1] || null;
}

function findCopiedTextInput() {
  return document.querySelector('textarea[formcontrolname="copiedText"]') ||
    document.querySelector('textarea.copied-text-input-textarea') ||
    document.querySelector('textarea[formcontrolname="text"]');
}

const DIALOG_INSERT_LABELS = ['Insert', '插入', '挿入', 'Insérer', 'Einfügen', 'Insertar', 'Inserir'];

function isEnabledActionButton(button) {
  if (!button || button.offsetParent === null) return false;
  if (button.disabled) return false;
  if (typeof button.hasAttribute === 'function' && button.hasAttribute('disabled')) return false;
  const classList = button.classList;
  if (classList?.contains?.('mat-mdc-button-disabled') || classList?.contains?.('mdc-button--disabled')) {
    return false;
  }
  return true;
}

function findEnabledDialogActionButton(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return null;
  const seen = new Set();
  const buttons = [];
  for (const selector of ['.mat-mdc-dialog-actions button', '[mat-dialog-actions] button']) {
    for (const button of Array.from(root.querySelectorAll(selector))) {
      if (seen.has(button)) continue;
      seen.add(button);
      buttons.push(button);
    }
  }

  const enabled = buttons.filter(isEnabledActionButton);
  if (!enabled.length) return null;

  const primary = enabled.find((button) =>
    button.classList?.contains?.('mat-mdc-unelevated-button') ||
    button.classList?.contains?.('mdc-button--unelevated') ||
    button.classList?.contains?.('mat-primary')
  );
  if (primary) return primary;

  const byLabel = enabled.find((button) => {
    const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
    return DIALOG_INSERT_LABELS.includes(text);
  });
  if (byLabel) return byLabel;

  return enabled[enabled.length - 1];
}

function findCopiedTextInsertButton() {
  const fromDialog = findEnabledDialogActionButton(document.querySelector('add-sources-dialog'));
  if (fromDialog) return fromDialog;

  return document.querySelector(
    'add-sources-dialog > div > div.mat-mdc-dialog-actions.mdc-dialog__actions.mat-mdc-dialog-actions-align-end.ng-star-inserted > button:not([disabled])'
  ) || document.querySelector(
    '#mat-mdc-dialog-0 > div > div > upload-dialog > div > div.content > paste-text > form > button:not([disabled])'
  ) || null;
}

function findWebsiteImportButton() {
  const fromDialog = findEnabledDialogActionButton(document.querySelector('add-sources-dialog'));
  if (fromDialog) return fromDialog;

  return document.querySelector(
    'add-sources-dialog > div > div.mat-mdc-dialog-actions.mdc-dialog__actions.mat-mdc-dialog-actions-align-end.ng-star-inserted > button:not([disabled])'
  ) || document.querySelector(
    '#mat-mdc-dialog-0 > div > div > upload-dialog > div > div.content > website-upload > form > button:not([disabled])'
  ) || null;
}

function fillTextInput(element, value) {
  if (!element) return;
  if (typeof element.focus === 'function') element.focus();

  const protoSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
  const textareaSetter =
    typeof HTMLTextAreaElement !== 'undefined'
      ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
      : null;
  const setter = protoSetter || textareaSetter;
  if (setter) setter.call(element, value);
  else element.value = value;

  element.dispatchEvent?.(new Event('input', { bubbles: true }));
  element.dispatchEvent?.(new Event('change', { bubbles: true }));
  if (typeof element.blur === 'function') element.blur();
}

async function waitForCopiedTextInput() {
  const outcome = await waitForAnyElement([
    findCopiedTextInput,
    findPlayBooksBackButton,
  ]);
  if (!outcome) return null;
  if (outcome === findCopiedTextInput()) return outcome;

  outcome.click();
  const option = await waitForAnyElement([findCopiedTextOption], 5000);
  if (option) option.click();
  return waitForAnyElement([findCopiedTextInput]);
}

function findAddSourceButton() {
  return (
    document.querySelector('button:not([disabled]).create-new-button') ||
    document.querySelector('button:not([disabled]).add-source-button') ||
    document.querySelector('.add-source-button button:not([disabled])')
  );
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
  const brand = i18n('brandNotebookLM', null, 'Gemini Notebook');
  document.title = `${emoji} ${source} – ${brand}`;
}

// Shared post-import flow for both URL and Text sources
async function handlePromptAndGenerate(targetUrl = null) {
  updateToast(toastI18n('toastWaitingLoad', null, 'Waiting for page to load...'));

  const promptTextarea = await waitForElement('textarea.query-box-input');

  // If promptTextarea is null (timeout), log and exit
  if (!promptTextarea) {
     console.error('[Web TL;DR] Timed out waiting for prompt textarea.');
     return;
  }

  // Only run if the textarea is empty to avoid issues on reloads
  if (promptTextarea.value === '') {
    // Capture the initial notebook title using waitForElement to ensure existence
    // const titleElement = await waitForElement('h1.notebook-title', 10000);
    // const initialNotebookTitle = titleElement?.textContent ?? null;

    // Get the prompt text from settings, default to "TL;DR" if not set
    const promptData = await chrome.storage.local.get({ promptText: i18n('promptDefault', null, 'TL;DR') });
    const promptText = promptData.promptText;

    updateToast(toastI18n('toastEnteringPrompt', null, 'Entering prompt...'), 'spinner', promptText);
    promptTextarea.value = promptText;
    promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for either the Submit button (success) or an Error container (failure)
    const resultElement = await waitForAnyElement([
      () => document.querySelector('button[type="submit"]:not([disabled])'),
      () => {
        const errorContainer = document.querySelector('.single-source-error-container');
        if (!errorContainer || !targetUrl) return null;

        // Check if error matches target URL
        const normalizedUrl = targetUrl.replace(/^https?:\/\//, '').split('?')[0];
        if (errorContainer.textContent.includes(normalizedUrl) || errorContainer.textContent.includes(targetUrl)) {
          return errorContainer;
        }
        return null; // Ignore unrelated errors
      }
    ], 30000); // 30s timeout

    // Check if we hit an error
    if (resultElement && resultElement.classList.contains('single-source-error-container')) {
      console.log('[Web TL;DR] Detected source import failure:', resultElement);
      
      try {
        await chrome.runtime.sendMessage({ action: 'clearTask' });
        console.log('[Web TL;DR] Cleared task due to error.');
      } catch (e) {
        console.error('[Web TL;DR] Failed to clear task:', e);
      }

      updateToast(toastI18n('toastImportFailed', null, 'Failed to import source. Please check the URL and try again.'), 'error');
      setNotebookTitle('error');
      
      removeToast(5000);
      removeOverlay();
      return; // Stop execution
    }

    /** @type {HTMLButtonElement} */
    let submitButton = resultElement;

    // Double check we actually have the button (in case of weird timeout/null return)
    if (!submitButton) {
         submitButton = document.querySelector('button[type="submit"]:not([disabled])');
    }

    if (!submitButton) {
        console.warn('[Web TL;DR] Submit button not found after prompt entry.');
        return;
    }

    // Wait until the notebook title changes from the initial value instead of a fixed sleep
    // await waitForNotebookTitleChange(initialNotebookTitle, 15000);

    // Wait until loading indicator disappears
    await waitForAppearanceThenDisappearance('div.notebook-guide-loading-animation');

    // The new title is the source title, so grab it for the tab title
    __webTldrSourceTitle = document.querySelector('div.source-title')?.textContent || __webTldrSourceTitle;

    // Click the submitting button repeatedly until the textarea is empty
    updateToast(toastI18n('toastGenerating', null, 'Generating summary...'));
    setNotebookTitle('generating');
    const maxAttempts = 20;
    let attempts = 0;

    while (promptTextarea.value !== '' && attempts < maxAttempts) {
      submitButton = await waitForElement('button[type="submit"]:not([disabled])');
      submitButton.click();
      attempts++;

      // Wait for the UI to update
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Wait until the reply has finished streaming before announcing success
    try {
      await waitForChatResponseCompletion();
    } catch (err) {
      console.error('Chat response completion not detected:', err);
    }

    updateToast(toastI18n('toastSummarySuccess', null, 'Summary generated successfully!'), 'success');
    setNotebookTitle('success');
    removeToast(2000);
    removeOverlay();
  } else {
    updateToast(toastI18n('toastImportSuccess', null, 'Page imported successfully!'), 'success');
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
  showToast(toastI18n('toastStarting', null, 'Waiting for page to load...'));
  setNotebookTitle('loading');

  try {
    // Wait for project loading spinner to disappear before opening the add source menu
    let spinnerAttempts = 0;
    while (document.querySelector('mat-progress-spinner') && spinnerAttempts < 60) {
      await new Promise(r => setTimeout(r, 500));
      spinnerAttempts++;
    }

    updateToast(toastI18n('toastOpeningAddSource', null, 'Opening Add Source menu...'));
    await waitForAnyElement([findAddSourceButton]);

    // Select the "Text" option. New UIs insert Play Books as the 4th drop-zone
    // button, so match Copied text by icon/label and fall back to the old layout.
    updateToast(toastI18n('toastSelectingText', null, 'Selecting Text option...'));
    let textOption = null;

    // Robust retry logic: if the menu fails to appear (e.g. click was too fast), try clicking again
    for (let i = 0; i < 5; i++) {
      const backButton = findPlayBooksBackButton();
      if (backButton) backButton.click();

      const btn = findAddSourceButton();
      if (btn) btn.click();

      textOption = await waitForAnyElement([findCopiedTextOption], 2000);
      if (textOption) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (!textOption) throw new Error('Text option not found after retries');
    textOption.click();

    updateToast(toastI18n('toastAddingText', null, 'Adding selected text...'), 'spinner', selectedText);
    const textInput = await waitForCopiedTextInput();
    if (!textInput) throw new Error('Copied text input not found');
    fillTextInput(textInput, selectedText);

    setNotebookTitle('importing');
    const importButton = await waitForAnyElement([findCopiedTextInsertButton]);
    if (!importButton) throw new Error('Insert button not found');
    importButton.click();

    // Clear task after importing
    try {
      await chrome.runtime.sendMessage({ action: 'clearTask' });
    } catch (err) {
      console.error('Error clearing task:', err);
    }

    await handlePromptAndGenerate();
  } catch (error) {
    console.error('[Web TL;DR for NotebookLM - controller] Text flow error:', error);
    updateToast(toastI18n('toastGenericError', null, 'An error occurred. Please try again.'), 'error');
    setNotebookTitle('error');
    removeToast(5000);
    removeOverlay();
  }
}

async function importAndSummarizeWebpage(passedUrl, passedSourceTitle) {
  // Prefer URL passed via arguments or injected variable
  let url = passedUrl || globalThis?.__web_tldr_url;
  let sourceTitle = passedSourceTitle || globalThis?.__web_tldr_source_title;

  if (!url) {
    try {
      const data = await chrome.storage.local.get(['urlToSummarize', 'sourceTitle']);
      url = data.urlToSummarize;
      sourceTitle = data.sourceTitle;
    } catch (err) {
      console.error('Error retrieving URL from storage:', err);
    }
  }
  // Compute source title as early as possible
  __webTldrSourceTitle = getReadableSourceTitle(url || location.href, sourceTitle);

  if (!url) {
    // If no URL is found in storage, we assume this is a manual visit
    // and do nothing (silently exit without showing UI).
    return;
  }

  // Show overlay and initial toast ONLY after confirming we have work to do
  showOverlay();
  showToast(toastI18n('toastStarting', null, 'Waiting for page to load...'));
  setNotebookTitle('loading');

  try {
    // Wait for project loading spinner to disappear before opening the add source menu
    let spinnerAttempts = 0;
    while (document.querySelector('mat-progress-spinner') && spinnerAttempts < 60) {
      await new Promise(r => setTimeout(r, 500));
      spinnerAttempts++;
    }

    updateToast(toastI18n('toastOpeningAddSource', null, 'Opening Add Source menu...'));
    await waitForAnyElement([findAddSourceButton]);

    updateToast(toastI18n('toastSelectingWebsite', null, 'Selecting Website option...'));
    let websiteOption = null;
    const websitePredicates = [
      () => document.querySelector('div.drop-zone-actions > button:nth-child(2)'),
      () => document.querySelector('#mat-mdc-chip-1'),
      () => findSourceOption(
        ['Website', '網頁', 'Link', '連結', '網站'],
        'link'
      ),
    ];

    // Robust retry logic: if the menu fails to appear (e.g. click was too fast), try clicking again
    for (let i = 0; i < 5; i++) {
      const btn = findAddSourceButton();
      if (btn) btn.click();
      
      websiteOption = await waitForAnyElement(websitePredicates, 2000);
      if (websiteOption) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (!websiteOption) throw new Error('Website option not found after retries');
    websiteOption.click();
    updateToast(toastI18n('toastAddingUrl', null, 'Adding URL...'), 'spinner', url);

    // Find the input, paste the URL, and click import
    const urlInput = await waitForAnyElement([
      () => document.querySelector('textarea[formcontrolname="urls"]'),
    ]);
    fillTextInput(urlInput, url);
    updateToast(toastI18n('toastImporting', null, 'Importing webpage...'));
    setNotebookTitle('importing');
    const importButton = await waitForAnyElement([findWebsiteImportButton]);
    if (!importButton) throw new Error('Import button not found');
    importButton.click();

    // Clear task after importing
    try {
      await chrome.runtime.sendMessage({ action: 'clearTask' });
    } catch (err) {
      console.error('Error clearing task:', err);
    }

    await handlePromptAndGenerate(url);
  } catch (error) {
    console.error('[Web TL;DR for NotebookLM - controller] An error occurred:', error);
    updateToast(toastI18n('toastGenericError', null, 'An error occurred. Please try again.'), 'error');
    setNotebookTitle('error');
    removeToast(5000);
    removeOverlay();
  }
}

async function __webTldrStart() {
  try {
    const task = await chrome.runtime.sendMessage({ action: 'getTask' }).catch(() => null);
    
    // Legacy fallback just in case there's old storage data hanging around
    const legacyData = await chrome.storage.local.get([
      'selectedTextToSummarize', 
      'selectedTextSourceTitle', 
      'urlToSummarize', 
      'sourceTitle'
    ]);
    
    // If we only have legacy data, it's likely a manual visit finding old data.
    // We should clear it and NOT run to prevent the bug.
    if (!task && (legacyData.selectedTextToSummarize || legacyData.urlToSummarize)) {
      await chrome.storage.local.remove([
        'selectedTextToSummarize', 
        'selectedTextSourceTitle', 
        'urlToSummarize', 
        'sourceTitle'
      ]);
      return; // Do not proceed for manual visits
    }

    const selectedTextToSummarize = task?.selectedTextToSummarize || null;
    const selectedTextSourceTitle = task?.selectedTextSourceTitle || null;
    const urlToSummarize = task?.urlToSummarize || null;
    const sourceTitle = task?.sourceTitle || null;

    if (selectedTextToSummarize?.trim()) {
      const injectedTitle = globalThis?.__web_tldr_source_title || selectedTextSourceTitle;
      await importAndSummarizeSelectedText(selectedTextToSummarize, injectedTitle);
    } else if (urlToSummarize) {
      await importAndSummarizeWebpage(urlToSummarize, sourceTitle);
    } else if (globalThis?.__web_tldr_url) {
      await importAndSummarizeWebpage();
    }
  } catch (e) {
    console.error('[Web TL;DR for NotebookLM - controller] Start failed', e);
  }
}

if (typeof chrome !== 'undefined') {
  setTimeout(__webTldrStart, 0);
}

if (typeof module !== 'undefined') {
  module.exports = {
    findAddSourceButton,
    findSourceOption,
    findCopiedTextOption,
    findCopiedTextInput,
    findCopiedTextInsertButton,
    findPlayBooksBackButton,
    isChatResponseComplete,
    setToastDetail,
    TOAST_DETAIL_MAX_LENGTH,
  };
}

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

// NotebookLM keeps these markers on a reply while the model is still thinking
const CHAT_IN_PROGRESS_SELECTOR = '.thinking-chain--in-progress, .thinking-chain__title.is-loading, .thinking-animation';

// The action bar is only rendered once the reply has finished streaming
const CHAT_MESSAGE_ACTIONS_SELECTOR = 'mat-card-actions.message-actions';

/**
 * Check whether the newest chat reply has finished.
 * Relies on structure rather than the thinking chain label, which is generated text.
 * @returns {boolean}
 */
function isChatResponseComplete() {
  const messages = document.querySelectorAll('chat-message');
  const latest = messages[messages.length - 1];
  if (!latest) return false;
  if (latest.querySelector(CHAT_IN_PROGRESS_SELECTOR)) return false;
  return Boolean(latest.querySelector(CHAT_MESSAGE_ACTIONS_SELECTOR));
}

/**
 * Wait until the newest chat reply is complete.
 * @param {number} timeout Milliseconds to wait before giving up
 * @returns {Promise<boolean>} true once the reply is complete, false on timeout but continues
 */
function waitForChatResponseCompletion(timeout = 300000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const pollInterval = setInterval(() => {
      if (isChatResponseComplete()) {
        clearInterval(pollInterval);
        resolve(true);
        return;
      }

      if (Date.now() - start >= timeout) {
        clearInterval(pollInterval);
        console.log(
          `[Web TL;DR] waitForChatResponseCompletion: reply did not complete within ${timeout}ms. Proceeding.`
        );
        resolve(false);
      }
    }, 250);
  });
}
