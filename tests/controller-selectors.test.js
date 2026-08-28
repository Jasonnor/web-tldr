const assert = require('node:assert/strict');
const { after, test } = require('node:test');

const { findAddSourceButton, findSourceOption } = require('../controller.js');

const VISIBLE_OFFSET_PARENT = {};
const HIDDEN_OFFSET_PARENT = null;

function createOption({ label, icons = [], visible = true }) {
  const offsetParent = visible ? VISIBLE_OFFSET_PARENT : HIDDEN_OFFSET_PARENT;
  const option = {
    textContent: label,
    offsetParent,
    querySelectorAll(selector) {
      if (selector === 'span') {
        return [{
          textContent: label,
          offsetParent,
          closest: () => option,
        }];
      }
      if (selector === 'mat-icon') {
        return icons.map((icon) => ({ textContent: icon }));
      }
      return [];
    },
  };
  return option;
}

function createDocument(options, additionalSpans = []) {
  return {
    querySelectorAll(selector) {
      if (selector === 'span') {
        return [
          ...options.flatMap((option) => option.querySelectorAll('span')),
          ...additionalSpans,
        ];
      }
      if (selector === 'div.drop-zone-actions > button') {
        return options;
      }
      return [];
    },
  };
}

after(() => {
  delete global.document;
});

test('finds the current Website option by Material icon', () => {
  global.document = createDocument([
    createOption({ label: 'Sitio web', icons: ['link'] }),
  ]);

  assert.equal(findSourceOption(['Website'], 'link').textContent, 'Sitio web');
});

test('finds the current Traditional Chinese Website label', () => {
  global.document = createDocument([
    createOption({ label: '網站' }),
  ]);

  assert.equal(findSourceOption(['Website', '網頁', 'Link', '連結', '網站'], 'link').textContent, '網站');
});

test('finds copied text by the current Material icon', () => {
  global.document = createDocument([
    createOption({ label: 'Texto pegado', icons: ['content_paste'] }),
  ]);

  assert.equal(findSourceOption(['Text'], 'content_paste').textContent, 'Texto pegado');
});

test('retains the legacy visible-label fallback outside the current option container', () => {
  const legacyOption = createOption({ label: 'Website' });
  const legacyLabels = legacyOption.querySelectorAll('span');
  global.document = createDocument([], legacyLabels);

  assert.equal(findSourceOption(['Website'], 'link'), legacyOption);
});

test('ignores hidden source options', () => {
  global.document = createDocument([
    createOption({ label: '網站', visible: false }),
  ]);

  assert.equal(findSourceOption(['網站'], 'link'), null);
});

function createAddSourceDocument(matches) {
  return {
    querySelector(selector) {
      return matches[selector] ?? null;
    },
  };
}

test('finds the legacy create-new Add Source button', () => {
  const button = {};
  global.document = createAddSourceDocument({
    'button:not([disabled]).create-new-button': button,
  });

  assert.equal(findAddSourceButton(), button);
});

test('finds the previous native add-source-button', () => {
  const button = {};
  global.document = createAddSourceDocument({
    'button:not([disabled]).add-source-button': button,
  });

  assert.equal(findAddSourceButton(), button);
});

test('finds the current nested Add Source button', () => {
  const button = {};
  global.document = createAddSourceDocument({
    '.add-source-button button:not([disabled])': button,
  });

  assert.equal(findAddSourceButton(), button);
});
