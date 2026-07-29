const assert = require('node:assert/strict');
const { test } = require('node:test');

const manifest = require('../manifest.json');

const GEMINI_NOTEBOOK_MATCH_PATTERNS = [
  'https://notebook.google.com/*',
  'https://notebooklm.google.com/*',
];
const GEMINI_NOTEBOOK_HOST_PERMISSIONS = [
  'https://notebook.google.com/',
  'https://notebooklm.google.com/',
];

test('injects the controller on both Gemini Notebook domains', () => {
  const controllerScript = manifest.content_scripts.find(
    ({ js }) => js.includes('controller.js')
  );

  assert.ok(controllerScript);
  for (const pattern of GEMINI_NOTEBOOK_MATCH_PATTERNS) {
    assert.ok(
      controllerScript.matches.includes(pattern),
      `Missing content script match: ${pattern}`
    );
  }
});

test('requests access to both Gemini Notebook domains', () => {
  for (const pattern of GEMINI_NOTEBOOK_HOST_PERMISSIONS) {
    assert.ok(
      manifest.host_permissions.includes(pattern),
      `Missing host permission: ${pattern}`
    );
  }
});
