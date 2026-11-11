/* Screenshots of the throne world on MAP 1 v2 (example `throne_aliahan`, Cam 6, the yaw `orient` gives), our own render, the eight positions of the tests (the hero on the axis 3 old tiles from the dais, at the centre of the nave, one old tile from the south edge of the carpet and on it, 4 old tiles off the axis to the west and to the east, on the dais, on the throne):
   docs/crystallizers/03-stage/shots/throne1/ = the world (volumes and objects OFF), throne2/ = + the pillars and the closing walls (volumes ON, objects OFF), throne3/ = + the dress (all ON) and two sheets WITHOUT | WITH the billboards (objects and props; the ribbons stay) at the south edge and on the dais.
   With `--pair` it ALSO writes, to tools/ui/out/throne_v2/ (git-ignored: third-party material), one sheet per position with the REMAKE half of the paired shot on the left and the viewer on the right, both at the same hero size.
   With `--walk` it writes the walk from the door to the king (33 frames of 0.5 tile on the axis) as shots/throne3/throne3_walk.gif and a contact sheet of 8 frames.
     NODE_PATH=$(npm root -g) node tools/ui/throne_world_shots.js [--pair] [--walk] */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { open } = require('./common');
const SH = path.join(__dirname, '../../docs/crystallizers/03-stage/shots'), PAIR = process.argv.includes('--pair');
const POS = [['axis_3_tiles', 17, 18], ['axis_nave_centre', 17, 13], ['south_1_tile', 17, 21], ['south_edge', 17, 23], ['off_axis_4_tiles_west', 9, 18], ['off_axis_4_tiles_east', 25, 18], ['on_the_dais', 17, 8], ['on_the_throne', 17, 6.5]];
const py = (code) => execFileSync('python3', ['-c', code]);
(async () => {
  const a = await open({ w: 1500, h: 900, modes: true, orient: true }), page = a.page, ev = (f, x) => page.evaluate(f, x);
  await ev(() => window.__evo.setMode('stage')); await a.idle(); await page.click('#examples button[data-id="throne_aliahan"]'); await a.idle(); await a.idle();
  const at = async (x, y) => { await ev(([x, y]) => { const e = window.__evo; e.st.follow = true; e.st.hero = { x, y }; e.redraw(); }, [x, y]); await a.idle(); await a.idle(); };
  const sw = async (id, on) => { const cur = await ev((id) => document.querySelector(id).checked, id); if (cur !== on) { await page.click(id); await a.idle(); await a.idle(); } };
  for (const [n, vol, obj] of [[1, false, false], [2, true, false], [3, true, true]]) {
    const out = path.join(SH, 'throne' + n); fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
    await sw('#t-stageVolumes', vol); await sw('#t-stageObjects', obj);
    for (const [name, x, y] of POS) { await at(x, y); fs.writeFileSync(path.join(out, `throne${n}_${name}.png`), await a.canvas()); }
    console.log('throne' + n, POS.length, 'shots');
  }
  const out3 = path.join(SH, 'throne3');
  for (const [name, x, y] of [['south_edge', 17, 23], ['on_the_dais', 17, 8]]) { // without | with the billboards
    await at(x, y); const tmpN = path.join(out3, '_n.png'), tmpW = path.join(out3, `throne3_${name}.png`);
    await ev(() => { const e = window.__evo; window.__keepList = e.st.stage.objectList; e.st.stage.objectList = []; }); await sw('#t-stageProps', false); fs.writeFileSync(tmpN, await a.canvas());
    await sw('#t-stageProps', true); await ev(() => { window.__evo.st.stage.objectList = window.__keepList; window.__evo.redraw(); }); await a.idle(); await a.idle();
    py(`from PIL import Image; a=Image.open(r'${tmpN}').convert('RGB'); b=Image.open(r'${tmpW}').convert('RGB'); s=Image.new('RGB',(a.width*2+12,a.height),(40,40,40)); s.paste(a,(0,0)); s.paste(b,(a.width+12,0)); s=s.resize((s.width//2,s.height//2),Image.LANCZOS); s.save(r'${path.join(out3, `throne3_sheet_${name}_without_with_billboards.png`)}')`); fs.unlinkSync(tmpN);
  }
  if (process.argv.includes('--walk')) { // the walk from the door to the king: 33 frames of 0.5 tile on the axis -> a contact sheet of 8 frames and a GIF (our own render) in shots/throne3/
    const tmp = path.join(out3, '_walk'); fs.mkdirSync(tmp, { recursive: true }); let k = 0; for (let y = 23; y >= 7 - 1e-9; y -= 0.5) { await at(17, y); fs.writeFileSync(path.join(tmp, `f${String(k++).padStart(2, '0')}.png`), await a.canvas()); }
    py(`import glob; from PIL import Image; fs=sorted(glob.glob(r'${tmp}/f*.png')); ims=[Image.open(f).convert('RGB').resize((488,307),Image.LANCZOS) for f in fs]; pal=ims[0].quantize(64); gi=[i.quantize(64) for i in ims]; gi[0].save(r'${path.join(out3, 'throne3_walk.gif')}',save_all=True,append_images=gi[1:],duration=180,loop=0,optimize=True); pick=[ims[round(j*(len(ims)-1)/7)] for j in range(8)]; s=Image.new('RGB',(488*4+18,307*2+6),(40,40,40)); [s.paste(im,((j%4)*494,(j//4)*313)) for j,im in enumerate(pick)]; s.save(r'${path.join(out3, 'throne3_walk_contact_sheet.png')}')`);
    fs.rmSync(tmp, { recursive: true }); console.log('walk', k, 'frames'); }
  if (PAIR) { const outP = path.join(__dirname, 'out/throne_v2'); fs.mkdirSync(outP, { recursive: true }); const pair = path.join(__dirname, '../../docs/crystallizers/03-stage/refs/dq3/pairs/p_20261029_192049_throne_room_orig_remake.png');
    for (const [name] of POS) py(`from PIL import Image; p=Image.open(r'${pair}').convert('RGB'); r=p.crop((p.width//2,0,p.width,p.height)); v=Image.open(r'${path.join(out3, `throne3_${name}.png`)}').convert('RGB'); r=r.resize((round(r.width*v.height/r.height),v.height),Image.LANCZOS); s=Image.new('RGB',(r.width+v.width+12,v.height),(40,40,40)); s.paste(r,(0,0)); s.paste(v,(r.width+12,0)); s.save(r'${path.join(outP, `pair_${name}.png`)}')`);
    console.log('pair sheets', POS.length, '->', outP); }
  console.log('errs', a.errs.length); await a.browser.close();
})();
