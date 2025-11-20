// i18n helper
function msg(key, subs) {
  try {
    return chrome.i18n.getMessage(key, subs) || '';
  } catch (err) {
    console.warn('i18n.getMessage failed', { key, subs, err });
    return '';
  }
}

function localizeOptionsPage() {
  // Title and header
  document.title = msg('optionsTitle') || document.title;
  const h1 = document.querySelector('h1');
  if (h1) h1.textContent = msg('optionsHeader') || h1.textContent;

  // Prompt label, placeholder, help
  const promptLabel = document.querySelector('label[for="promptText"]');
  if (promptLabel) promptLabel.textContent = msg('promptLabel') || promptLabel.textContent;
  const promptTextarea = document.getElementById('promptText');
  if (promptTextarea) promptTextarea.placeholder = msg('promptPlaceholder') || promptTextarea.placeholder;
  const promptHelp = document.querySelector('.form-group p');
  if (promptHelp) promptHelp.textContent = msg('promptHelp') || promptHelp.textContent;

  // Open in the background label and help
  const openLabel = document.querySelector('label[for="openInBackground"]');
  if (openLabel) {
    // preserve the checkbox input and replace the following text
    const input = openLabel.querySelector('input');
    openLabel.textContent = '';
    if (input) openLabel.prepend(input);
    openLabel.appendChild(
      document.createTextNode(' ' + (msg('openInBackgroundLabel') || 'Open Notebook tab in background'))
    );
  }
  const openHelp = document.querySelectorAll('.form-group p')[1];
  if (openHelp) openHelp.textContent = msg('openInBackgroundHelp') || openHelp.textContent;

  // Save button
  const saveBtn = document.getElementById('saveButton');
  if (saveBtn) saveBtn.textContent = msg('saveSettings') || saveBtn.textContent;
}

// Saves options to chrome.storage
function saveOptions() {
  const defaultPrompt = msg('promptDefault') || 'TL;DR';
  /** @type {HTMLInputElement} */
  const promptTextElement = document.getElementById('promptText');
  const promptText = promptTextElement?.value || defaultPrompt;
  /** @type {HTMLInputElement} */
  const backgroundElement = document.getElementById('openInBackground');
  const openInBackground = backgroundElement?.checked || false;

  chrome.storage.local.set({ promptText: promptText, openInBackground: openInBackground }, function () {
    // Update status to let user know options were saved
    /** @type {HTMLDivElement} */
    const status = document.getElementById('status');
    status.textContent = msg('settingsSaved') || 'Settings saved.';
    status.classList.add('success');
    status.style.display = 'block';

    setTimeout(function () {
      status.style.display = 'none';
    }, 3000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  const defaultPrompt = msg('promptDefault') || 'TL;DR';
  chrome.storage.local.get(
    { promptText: defaultPrompt, openInBackground: false }, // Default values
    function (items) {
      document.getElementById('promptText').value = items.promptText;
      document.getElementById('openInBackground').checked = !!items.openInBackground;
    }
  );
}

document.addEventListener('DOMContentLoaded', function () {
  localizeOptionsPage();
  restoreOptions();
});

document.getElementById('saveButton').addEventListener('click', saveOptions);
