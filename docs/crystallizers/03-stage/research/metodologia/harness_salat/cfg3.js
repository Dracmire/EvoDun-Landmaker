const M = require('./measure.js'); const W = 41, Yz = (z) => 55 - z, ix = (x, z) => Yz(z) * W + x; const R = (x0, x1, z0, z1) => M.rectTiles(x0, x1, z0, z1);
const ORDER = ['s1', 's2', 's3', 'm1', 'm2', 'm3', 'n1', 'n2', 'n3'];
const POS = { s1: [20, 19], s2: [18, 19], s3: [22, 19], m1: [20, 27], m2: [18, 29], m3: [22, 29], n1: [20, 35], n2: [23, 35], n3: [17, 35] };
const HF = { s: 0.108, m: 0.128, n: 0.128 }, grp = (p) => p[0];
const HS0 = { s: [0.5, 0.47], m: null, n: [0.63, 0.54] }; // n fy is replaced by the rule (f)
const OWN = { A6: ['s1', 's2', 's3', 'n1', 'n2', 'n3'], A3a: ['m1', 'm2', 'm3', 'n1', 'n2', 'n3'], A3b: ['s1', 's2', 's3', 'n1', 'n2', 'n3'], A4: ['m1', 'm2', 'm3', 'n1', 'n2', 'n3'], C3: ORDER.slice(), C2: ['s1', 's2', 's3'], B3: ['s1', 's2', 's3'] };
const TR = ['A6', 'A3a', 'A3b', 'A4', 'C3', 'C2', 'B3'];
const rectSet = (x, z, w, d) => R(x, x + w - 1, z, z + d - 1);
// posts of A6
const postSet = (runs) => { const s = new Set(); for (const [a, b, z, list] of runs) for (const [p0, p1] of list) for (let x = p0; x <= p1; x++) s.add(ix(x, z)); return s; };
const A6N = { all: R(8, 32, 38, 38), posts: postSet([[8, 32, 38, [[8, 9], [12, 13], [16, 17], [20, 21], [24, 25], [28, 29], [31, 32]]]]) };
const A6S = { all: new Set([...R(8, 16, 17, 17), ...R(24, 32, 17, 17)]), posts: postSet([[8, 16, 17, [[8, 9], [12, 13], [16, 16]]], [24, 32, 17, [[24, 25], [28, 29], [32, 32]]]]) };
for (const g of [A6N, A6S]) g.rail = new Set([...g.all].filter((i) => !g.posts.has(i)));
module.exports = { M, W, Yz, ix, R, ORDER, POS, HF, grp, HS0, OWN, TR, rectSet, A6N, A6S };
