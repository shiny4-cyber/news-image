// Checks the entry the way the gate does, without the gate: node --test tools/test.mjs
//
//  1. the image the program writes is a whole PNG inside the gate's limits
//  2. two runs of main.ts write the same bytes, and those bytes are assets/entry.png
//  3. main.ts fails loudly and with a clear message when the image is missing
//  4. the repository carries what the entry needs: license, claim file, badges, page sources

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGE = join(ROOT, 'assets', 'entry.png');
const MAX_BYTES = 1048576;
const MAX_PX = 1024;

const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

function runMain(outDir) {
  return execFileSync(process.execPath, [join(ROOT, 'main.ts')], {
    env: { ...process.env, MAKEFUN_OUTPUT_DIR: outDir },
    encoding: 'utf8',
  });
}

test('assets/entry.png is a whole PNG inside the gate limits', () => {
  assert.ok(existsSync(IMAGE), 'assets/entry.png is missing - run node tools/render.mjs');
  const buf = readFileSync(IMAGE);
  assert.equal(buf.readUInt32BE(0), 0x89504e47, 'PNG signature');
  assert.equal(buf.readUInt32BE(4), 0x0d0a1a0a, 'PNG signature');
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  assert.ok(width <= MAX_PX && height <= MAX_PX, `${width}x${height} is over ${MAX_PX}px`);
  const bytes = statSync(IMAGE).size;
  assert.ok(bytes > 0 && bytes <= MAX_BYTES, `${bytes} bytes is outside 1..${MAX_BYTES}`);
  assert.equal(buf.subarray(buf.length - 12, buf.length - 8).toString('latin1'), 'IEND', 'PNG ends with IEND');
});

test('two runs of main.ts write the same bytes as assets/entry.png', () => {
  const a = mkdtempSync(join(tmpdir(), 'news-image-a-'));
  const b = mkdtempSync(join(tmpdir(), 'news-image-b-'));
  const lineA = runMain(a);
  const lineB = runMain(b);
  assert.match(lineA, /^news-image-20261118: wrote .* from assets\/entry\.png$/);
  assert.equal(lineB, lineA);
  assert.equal(sha(join(a, 'entry.png')), sha(IMAGE));
  assert.equal(sha(join(b, 'entry.png')), sha(IMAGE));
});

test('main.ts fails with a clear error when the image is missing', () => {
  const bare = mkdtempSync(join(tmpdir(), 'news-image-bare-'));
  cpSync(join(ROOT, 'main.ts'), join(bare, 'main.ts'));
  const out = join(bare, 'out');
  let failed = null;
  try {
    execFileSync(process.execPath, [join(bare, 'main.ts')], {
      env: { ...process.env, MAKEFUN_OUTPUT_DIR: out },
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error) {
    failed = error;
  }
  assert.ok(failed, 'main.ts should exit non-zero when assets/entry.png is missing');
  assert.equal(failed.status, 1);
  assert.match(String(failed.stderr), /no image at .*assets\/entry\.png/);
  assert.match(String(failed.stderr), /node tools\/render\.mjs/);
  assert.equal(existsSync(join(out, 'entry.png')), false, 'nothing is written when the image is missing');
});

test('the repository carries the license, the claim file, the badges and the page sources', () => {
  assert.match(readFileSync(join(ROOT, 'LICENSE'), 'utf8'), /SPDX-License-Identifier: MIT/);

  const owner = JSON.parse(readFileSync(join(ROOT, '.makefun', 'owner.json'), 'utf8'));
  assert.match(owner.wallet, /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'owner.json names a base58 wallet');

  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  for (const badge of [
    'https://make.fun/badge/news-image-20261118.svg',
    'https://make.fun/badge/news-image-20261118/shiny4-cyber/news-image/rank.svg',
    'https://make.fun/badge/news-image-20261118/shiny4-cyber/news-image/reward.svg',
  ]) {
    assert.ok(readme.includes(badge), `README is missing ${badge}`);
  }
  assert.doesNotMatch(readme, /\{(owner|repo|slug)\}/, 'README leaves a template placeholder');

  assert.ok(existsSync(join(ROOT, 'page', 'index.html')));
  assert.ok(existsSync(join(ROOT, 'page', 'news.js')));
  assert.ok(existsSync(join(ROOT, 'tools', 'render.mjs')));
});
