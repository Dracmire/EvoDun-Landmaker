/* Node-side driver of the SALA T harness (Playwright + the frozen viewer). */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const { chromium } = require('playwright');
const ROOT = '/home/claude/salat/wt', OUT = process.env.SALAT_OUT || '/home/claude/salat/out', HARNESS = '/home/claude/salat/harness';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

async function open(opts = {}) {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1700, height: 1100 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.__evo);
  // exactly 1280 x 720 for the stage panel: fixed grid column and panel height (page CSS only)
  await page.addStyleTag({ content: '.app{grid-template-columns:280px 1280px !important;height:auto !important} #stage{flex:none !important;height:720px !important;width:1280px !important}' });
  await page.addScriptTag({ path: path.join(HARNESS, 'world.js') });
  await page.addScriptTag({ path: path.join(HARNESS, 'world2.js') });
  await page.evaluate((h) => { if (h) window.SALAT.setClosure(h); window.SALAT.install(); }, opts.closure || 0);
  await page.evaluate(() => window.__evo.setMode('stage'));
  const api = { browser, page, errs };
  api.idle = () => page.waitForFunction(() => document.querySelector('#busy').hidden && !(window.__evo.slStats && window.__evo.slStats().pending), null, { timeout: 180000 }).then(() => page.waitForTimeout(400));
  await api.idle();
  // the viewer's own state for the world: Measures in H off, terH 1.25 H = 2.5 tiles, no natural stairs, no plateau cleanup
  await page.evaluate(() => {
    const ev = window.__evo, P = ev.P, st = ev.st;
    st.stageUnits = false; P.terH = 2.5; P.stairW = 0; P.minPlateau = 1; P.pre = 0; P.spread = 1; P.terraces = 3; P.subs = 1;
    for (const k of ['terH', 'stairW', 'minPlateau', 'pre', 'spread', 'terraces', 'subs']) { const i = document.querySelector('#s-' + k), o = document.querySelector('#o-' + k); if (i) i.value = P[k]; if (o) o.textContent = P[k]; }
    ev.draw();
  });
  await api.idle();
  api.canvas = async () => {
    const d = await page.evaluate(() => { const c = document.querySelector('#stage canvas'); const ctx = c.getContext('2d'); const im = ctx.getImageData(0, 0, c.width, c.height); let s = ''; const u = im.data; const CH = 0x8000; const parts = []; for (let k = 0; k < u.length; k += CH) parts.push(String.fromCharCode.apply(null, u.subarray(k, k + CH))); return { w: c.width, h: c.height, b64: btoa(parts.join('')), png: c.toDataURL('image/png') }; });
    const rgba = Buffer.from(d.b64, 'base64'); return { w: d.w, h: d.h, rgba, png: Buffer.from(d.png.split(',')[1], 'base64') };
  };
  api.eval = (f, a) => page.evaluate(f, a);
  api.put = async (spec) => { await page.evaluate((sp) => window.SALAT.apply(sp), spec); await api.idle(); };
  api.grab = async (withIds) => {
    const c = await api.canvas(); const meta = await page.evaluate(() => window.SALAT.meta()); let ids = null;
    if (withIds) { const b64 = await page.evaluate(() => window.SALAT.idsB64()); ids = new Int32Array(new Uint8Array(Buffer.from(b64, 'base64')).buffer); }
    return Object.assign(c, { meta, ids });
  };
  api.close = () => browser.close();
  return api;
}
module.exports = { open, sha, ROOT, OUT, HARNESS };
