/* Rooms on with zero rooms: the Snake Mountain surface (40x40, the default source) with rooms on and the Default parameters draws exactly like rooms off (Box, A, B) and the info says why.
     NODE_PATH=$(npm root -g) node tools/ui/test_norooms_ui.js */
const crypto = require('crypto');
const { open } = require('./common');
(async () => {
  const a = await open({ w: 1500, h: 900 }), page = a.page, ok = a.ok;
  const hash = async () => crypto.createHash('md5').update(await a.canvas()).digest('hex'), info = () => page.evaluate(() => document.querySelector('#info').textContent);
  ok('the default source is the Snake Mountain surface', (await page.evaluate(() => window.__evo.st.pack)) === 'snake_surface' && (await page.$$eval('#src option', (o) => o.map((x) => x.value))).join() .startsWith('snake_surface,snake'));
  await page.click('#mode'); await a.idle();
  const off = {}, on = {};
  for (const t of ['box', 'A', 'B']) { await a.tech(t); await a.preset('isoE'); } // warm-up: the first draw of a technique may differ from the settled one
  for (const t of ['box', 'A', 'B']) { await a.tech(t); await a.preset('isoE'); off[t] = await hash(); }
  const size = () => page.evaluate(() => { const c = [...document.querySelectorAll('#stage canvas')].find((x) => !x.closest('figure').hidden); return [c.width, c.height, c.clientWidth, c.clientHeight]; });
  const sizeOff = await size();
  await page.check('#t-rooms'); await a.idle();
  const sizeOn = await size();
  ok('the canvas has the same size with rooms off and on, and its bitmap equals its laid-out size (the info line has a fixed height)', sizeOff.join() === sizeOn.join() && sizeOn[0] === sizeOn[2] && sizeOn[1] === sizeOn[3], `off ${sizeOff.join('x')} on ${sizeOn.join('x')}`);
  for (const t of ['box', 'A', 'B']) { await a.tech(t); await a.preset('isoE'); on[t] = await hash(); }
  for (const t of ['box', 'A', 'B']) ok(`rooms on = rooms off, same pixels (${t})`, on[t] === off[t]);
  const txt = await info();
  ok('the info says: no rooms found (map too small ... 40 x 40, room radius 9) - rooms layer not applied', txt.includes('Rooms: no rooms found (map too small for these parameters: 40 x 40, room radius 9) - rooms layer not applied'), txt.slice(-200));
  ok('the info does not call the map non-walkable (it has walk regions)', /regions in the map/.test(txt) && !/isolated/.test(txt));
  await page.uncheck('#t-rooms'); await a.idle(); ok('rooms off: no rooms line', !(await info()).includes('no rooms found'));
  console.log('errors:', a.errs); await a.browser.close(); process.exit(process.exitCode || (a.errs.length ? 1 : 0));
})();
