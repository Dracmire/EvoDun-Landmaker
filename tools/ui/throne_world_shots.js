/* Screenshots of the throne world (example `throne_aliahan`, Cam 6, the yaw `orient` gives). Commit 1 wrote docs/crystallizers/03-stage/shots/throne1/ (no volumes), commit 2 shots/throne2/ (the pillars and the closing walls as volumes); commit 3 (the DRESS: ribbons, people and props, the emblem card) writes shots/throne3/: the 8 positions of the tests (the hero on the axis 3 and 6 old tiles from the dais,
   in the entrance passage, on its landing, 4 old tiles off the axis to the west and to the east, on the dais, on the throne) and two sheets WITH and WITHOUT the billboards (the objects and the props; the ribbons stay) at the axis 6 and on the dais. Our own render (no third-party image); the side-by-side with the right half of the pair goes to tools/ui/out/ (git-ignored).
     NODE_PATH=$(npm root -g) node tools/ui/throne_world_shots.js [outDir] */
const fs = require('fs'), path = require('path');
const { open } = require('./common');
const out = process.argv[2] || path.join(__dirname, '../../docs/crystallizers/03-stage/shots/throne3');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle(); await page.click('#examples button[data-id="throne_aliahan"]'); await a.idle(); await a.idle();
  const at = async (x, y) => { await ev(([x, y]) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await a.idle(); await a.idle(); };
  const shot = async (name) => { fs.writeFileSync(path.join(out, name), await a.canvas()); console.log(name, JSON.stringify(await ev(() => ({ yaw: window.__evo.view().yaw, hero: window.__evo.st.hero })))); };
  await at(17, 18); await shot('throne3_axis_3_tiles.png');
  await at(17, 24); await shot('throne3_axis_6_tiles.png');
  await at(17, 27); await shot('throne3_entrance_passage.png');
  await at(17, 31); await shot('throne3_landing.png');
  await at(9, 18); await shot('throne3_off_axis_4_tiles_west.png');
  await at(25, 18); await shot('throne3_off_axis_4_tiles_east.png');
  await at(17, 8); await shot('throne3_on_the_dais.png');
  await at(17, 6.5); await shot('throne3_on_the_throne.png');
  // the sheets: without | with the billboards (objects and props), the ribbons stay
  const sheet = async (name, x, y) => {
    await at(x, y); const withB = await a.canvas();
    await ev(() => { const e = window.__evo; window.__keepList = e.st.stage.objectList; e.st.stage.objectList = []; }); await page.click('#t-stageProps'); await a.idle(); await a.idle(); const noB = await a.canvas();
    await page.click('#t-stageProps'); await a.idle(); await ev(() => { window.__evo.st.stage.objectList = window.__keepList; window.__evo.redraw(); }); await a.idle(); await a.idle();
    const { execFileSync } = require('child_process'), tmp = path.join(out, '_w.png'), tmp2 = path.join(out, '_n.png'); fs.writeFileSync(tmp, withB); fs.writeFileSync(tmp2, noB);
    execFileSync('python3', ['-c', `from PIL import Image; a=Image.open(r'${tmp2}').convert('RGB'); b=Image.open(r'${tmp}').convert('RGB'); s=Image.new('RGB',(a.width*2+12,a.height),(40,40,40)); s.paste(a,(0,0)); s.paste(b,(a.width+12,0)); s=s.resize((s.width//2,s.height//2),Image.LANCZOS); s.save(r'${path.join(out, name)}')`]); fs.unlinkSync(tmp); fs.unlinkSync(tmp2); console.log(name);
  };
  await sheet('throne3_sheet_axis_6_without_with_billboards.png', 17, 24);
  await sheet('throne3_sheet_dais_without_with_billboards.png', 17, 8);
  console.log('errs', a.errs.length); await a.browser.close();
})();
