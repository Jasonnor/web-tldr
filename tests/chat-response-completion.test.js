const assert = require('node:assert/strict');
const { after, test } = require('node:test');

const { isChatResponseComplete } = require('../controller.js');

// Class names captured from a NotebookLM reply while it is still thinking and once it is done
const IN_PROGRESS_CLASSES = ['thinking-chain', 'thinking-chain--in-progress', 'thinking-chain--collapsed'];
const LOADING_TITLE_CLASSES = ['thinking-chain__title', 'mat-body-medium', 'is-loading'];
const DONE_THINKING_CLASSES = ['thinking-chain', 'thinking-chain--collapsed'];
const ACTIONS_TAG = 'mat-card-actions';
const ACTIONS_CLASSES = ['mat-mdc-card-actions', 'message-actions'];

function createNode({ tag = 'div', classes = [] }) {
  return {
    matches(compound) {
      const parts = compound.trim().split('.');
      const wantedTag = parts.shift();
      if (wantedTag && wantedTag !== tag) return false;
      return parts.every((className) => classes.includes(className));
    },
  };
}

function createMessage(nodes) {
  return {
    querySelector(selector) {
      const compounds = selector.split(',');
      return nodes.find((node) => compounds.some((compound) => node.matches(compound))) || null;
    },
  };
}

function createDocument(messages) {
  return {
    querySelectorAll(selector) {
      return selector === 'chat-message' ? messages : [];
    },
  };
}

after(() => {
  delete global.document;
});

test('is not complete while the thinking chain is in progress', () => {
  global.document = createDocument([
    createMessage([
      createNode({ classes: IN_PROGRESS_CLASSES }),
      createNode({ tag: 'span', classes: LOADING_TITLE_CLASSES }),
    ]),
  ]);

  assert.equal(isChatResponseComplete(), false);
});

test('is not complete once thinking ends but the reply is still streaming', () => {
  global.document = createDocument([
    createMessage([createNode({ classes: DONE_THINKING_CLASSES })]),
  ]);

  assert.equal(isChatResponseComplete(), false);
});

test('is complete once the finished reply renders its action bar', () => {
  global.document = createDocument([
    createMessage([
      createNode({ classes: DONE_THINKING_CLASSES }),
      createNode({ tag: ACTIONS_TAG, classes: ACTIONS_CLASSES }),
    ]),
  ]);

  assert.equal(isChatResponseComplete(), true);
});

test('only the newest message decides completion', () => {
  const finished = createMessage([createNode({ tag: ACTIONS_TAG, classes: ACTIONS_CLASSES })]);
  const thinking = createMessage([createNode({ classes: IN_PROGRESS_CLASSES })]);
  global.document = createDocument([finished, thinking]);

  assert.equal(isChatResponseComplete(), false);
});

test('is not complete before any chat message exists', () => {
  global.document = createDocument([]);

  assert.equal(isChatResponseComplete(), false);
});
