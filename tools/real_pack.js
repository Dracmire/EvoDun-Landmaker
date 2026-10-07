/* The real map data/samples/skeleton_heightmap_256.png as a pack built EXACTLY like the viewer does for a single image: E.decodePng -> E.imageChannels (float32 planes) ->
   E.packFromRoles with elevation = channel V (the viewer's default role for one image). Every rooms test and tool uses this helper: a hand-made `v / max * 1000` differs in
   the last float bits (land range 66.66666412 vs 66.66667175) and that is enough to move the terraces.
     const { W, H, mk } = await require('./real_pack.js').load(E, opts);   // mk() = a fresh pack each call */
const fs = require('fs'), path = require('path');
exports.FILE = path.join(__dirname, '../data/samples/skeleton_heightmap_256.png');
exports.load = async (E, o = {}) => {
  const dec = await E.decodePng(fs.readFileSync(o.file || exports.FILE)), im = Object.assign({ name: path.basename(o.file || exports.FILE), dec }, E.imageChannels(dec, !!o.flipY));
  const mk = () => E.packFromRoles([im], { elevation: { image: 0, channel: o.channel || 'V' } }, { name: im.name, maxnode: 0, markers: [] });
  return { W: im.width, H: im.height, mk, dec };
};
