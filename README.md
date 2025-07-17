# Web TL;DR for NotebookLM

A Chrome extension that sends the current webpage to NotebookLM and automatically prompts "TL;DR" to get an instant,
concise summary.

## Features

- One-click operation, no copy-paste needed
- Automatically opens NotebookLM in a new tab
- Automatically enters the "TL;DR" prompt and submits it
- Works with any webpage that NotebookLM can import

## Installation

### Developer Mode Installation

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The extension should now appear in your Chrome toolbar

## Usage

1. Navigate to any webpage you want to summarize
2. Click the Web TL;DR extension icon in your Chrome toolbar
3. The extension will:
    - Open NotebookLM in a new tab
    - Import the current webpage
    - Automatically enter "TL;DR" in the prompt field
    - Submit the prompt to generate a summary

## Requirements

- Google Chrome browser
- Access to NotebookLM (https://notebooklm.google.com/)

## Troubleshooting

- If the automatic "TL;DR" prompt doesn't work, you can manually type "TL;DR" in the NotebookLM interface
- Make sure you're logged into your Google account that has access to NotebookLM
- Check that you have the necessary permissions enabled for the extension

## Privacy

This extension:

- Only accesses the URL of your current tab when you click the extension button
- Does not collect or store any personal data
- Does not track your browsing history

## License

MIT License.

See the [LICENSE file](./LICENSE) for details.
