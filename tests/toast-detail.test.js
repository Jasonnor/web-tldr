const assert = require('node:assert/strict');
const { after, test } = require('node:test');

const { setToastDetail, TOAST_DETAIL_MAX_LENGTH } = require('../controller.js');

const DETAIL_ID = 'web-tldr-toast-detail';

function createBody() {
  const children = [];
  return {
    children,
    querySelector(selector) {
      return children.find((child) => `#${child.id}` === selector) ?? null;
    },
    appendChild(child) {
      children.push(child);
      child.remove = () => children.splice(children.indexOf(child), 1);
    },
  };
}

function detailOf(body) {
  return body.querySelector(`#${DETAIL_ID}`);
}

global.document = { createElement: () => ({ style: {} }) };

after(() => {
  delete global.document;
});

test('shows a short detail unchanged', () => {
  const body = createBody();
  setToastDetail(body, 'TL;DR');

  assert.equal(detailOf(body).textContent, 'TL;DR');
});

test('truncates an over-long detail but keeps the full text on hover', () => {
  const body = createBody();
  const prompt = 'A'.repeat(TOAST_DETAIL_MAX_LENGTH * 2);

  setToastDetail(body, prompt);

  const detail = detailOf(body);
  assert.equal(detail.textContent.length, TOAST_DETAIL_MAX_LENGTH);
  assert.ok(detail.textContent.endsWith('…'));
  assert.equal(detail.title, prompt);
});

test('reuses the existing detail line instead of stacking a new one', () => {
  const body = createBody();

  setToastDetail(body, 'first');
  setToastDetail(body, 'second');

  assert.equal(body.children.length, 1);
  assert.equal(detailOf(body).textContent, 'second');
});

test('removes the detail line when the next toast has no detail', () => {
  const body = createBody();

  setToastDetail(body, 'TL;DR');
  setToastDetail(body, '');

  assert.equal(detailOf(body), null);
});
