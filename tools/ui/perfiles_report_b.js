/* Tables of research/octopath2/perfiles_resultado.md from the JSON of tools/ui/perfiles_walk.js:  node tools/ui/perfiles_report_b.js <perfiles_pasos.json> */
const d = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8')), f1 = (x) => x.toFixed(1), pc = (x) => (100 * x).toFixed(1) + ' %', f2 = (x) => x.toFixed(2);
const NAME = { perfil_m1: 'M1 · Ascensión × P1 · DAC 14', perfil_m2: 'M2 · Diorama × P1 · Diorama 30 reducido a mano', perfil_m3: 'M3 · Cake × P3 · Cake 19', perfil_c0: 'C0 · control · DAC 44' };
const out = ['| Mockup | Sala (tipo, dirección) | Largo × ancho (H) | Ancho medio (H) | Perfil | Relieve dentro de la sala | Vacío % (k4 · máx k0–k8) | Billboards % (k4 · máx) | Héroe (k4) | Recinto visible en k4 |', '|---|---|---|---|---|---|---|---|---|---|'];
const PROF = { perfil_m1: 'DAC 14 queda «ninguno» por la tabla (extensión 16,3 H > 12); con ancho medio 5,7 H cae en el hueco 5–6 H', perfil_m2: 'extensión 7,3 H: P2 por ancho, pero largo 16,0 H ≤ 1 toma → «ninguno» estricto; ancho medio 3,9 H ≈ 4 H (forma P1)', perfil_m3: 'P3/P4 (cabe en una toma, 10,1 × 9,5 H)', perfil_c0: 'ninguno (63,1 × 41,5 H, 61 H de profundidad)' };
const TYPE = { perfil_m1: 'Ascension', perfil_m2: 'Diorama', perfil_m3: 'Cake', perfil_c0: 'Cake' };
for (const [id, r] of Object.entries(d)) {
  const i = r.info, k4 = r.rows[4], maxBg = Math.max(...r.rows.map((x) => x.bg)), maxBill = Math.max(...r.rows.map((x) => x.bill));
  out.push(`| ${NAME[id]} | ${i.rid} (${TYPE[id]}, ${i.dir}) | ${f1(i.LH)} × ${f1(i.WH)} | ${f1(i.meanWH)} | ${PROF[id]} | ${f2(i.reliefH)} H en ${i.levels} niveles | ${pc(k4.bg)} · ${pc(maxBg)} | ${pc(k4.bill)} · ${pc(maxBill)} | ${pc(k4.hf)}, fy ${f2(k4.fy)} | ${k4.enc.visible} de ${k4.enc.total} tiles (${pc(k4.enc.share)} de la pantalla) |`);
}
out.push('', '### Caminata k0…k8 (hacia la meta, por el camino de `props`)', '');
for (const [id, r] of Object.entries(d)) {
  out.push(`**${NAME[id]}** (camino de ${r.info.path.length} tiles; tile de cada paso en coordenadas de ventana)`, '', '| paso | tile | héroe | fy | vacío | billboards | recinto visible (tiles) | recinto (pantalla) |', '|---|---|---|---|---|---|---|---|');
  for (const x of r.rows) out.push(`| ${x.k} | (${x.tile[0]}, ${x.tile[1]}) | ${pc(x.hf)} | ${f2(x.fy)} | ${pc(x.bg)} | ${pc(x.bill)} | ${x.enc.visible} / ${x.enc.total} | ${pc(x.enc.share)} |`);
  out.push('');
}
console.log(out.join('\n'));
