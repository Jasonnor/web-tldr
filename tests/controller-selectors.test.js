const assert = require('node:assert/strict');
const { after, test } = require('node:test');

const {
  findAddSourceButton,
  findCopiedTextOption,
  findPlayBooksBackButton,
  findSourceOption,
} = require('../controller.js');

const VISIBLE_OFFSET_PARENT = {};
const HIDDEN_OFFSET_PARENT = null;

function createOption({
  label,
  icons = [],
  visible = true,
  className = '',
  ariaLabel = '',
  innerSelectors = [],
}) {
  const offsetParent = visible ? VISIBLE_OFFSET_PARENT : HIDDEN_OFFSET_PARENT;
  const classNames = className.split(/\s+/).filter(Boolean);
  const option = {
    textContent: label,
    offsetParent,
    classList: {
      contains(name) {
        return classNames.includes(name);
      },
    },
    getAttribute(name) {
      return name === 'aria-label' ? ariaLabel : null;
    },
    closest(selector) {
      if (selector === 'button') return option;
      return null;
    },
    querySelector(selector) {
      return option.querySelectorAll(selector)[0] || null;
    },
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
      if (selector.split(',').some((part) => innerSelectors.includes(part.trim()))) {
        return [{}];
      }
      return [];
    },
  };
  return option;
}

function createDocument(options, additionalSpans = []) {
  return {
    querySelector() {
      return null;
    },
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

test('finds copied text by icon when the UI language is not English or Chinese', () => {
  const copiedText = createOption({
    label: 'Texte copié',
    icons: ['content_paste'],
  });
  global.document = createDocument([
    createOption({ label: 'Téléverser', icons: ['upload'] }),
    createOption({ label: 'Site Web', icons: ['link'] }),
    createOption({ label: 'Drive', icons: ['drive'] }),
    createOption({
      label: 'Play Livres',
      className: 'play-books-icon-button',
      ariaLabel: 'Google Play Livres',
    }),
    copiedText,
  ]);

  assert.equal(findCopiedTextOption(), copiedText);
});

test('selects copied text instead of the new Play Books drop-zone button', () => {
  const playBooks = createOption({
    label: 'Play 圖書',
    className: 'play-books-icon-button',
    ariaLabel: 'Google Play 圖書',
    innerSelectors: ['.play-books-drop-zone-icon', '.play-books-button-content'],
  });
  const copiedText = createOption({
    label: '複製的文字',
    icons: ['content_paste'],
  });
  global.document = createDocument([
    createOption({ label: '上傳檔案', icons: ['upload'] }),
    createOption({ label: '網站', icons: ['link'] }),
    createOption({ label: '雲端硬碟', icons: ['drive'] }),
    playBooks,
    copiedText,
  ]);

  assert.equal(findCopiedTextOption(), copiedText);
});

test('finds the legacy copied-text chip when drop-zone buttons are absent', () => {
  const chip = {
    offsetParent: VISIBLE_OFFSET_PARENT,
    classList: { contains: () => false },
  };
  global.document = {
    querySelector(selector) {
      return selector === '#mat-mdc-chip-3' ? chip : null;
    },
    querySelectorAll() {
      return [];
    },
  };

  assert.equal(findCopiedTextOption(), chip);
});

test('keeps the legacy four-button Copied text position when Play Books is absent', () => {
  const copiedText = createOption({ label: 'Paste' });
  global.document = createDocument([
    createOption({ label: 'Upload' }),
    createOption({ label: 'Website' }),
    createOption({ label: 'Drive' }),
    copiedText,
  ]);

  assert.equal(findCopiedTextOption(), copiedText);
});

test('skips Play Books when falling back to drop-zone button order', () => {
  const copiedText = createOption({ label: 'Paste' });
  global.document = createDocument([
    createOption({ label: 'Upload' }),
    createOption({ label: 'Website' }),
    createOption({ label: 'Drive' }),
    createOption({
      label: 'Play Books',
      className: 'play-books-icon-button',
      ariaLabel: 'Google Play Books',
    }),
    copiedText,
  ]);

  assert.equal(findCopiedTextOption(), copiedText);
});

test('finds the Play Books back button only while that picker is visible', () => {
  const backButton = { offsetParent: VISIBLE_OFFSET_PARENT };
  const picker = { offsetParent: VISIBLE_OFFSET_PARENT };
  global.document = {
    querySelector(selector) {
      if (selector === 'play-books-picker') return picker;
      if (selector === 'add-sources-dialog button.back-button') return backButton;
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };

  assert.equal(findPlayBooksBackButton(), backButton);

  picker.offsetParent = HIDDEN_OFFSET_PARENT;
  assert.equal(findPlayBooksBackButton(), null);
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
