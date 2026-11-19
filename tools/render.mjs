// Regenerates assets/entry.png (and optionally an optimised copy) from page/index.html.
//
//   node tools/render.mjs                          -> assets/entry.png
//   RENDER_SCALE=0.325 node tools/render.mjs /tmp/x.png
//   PNG_OPT=96 node tools/render.mjs               -> quantised to a 96-colour palette as well
//
// The page is authored at 1600 x 1600 CSS px. The gate takes at most 1024 x 1024 px and 1 MiB, so the
// default device scale factor is 0.64: 1600 * 0.64 = 1024 device px, rasterised at that size rather
// than resampled from a larger render, so the small type keeps its edges.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = join(ROOT, 'page', 'index.html');
const OUT = resolve(process.argv[2] ?? join(ROOT, 'assets', 'entry.png'));
const SCALE = process.env.RENDER_SCALE ?? '0.64';
const OPT = process.env.PNG_OPT ?? '';
const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome';
const CSS_W = 1600;
const CSS_H = 1600;
const MAX_BYTES = 1048576;
const MAX_PX = 1024;

const chromeArgs = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--hide-scrollbars',
  '--allow-file-access-from-files',
  `--force-device-scale-factor=${SCALE}`,
  `--window-size=${CSS_W},${CSS_H}`,
  '--default-background-color=00000000',
  '--virtual-time-budget=4000',
];

function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${OUT} is not a PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readReports() {
  const dom = execFileSync(CHROME, [...chromeArgs, '--dump-dom', `file://${PAGE}`], { encoding: 'utf8' });
  const metrics = dom.match(/METRICS:(\{[^<]*\})/);
  const audit = dom.match(/AUDIT:(\{[^<]*\})/);
  if (!metrics) throw new Error('page reported no METRICS - did news.js throw?');
  return { metrics: JSON.parse(metrics[1]), audit: audit ? JSON.parse(audit[1]) : null };
}

mkdirSync(dirname(OUT), { recursive: true });
const { metrics, audit } = readReports();
execFileSync(CHROME, [...chromeArgs, `--screenshot=${OUT}`, `file://${PAGE}`], { stdio: ['ignore', 'ignore', 'inherit'] });

if (audit && audit.count > 0) throw new Error(`layout audit found ${audit.count} problems: ${audit.issues.join('; ')}`);
if (metrics.overflow > 2) throw new Error(`page overflows its ${CSS_H} px height by ${metrics.overflow} px`);

let size = pngSize(readFileSync(OUT));
let bytes = statSync(OUT).size;
if (size.width > MAX_PX || size.height > MAX_PX) throw new Error(`image is ${size.width}x${size.height}; the gate takes at most ${MAX_PX}x${MAX_PX}`);
if (bytes > MAX_BYTES) throw new Error(`image is ${bytes} bytes; the gate takes at most ${MAX_BYTES}`);

if (OPT) {
  execFileSync('convert', [OUT, '-colors', OPT, '-depth', '8', `png8:${OUT}.opt.png`]);
  const optBytes = statSync(`${OUT}.opt.png`).size;
  const optSize = pngSize(readFileSync(`${OUT}.opt.png`));
  if (optSize.width !== size.width || optSize.height !== size.height) throw new Error('optimised copy changed dimensions');
  if (optBytes < bytes) {
    writeFileSync(OUT, readFileSync(`${OUT}.opt.png`));
    bytes = optBytes;
    size = optSize;
  }
}

writeFileSync(
  join(ROOT, 'tools', 'render.log'),
  `${JSON.stringify({ image: { ...size, bytes }, scale: SCALE, opt: OPT || null, page: metrics }, null, 0)}\n`
);
console.log(`rendered ${size.width}x${size.height}, ${bytes} bytes -> ${OUT}`);
