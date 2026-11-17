const M = require('./measure.js'); const { rectTiles } = M;
const POS = { s1: [20, 19], s2: [18, 19], s3: [22, 19], m1: [20, 27], m2: [18, 29], m3: [22, 29], n1: [20, 35], n2: [23, 35], n3: [17, 35] };
const ORDER = Object.keys(POS);
const lip = rectTiles(8, 32, 38, 38);
const POSTS = (() => { const s = new Set(); for (const [a, b] of [[8, 9], [12, 13], [16, 17], [20, 21], [24, 25], [28, 29], [31, 32]]) for (let x = a; x <= b; x++) s.add((55 - 38) * 41 + x); return s; })();
const RAILONLY = new Set([...lip].filter((i) => !POSTS.has(i)));
const CAND = { // candidate tile sets of each trick (V1.4 a)
  A6: lip, A4: rectTiles(18, 22, 52, 55), C3: rectTiles(17, 22, 28, 33), B3: rectTiles(10, 13, 22, 26),
  C2: new Set([...rectTiles(14, 15, 16, 17), ...rectTiles(25, 26, 16, 17)]),
};
module.exports = { POS, ORDER, lip, POSTS, RAILONLY, CAND, M };
module.exports.HS = { s1: [0.5, 0.5], s2: [0.5, 0.5], s3: [0.5, 0.5], m1: null, m2: null, m3: null, n1: [0.63, 0.54], n2: [0.63, 0.54], n3: [0.63, 0.54] };
