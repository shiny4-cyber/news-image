// Entry for make.fun's news-image-20261118: writes the day's front page to /output/entry.png.
//
// The page is authored as HTML in page/ and rendered to assets/entry.png by tools/render.mjs, so this
// program only has to copy the image the repository holds. Both runs of the gate copy the same bytes,
// which is what the harness checks.
//
//   node main.ts                          # in the grader: writes /output/entry.png
//   MAKEFUN_OUTPUT_DIR=out node main.ts    # anywhere else: writes out/entry.png

import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const IMAGE = join(HERE, 'assets', 'entry.png');
const MAX_BYTES = 1048576;
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outDir, 'entry.png');

if (!existsSync(IMAGE)) {
  console.error(`news-image-20261118: no image at ${IMAGE}`);
  console.error('Run "node tools/render.mjs" to build it from page/index.html.');
  process.exit(1);
}

const bytes = statSync(IMAGE).size;
if (bytes === 0 || bytes > MAX_BYTES) {
  console.error(`news-image-20261118: ${IMAGE} is ${bytes} bytes, the gate takes 1 to ${MAX_BYTES}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(IMAGE, target);
console.log(`news-image-20261118: wrote ${target} (${bytes} bytes) from assets/entry.png`);
