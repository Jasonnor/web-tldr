const assert = require('node:assert/strict');
const {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FIXTURE_VERSION = '9.8.7';
const PACKAGE_INPUTS = [
  'manifest.json',
  'background.js',
  'controller.js',
  'options.html',
  'options.js',
  '_locales',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
];
const EXPECTED_ARCHIVE_ENTRIES = [
  '_locales/',
  '_locales/de/',
  '_locales/de/messages.json',
  '_locales/en/',
  '_locales/en/messages.json',
  '_locales/es/',
  '_locales/es/messages.json',
  '_locales/fr/',
  '_locales/fr/messages.json',
  '_locales/ja/',
  '_locales/ja/messages.json',
  '_locales/pt_BR/',
  '_locales/pt_BR/messages.json',
  '_locales/zh_CN/',
  '_locales/zh_CN/messages.json',
  '_locales/zh_TW/',
  '_locales/zh_TW/messages.json',
  'background.js',
  'controller.js',
  'icons/icon128.png',
  'icons/icon16.png',
  'icons/icon48.png',
  'manifest.json',
  'options.html',
  'options.js',
];

function createFixture({ omit = [], version = FIXTURE_VERSION } = {}) {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'web-tldr-package-'));
  assert.ok(existsSync(path.join(PROJECT_ROOT, 'package.sh')), 'package.sh is missing');
  const manifest = JSON.parse(
    readFileSync(path.join(PROJECT_ROOT, 'manifest.json'), 'utf8')
  );
  if (version === null) {
    delete manifest.version;
  } else {
    manifest.version = version;
  }
  writeFileSync(
    path.join(fixtureRoot, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  for (const file of [
    'background.js',
    'controller.js',
    'options.html',
    'options.js',
    'package.sh',
  ]) {
    if (!omit.includes(file)) {
      cpSync(path.join(PROJECT_ROOT, file), path.join(fixtureRoot, file));
    }
  }
  if (existsSync(path.join(PROJECT_ROOT, 'package-files.txt'))) {
    cpSync(
      path.join(PROJECT_ROOT, 'package-files.txt'),
      path.join(fixtureRoot, 'package-files.txt')
    );
  }
  cpSync(path.join(PROJECT_ROOT, '_locales'), path.join(fixtureRoot, '_locales'), {
    recursive: true,
  });
  cpSync(path.join(PROJECT_ROOT, 'icons'), path.join(fixtureRoot, 'icons'), {
    recursive: true,
  });

  return fixtureRoot;
}

test('macOS script creates a versioned Web Store archive with only runtime files', () => {
  const fixtureRoot = createFixture();
  const scriptPath = path.join(fixtureRoot, 'package.sh');
  const result = spawnSync('sh', [scriptPath], {
    cwd: tmpdir(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);

  const archivePath = path.join(
    fixtureRoot,
    'dist',
    `web-tldr-${FIXTURE_VERSION}.zip`
  );
  const listing = spawnSync('unzip', ['-Z1', archivePath], {
    encoding: 'utf8',
  });

  assert.equal(listing.status, 0, listing.stderr);
  const entries = listing.stdout.trim().split('\n').sort();
  assert.deepEqual(entries, [...EXPECTED_ARCHIVE_ENTRIES].sort());
});

test('macOS script fails when a required runtime file is missing', () => {
  const fixtureRoot = createFixture({ omit: ['controller.js'] });
  const result = spawnSync('sh', [path.join(fixtureRoot, 'package.sh')], {
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /controller\.js/);
});

test('macOS script fails when the manifest version is missing', () => {
  const fixtureRoot = createFixture({ version: null });
  const result = spawnSync('sh', [path.join(fixtureRoot, 'package.sh')], {
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /version/);
});

test('macOS script excludes nested macOS metadata files', () => {
  const fixtureRoot = createFixture();
  const localesPath = path.join(fixtureRoot, '_locales');
  writeFileSync(path.join(localesPath, '.DS_Store'), '');
  writeFileSync(path.join(localesPath, '._messages.json'), '');
  writeFileSync(path.join(localesPath, '.LSOverride'), '');
  mkdirSync(path.join(localesPath, '.AppleDouble'));
  writeFileSync(path.join(localesPath, '.AppleDouble', 'messages.json'), '');
  mkdirSync(path.join(localesPath, '__MACOSX'));
  writeFileSync(path.join(localesPath, '__MACOSX', 'messages.json'), '');

  const result = spawnSync('sh', [path.join(fixtureRoot, 'package.sh')], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);

  const archivePath = path.join(
    fixtureRoot,
    'dist',
    `web-tldr-${FIXTURE_VERSION}.zip`
  );
  const listing = spawnSync('unzip', ['-Z1', archivePath], {
    encoding: 'utf8',
  });
  assert.equal(listing.status, 0, listing.stderr);
  assert.doesNotMatch(
    listing.stdout,
    /(^|\/)(\.DS_Store|\._[^/]*|\.AppleDouble|\.LSOverride|__MACOSX)(\/|$)/m
  );
});

test('macOS script packages entries added to the shared runtime file list', () => {
  const fixtureRoot = createFixture();
  const additionalFile = 'additional-runtime.js';
  writeFileSync(path.join(fixtureRoot, additionalFile), '');
  writeFileSync(
    path.join(fixtureRoot, 'package-files.txt'),
    `${[...PACKAGE_INPUTS, additionalFile].join('\n')}\n`
  );

  const result = spawnSync('sh', [path.join(fixtureRoot, 'package.sh')], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);

  const archivePath = path.join(
    fixtureRoot,
    'dist',
    `web-tldr-${FIXTURE_VERSION}.zip`
  );
  const listing = spawnSync('unzip', ['-Z1', archivePath], {
    encoding: 'utf8',
  });
  assert.equal(listing.status, 0, listing.stderr);
  assert.match(listing.stdout, /^additional-runtime\.js$/m);
});
