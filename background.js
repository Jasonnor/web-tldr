async function launchSummarization(urlToSummarize, sourceTab, linkText = null) {
  try {
    if (!urlToSummarize || urlToSummarize.startsWith('chrome://')) {
      console.error('Invalid URL for summarization.');
      return;
    }
    await chrome.storage.local.set({
      urlToSummarize: urlToSummarize,
      sourceTitle: linkText || sourceTab?.title || null,
    });

    // Read user preference for opening in the background (default: false)
    const { openInBackground = false } = await chrome.storage.local.get({ openInBackground: false });

    // Open NotebookLM in a new tab, immediately to the right of the current tab
    await chrome.tabs.create({
      url: 'https://notebooklm.google.com/',
      index: typeof sourceTab?.index === 'number' ? sourceTab.index + 1 : undefined,
      windowId: sourceTab?.windowId,
      openerTabId: sourceTab?.id,
      active: !openInBackground,
    });

    chrome.tabs.onUpdated.addListener(listener);
  } catch (error) {
    console.error('[Web TL;DR for NotebookLM - background] An error occurred: ', error);
  }
}

// Toolbar button click
chrome.action.onClicked.addListener(async (tab) => {
  const urlToSummarize = tab?.url;
  await launchSummarization(urlToSummarize, tab);
});

// Create context menus on install/update
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.removeAll(() => {
      // Summarize this page
      chrome.contextMenus.create(
        /** @type {chrome.contextMenus.CreateProperties} */
        {
          id: 'web-tldr-summarize-page',
          title: chrome.i18n.getMessage('ctxSummarizePage') || 'Summarize this page with NotebookLM',
          contexts: ['page'],
        }
      );
      // Summarize the link or selected text (combined)
      chrome.contextMenus.create(
        /** @type {chrome.contextMenus.CreateProperties} */
        {
          id: 'web-tldr-summarize-link-or-selection',
          title: chrome.i18n.getMessage('ctxSummarizeLinkOrSelection') || 'Summarize with NotebookLM',
          contexts: ['link', 'selection'],
        }
      );
    });
  } catch (e) {
    console.error('[Web TL;DR] Failed to create context menus', e);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === 'web-tldr-summarize-page') {
      const targetUrl = info.pageUrl || tab?.url;
      await launchSummarization(targetUrl, tab);
    } else if (info.menuItemId === 'web-tldr-summarize-link-or-selection') {
      // If a link is clicked, process the link first; otherwise, process selected text
      if (info.linkUrl) {
        await launchSummarization(info.linkUrl, tab, info.selectionText);
      } else if (info.selectionText) {
        // Store the selected text so the controller can add it as a Text source
        const snippet = info.selectionText.trim();
        if (snippet) {
          await chrome.storage.local.set({
            selectedTextToSummarize: snippet,
            selectedTextSourceTitle: snippet.length > 80 ? snippet.slice(0, 77) + '…' : snippet,
          });
          const targetUrl = info.pageUrl || tab?.url;
          await launchSummarization(targetUrl, tab, snippet);
        }
      }
    }
  } catch (e) {
    console.error('[Web TL;DR] Context menu action failed', e);
  }
});
