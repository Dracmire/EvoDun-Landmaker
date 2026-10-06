/* UI test: channel roles, flip Y, ambiguity warnings, load errors, manifest round trip, graded masks.
     python3 tools/ui/gen_maps.py && NODE_PATH=$(npm root -g) node tools/ui/test_roles.js */
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const { open, MAPS, mapFile, CACHE } = require('./common');
(async () => {
  const a = await open(), { page, ok } = a;
  const msg = () => page.$eval('#msg', (e) => (e.hidden ? '' : e.textContent));
  const info = () => page.$eval('#rolesInfo', (e) => e.innerText);
  const roles = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#roles select')].map((s) => [s.id.slice(2), s.value])));
  const ids = (row) => page.evaluate((r) => Array.from(window.__evo.packs.image.pack.fields.zone.ids.slice(r * 256, r * 256 + 256)), row);
  const files = (dir, names) => page.setInputFiles('#file', names.map((n) => mapFile(dir, n)));
  const setMaxnode = async (v) => { await page.fill('#maxnode', String(v)); await page.dispatchEvent('#maxnode', 'change'); await a.idle(); };

  await files('maps', ['height', 'zones', 'edges']); await page.waitForTimeout(1200); await a.idle();
  ok('default roles come from the file names', JSON.stringify(await roles()) === JSON.stringify({ elevation: '0:V', zone: '1:H', edge: '2:H', path: '', vegetation: '', poi: '' }), JSON.stringify(await roles()));
  const p1 = await page.evaluate(() => { const p = window.__evo.packs.image.pack; return { w: p.width, h: p.height, n: p.fields.zone.info.classes.length, edge: p.fields.edge.info.classes.map((c) => c.label).join() }; });
  ok('native size 256x256 and 12 zones deduced', p1.w === 256 && p1.h === 256 && p1.n === 12);
  ok('edge map classes are labelled barrier / pass', p1.edge === 'barrier,pass', p1.edge);
  const deduced = await ids(128); await setMaxnode(12);
  const withMax = await ids(128), truth = JSON.parse(fs.readFileSync(path.join(MAPS, 'zid_row128.json'), 'utf8'));
  ok('maxnode=12 gives the same ids as the deduced centres', JSON.stringify(withMax) === JSON.stringify(deduced));
  ok('ids match the generator ground truth (row 128)', JSON.stringify(withMax) === JSON.stringify(truth));

  await files('maps', ['height', 'zones_dirty']); await page.waitForTimeout(1200); await a.idle();
  ok('ambiguity warning counts the 70 injected pixels (deduced mode)', /zone: 70 px/.test(await msg()), await msg());
  await files('maps', ['combined']); await page.waitForTimeout(1200); await a.idle();
  ok('a single image defaults to elevation = V', (await roles()).elevation === '0:V' && (await roles()).zone === '');
  await page.selectOption('#r-zone', '0:H'); await a.idle();
  ok('combined image: low V is reported as ambiguous hue', /zone: \d+ px/.test(await msg()), await msg());

  await files('maps', ['height', 'zones']); await page.waitForTimeout(1200); await a.idle(); await setMaxnode(12);
  const r10 = await ids(10), r245 = await ids(245); await page.check('#flipy'); await a.idle();
  ok('flip Y swaps rows', JSON.stringify(await ids(10)) === JSON.stringify(r245) && JSON.stringify(await ids(245)) === JSON.stringify(r10));
  const e0 = await page.evaluate(() => Array.from(window.__evo.packs.image.pack.elevation.slice(0, 3)));
  await page.uncheck('#flipy'); await a.idle();
  ok('flip Y applies to the elevation too', JSON.stringify(e0) === JSON.stringify(await page.evaluate(() => Array.from(window.__evo.packs.image.pack.elevation.slice(255 * 256, 255 * 256 + 3)))));

  const before = await page.evaluate(() => window.__evo.packs.image.pack.width);
  await files('maps', ['height', 'small128']); await page.waitForTimeout(800); await page.selectOption('#r-zone', '1:H'); await a.idle();
  ok('images of different size: error naming both files', /height\.png 256x256, small128\.png 128x128/.test(await msg()), await msg());
  await files('maps', ['notapng']); await page.waitForTimeout(500);
  ok('not a PNG: clear message', /notapng\.png: PNG: not a PNG file/.test(await msg()), await msg());
  const good = fs.readFileSync(mapFile('maps', 'small128')), inter = Buffer.from(good); inter[28] = 1; inter.writeUInt32BE(zlib.crc32(inter.subarray(12, 29)) >>> 0, 29);
  const ip = path.join(CACHE, 'interlaced.png'); fs.writeFileSync(ip, inter); await page.setInputFiles('#file', [ip]); await page.waitForTimeout(500);
  ok('interlaced PNG is rejected with a clear message', /interlaced \(Adam7\)/.test(await msg()), await msg());
  ok('failed loads keep the previous pack', (await page.evaluate(() => window.__evo.packs.image.pack.width)) === before);

  await files('maps', ['height', 'zones', 'edges']); await page.waitForTimeout(1200); await a.idle(); await setMaxnode(12); await page.check('#flipy'); await a.idle();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#saveManifest')]);
  const mp = path.join(CACHE, 'saved_pack.json'); await dl.saveAs(mp);
  await page.uncheck('#flipy'); await page.fill('#maxnode', ''); await page.dispatchEvent('#maxnode', 'change');
  await page.setInputFiles('#file', [mp, ...['edges', 'zones', 'height'].map((n) => mapFile('maps', n))]); await page.waitForTimeout(1200); await a.idle();
  const rr = await roles();
  ok('manifest restores roles, maxnode and flip Y (files in any order)', rr.elevation === '2:V' && rr.zone === '1:H' && rr.edge === '0:H' && (await page.inputValue('#maxnode')) === '12' && (await page.isChecked('#flipy')), JSON.stringify(rr));
  await page.setInputFiles('#file', [mp, mapFile('maps', 'height')]); await page.waitForTimeout(800);
  ok('manifest naming a missing image: clear message', /zones\.png, which is not among the selected files/.test(await msg()), await msg());

  await files('maps', ['height', 'path', 'vegetation', 'poi']); await page.waitForTimeout(1200); await a.idle();
  ok('graded masks are assigned by file name and counted', /path: \d+ tiles/.test(await info()) && /vegetation: \d+ tiles/.test(await info()) && /poi: 54 tiles/.test(await info()), await info());
  await (await page.$('#t-masks')).click(); await a.idle();
  ok('no console errors', a.errs.length === 0, JSON.stringify(a.errs));
  await a.browser.close();
})();
