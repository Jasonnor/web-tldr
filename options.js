// Saves options to chrome.storage
function saveOptions() {
  const promptText = document.getElementById('promptText').value || 'TL;DR';

  chrome.storage.local.set({ promptText: promptText }, function () {
    // Update status to let user know options were saved
    const status = document.getElementById('status');
    status.textContent = 'Settings saved.';
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
  chrome.storage.local.get(
    { promptText: 'TL;DR' }, // Default value
    function (items) {
      document.getElementById('promptText').value = items.promptText;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveButton').addEventListener('click', saveOptions);
