/* Shared helpers for the headless UI tests. They need Playwright and Chromium:
     NODE_PATH=$(npm root -g) node tools/ui/<script>.js
   CHROMIUM=<path> overrides the browser binary; EVO_ROOT=<dir> tests another checkout of the viewer
   (e.g. a `git worktree` of an older commit) with these scripts. Test images come from `python3 tools/ui/gen_maps.py`
   (needs Pillow and numpy) and live in tools/ui/.cache (not committed). */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = process.env.EVO_ROOT || path.resolve(__dirname, '../..'), CACHE = path.join(__dirname, '.cache');
const DEFAULT_BIN = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
exports.ROOT = ROOT; exports.CACHE = CACHE; exports.MAPS = path.join(CACHE, 'maps');
exports.mapFile = (dir, name) => path.join(CACHE, dir, name + '.png');

exports.open = async (opts = {}) => {
  const bin = process.env.CHROMIUM || (fs.existsSync(DEFAULT_BIN) ? DEFAULT_BIN : undefined);
  const browser = await chromium.launch({ executablePath: bin, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: opts.w || 1500, height: opts.h || 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.__evo);
  const api = {
    browser, page, errs,
    idle: () => page.waitForFunction(() => document.querySelector('#busy').hidden, null, { timeout: 180000 }).then(() => page.waitForTimeout(350)),
    load: async (dir, names = ['height', 'zones', 'edges']) => { await page.setInputFiles('#file', names.map((n) => exports.mapFile(dir, n))); await page.waitForTimeout(1200); await api.idle(); },
    zone: async (id) => { await page.click(`#zoneChips .chip[data-id="${id}"]`); await api.idle(); },
    tech: async (t) => { await page.click(`#techs button[data-id=${t}]`); await api.idle(); },
    preset: async (p) => { await page.click(`#presets button[data-id=${p}]`); await api.idle(); },
    slider: (id, v) => page.evaluate(({ id, v }) => { const el = document.querySelector('#s-' + id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, { id, v }),
    canvas: async () => Buffer.from((await page.evaluate(() => document.querySelector('#stage canvas').toDataURL('image/png'))).split(',')[1], 'base64'),
    ok: (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  ' + extra : '')); if (!cond) process.exitCode = 1; }
  };
  return api;
};
