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

async function importAndSummarizeWebpage() {
    const data = await chrome.storage.local.get('urlToSummarize');
    const url = data.urlToSummarize;

    if (!url) {
        console.error("URL not found in storage. Aborting.");
        return;
    }

    try {
        // Click the "+ Add Source" button
        const addSourceButton = await waitForElement('button:not([disabled]).create-new-button');
        addSourceButton.click();

        // Click the "Website" option from the menu
        const websiteOption = await waitForElement('#mat-mdc-chip-2');
        websiteOption.click();

        // Find the input, paste the URL, and click import
        const urlInput = await waitForElement('input[formcontrolname="newUrl"]');
        urlInput.value = url;
        urlInput.dispatchEvent(new Event('input', {bubbles: true}));

        const importButton = await waitForElement('button:not([disabled]).submit-button');
        importButton.closest('button').click();

        await chrome.storage.local.remove('urlToSummarize');

        const promptTextarea = await waitForElement('textarea.query-box-input');

        // Only run if the textarea is empty to avoid issues on reloads
        if (promptTextarea.value === "") {
            promptTextarea.value = "TL;DR";
            promptTextarea.dispatchEvent(new Event('input', {bubbles: true}));

            // Wait for the submitting button to become enabled
            let submitButton = await waitForElement('button:not([disabled]).submit-button');

            // Brief pause to ensure the UI thread is ready
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Click the submitting button repeatedly until the textarea is empty
            const maxAttempts = 20;
            let attempts = 0;

            while (promptTextarea.value !== "" && attempts < maxAttempts) {
                submitButton = await waitForElement('button:not([disabled]).submit-button');
                submitButton.click();
                attempts++;

                // Wait for the UI to update
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    } catch (error) {
        console.error("[Web TL;DR for NotebookLM - controller] An error occurred:", error);
    }
}

setTimeout(importAndSummarizeWebpage, 500);
