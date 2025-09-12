chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Get the URL to summarize for this invocation
        const urlToSummarize = tab.url;
        if (!urlToSummarize || urlToSummarize.startsWith('chrome://')) {
            console.error("Invalid URL for summarization.");
            return;
        }
        await chrome.storage.local.set({'urlToSummarize': urlToSummarize});

        // Open NotebookLM in a new tab, immediately to the right of the current tab
        const notebookTab = await chrome.tabs.create({
            url: "https://notebooklm.google.com/",
            index: tab.index + 1,
            windowId: tab.windowId,
            openerTabId: tab.id
        });

        // Set up a listener to wait for the tab to finish loading
        const listener = (tabId, changeInfo, tab) => {
            // Make sure this is the tab we just opened and it's fully loaded
            if (
                tabId === notebookTab.id &&
                changeInfo.status === 'complete' &&
                tab.url.startsWith('https://notebooklm.google.com')
            ) {
                // Inject the URL into the tab's isolated world to avoid race conditions
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    func: (u) => {
                        window.__web_tldr_url = u;
                    },
                    args: [urlToSummarize]
                });

                // Inject the controller script
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    files: ["controller.js"]
                });

                // Remove the listener so it doesn't fire again
                chrome.tabs.onUpdated.removeListener(listener);
            }
        };

        chrome.tabs.onUpdated.addListener(listener);

    } catch (error) {
        console.error("[Web TL;DR for NotebookLM - background] An error occurred: ", error);
    }
});
