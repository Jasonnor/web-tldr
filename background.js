chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Get and store the URL
        const urlToSummarize = tab.url;
        if (!urlToSummarize || urlToSummarize.startsWith('chrome://')) {
            console.error("Invalid URL for summarization.");
            return;
        }
        await chrome.storage.local.set({'urlToSummarize': urlToSummarize});

        // Open NotebookLM in a new tab
        const notebookTab = await chrome.tabs.create({url: "https://notebooklm.google.com/"});

        // Set up a listener to wait for the tab to finish loading
        const listener = (tabId, changeInfo, tab) => {
            // Make sure this is the tab we just opened and it's fully loaded
            if (
                tabId === notebookTab.id &&
                changeInfo.status === 'complete' &&
                tab.url.startsWith('https://notebooklm.google.com')
            ) {
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
