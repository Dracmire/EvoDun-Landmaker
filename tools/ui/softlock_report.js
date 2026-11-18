/* Tables of docs/crystallizers/03-stage/research/octopath2/softlock_resultado.md from the JSON of tools/ui/softlock_walk.js:  node tools/ui/softlock_report.js <softlock_pasos.json> */
const d = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8')), f3 = (x) => x.toFixed(3), f2 = (x) => x.toFixed(2), pc = (x) => (100 * x).toFixed(2) + ' %';
const out = [];
out.push('| Sala (ejemplo) | heroFrac base | Perfil | Rol de E.orient | Sur: empieza a crecer (hf ≥ 1,02 × k0) | Sur: máximo (paso, hf, fy) | Norte: mínimo (paso, hf, fy) | Detenida (sur / norte) | Dif. vs curva exacta (máx) | Dif. vs fórmula del modelo (máx) |', '|---|---|---|---|---|---|---|---|---|---|');
for (const r of d.runs) {
  const S = r.rows.filter((x) => x.step[0] === 'k'), N = r.rows.filter((x) => x.step[0] === 'n'), h0 = S[0].hf;
  const grow = S.find((x) => x.hf >= 1.02 * h0), mx = S.reduce((p, q) => (q.hf > p.hf ? q : p)), mn = N.reduce((p, q) => (q.hf < p.hf ? q : p));
  const stopS = S.filter((x) => x.near).map((x) => x.step), stopN = N.filter((x) => x.far).map((x) => x.step);
  const de = Math.max(...r.rows.map((x) => Math.abs(x.hf / x.predExact - 1))), dm = Math.max(...r.rows.map((x) => Math.abs(x.hf / x.predModel - 1)));
  out.push(`| ${r.ex} · sala ${r.room} (${r.axis.L} × ${r.axis.W}; sur ${f2(r.axis.south)} / norte ${f2(Math.abs(r.axis.north))} tiles) | ${r.hf0} | ${r.prof} | ${r.axis.dir} | ${grow ? grow.step : 'nunca'} | ${mx.step}, ${f3(mx.hf)}, ${f2(mx.fy)} | ${mn.step}, ${f3(mn.hf)}, ${f2(mn.fy)} | ${stopS.length ? stopS[0] + '…' + stopS[stopS.length - 1] : '–'} / ${stopN.length ? stopN[0] + '…' + stopN[stopN.length - 1] : '–'} | ${pc(de)} | ${pc(dm)} |`);
}
out.push('', '### Pasos (heroFrac medido / predicho exacta / fy / distancia héroe-cámara en H / detenida)', '');
for (const r of d.runs) {
  if (r.prof === 'off' || r.hf0 !== 0.1 && r.hf0 !== 0.14 && r.hf0 !== 0.12) continue;
  if (!(r.ex === 'mockt_z14' || r.ex === 'mockt_x44')) continue;
  if (r.ex === 'mockt_x44' && r.prof === 'auto') continue;
  out.push(`**${r.ex} sala ${r.room} · perfil ${r.prof} · heroFrac ${r.hf0}**`, '', '| paso | t (tiles) | hf medido | hf predicho (exacta) | hf predicho (modelo) | fy | dist. (H) | detenida |', '|---|---|---|---|---|---|---|---|');
  for (const x of r.rows) out.push(`| ${x.step} | ${x.t} | ${f3(x.hf)} | ${f3(x.predExact)} | ${f3(x.predModel)} | ${f2(x.fy)} | ${f2(x.distH)} | ${x.near ? 'near' : x.far ? 'far' : '–'} |`);
  out.push('');
}
out.push('### Barrido del margen near (z14, narrow, heroFrac 0,10, hero en el borde sur)', '', '| mN (H) | hf | fy |', '|---|---|---|');
for (const s of d.sweep) out.push(`| ${s.mN} | ${f3(s.hf)} | ${f2(s.fy)} |`);
console.log(out.join('\n'));
