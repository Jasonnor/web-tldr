async function launchSummarization(urlToSummarize, sourceTab) {
    try {
        if (!urlToSummarize || urlToSummarize.startsWith('chrome://')) {
            console.error("Invalid URL for summarization.");
            return;
        }
        await chrome.storage.local.set({'urlToSummarize': urlToSummarize});

        // Read user preference for opening in background (default: false)
        const {openInBackground = false} = await chrome.storage.local.get({openInBackground: false});

        // Open NotebookLM in a new tab, immediately to the right of the current tab
        const notebookTab = await chrome.tabs.create({
            url: "https://notebooklm.google.com/",
            index: typeof sourceTab?.index === 'number' ? sourceTab.index + 1 : undefined,
            windowId: sourceTab?.windowId,
            openerTabId: sourceTab?.id,
            active: !openInBackground
        });

        // Set up a listener to wait for the tab to finish loading
        const listener = (tabId, changeInfo, tab) => {
            if (
                tabId === notebookTab.id &&
                changeInfo.status === 'complete' &&
                tab.url.startsWith('https://notebooklm.google.com')
            ) {
                // Inject the URL into the tab's isolated world to avoid race conditions
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    func: (u, t) => {
                        window.__web_tldr_url = u;
                        window.__web_tldr_source_title = t;
                    },
                    args: [urlToSummarize, sourceTab?.title || null]
                });

                // Inject the controller script
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    files: ["controller.js"]
                });

                chrome.tabs.onUpdated.removeListener(listener);
            }
        };

        chrome.tabs.onUpdated.addListener(listener);
    } catch (error) {
        console.error("[Web TL;DR for NotebookLM - background] An error occurred: ", error);
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
            chrome.contextMenus.create({
                id: 'web-tldr-summarize-page',
                title: 'Summarize this page with NotebookLM',
                contexts: ['page']
            });
            // Summarize link target
            chrome.contextMenus.create({
                id: 'web-tldr-summarize-link',
                title: 'Summarize linked page with NotebookLM',
                contexts: ['link']
            });
        });
    } catch (e) {
        console.error('[Web TL;DR] Failed to create context menus', e);
    }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
        if (info.menuItemId === 'web-tldr-summarize-link' && info.linkUrl) {
            await launchSummarization(info.linkUrl, tab);
        } else if (info.menuItemId === 'web-tldr-summarize-page') {
            const targetUrl = info.pageUrl || tab?.url;
            await launchSummarization(targetUrl, tab);
        }
    } catch (e) {
        console.error('[Web TL;DR] Context menu action failed', e);
    }
});
