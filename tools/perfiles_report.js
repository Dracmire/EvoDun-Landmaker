/* Markdown of research/octopath2/perfiles_clasificacion.md from the JSON of tools/perfiles_clasificacion.js:  node tools/perfiles_report.js <perfiles_clasificacion.json> */
const d = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8')), R = d.rows, f1 = (x) => (x === undefined || x === null ? '–' : x.toFixed(1));
const med = (a) => { const s = a.slice().sort((p, q) => p - q); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const PROF = ['P1', 'P2', 'P3/P4', 'ninguno'], TYPES = ['Diorama', 'Ascension', 'Cake'], out = [];
const cell = (key, p, t) => R.filter((r) => r[key] === p && r.type === t).length;
out.push('# Clasificación de las 88 salas de «Balanced types» en perfiles de forma (Parte A, T2)', '',
  'Solo medición: no se tocó `src/`. Herramienta: `tools/perfiles_clasificacion.js` (los datos crudos: `perfiles_clasificacion.json`) y `tools/perfiles_report.js` (este documento). Tabla de perfiles y umbrales: `perfiles_forma.md` §2, sin moverlos.', '',
  '## 1. Cómo se midió', '',
  `- **Salas:** las ${d.rooms} del mapa real con «Balanced types» (terrazas ${d.P.terraces}, núcleo mínimo ${d.P.roomsMinCore}, radio ${d.P.rRadius}, minPlateau ${d.P.minPlateau}); tipos DAC de la clasificación del mapa entero: ${d.counts.Cake} Cake / ${d.counts.Diorama} Diorama / ${d.counts.Ascension} Ascension (las cifras del proyecto). Terreno de la Base v2.4: terraza 1,25 H (terH ${d.P.terH} tiles), subs ${d.P.subs}, \`tilesPerH\` ${d.P.tilesPerH}; transiciones del ejemplo \`dac_stage\` (escalones, tread 1, variante de relleno). Es el mismo P de los ejemplos de la Parte B.`,
  '- **Dirección, largo y ancho:** `E.orient` con cada sala como ventana de UNA sala (como `mockt_z14` y `mockt_x44`; no hay un orden de 88 salas que dé puertas de entrada y salida, así que el eje va de la parte más baja a la más alta). Largo = extensión de los tiles caminables a lo largo del eje, ancho = de través, ambos en H (tiles / 1,5). Además se da el **ancho medio** (tiles caminables / dimensión larga).',
  '- **Perfil (tabla de §2, sin mover umbrales):**',
  '  - Z o X: el **ancho** es la dimensión corta de la extensión (E.orient mira a lo largo de la larga en los dos casos). P1 si 3–5 H, P2 si 6–12 H, y el **largo** debe ser de más de una toma (> 17 H, «varias tomas»). Un ancho entre 5 y 6 H, menor de 3 H o mayor de 12 H = ninguno.',
  '  - Hub: P3 si cabe en una toma (≤ 18 H de través y ≤ 17 H de fondo, la referencia de §2). **P4 (Hub deep) tiene las mismas dimensiones que P3**: lo que lo distingue es un fondo o hito lejano visible detrás, que no sale de las dimensiones de la sala; por eso se cuentan juntos como **P3/P4** y no se separan.',
  '  - P5 y P6 son interiores y no se aplican a estas salas.',
  '- **Casos en el límite** (se cuentan aparte; la clasificación principal es la estricta): ancho en el hueco 5–6 H de la tabla, forma de P1/P2 con largo de una sola toma, ancho o largo a menos del 10 % de un umbral, Hub a menos del 10 % del borde de la toma, y razón largo/ancho a menos del 5 % del umbral de dirección (1,5 / 0,67).', '');
const none = R.filter((r) => r.profile === 'ninguno'), prof = R.filter((r) => r.profile !== 'ninguno');
out.push('## 2. Resultado', '',
  `**T2 (la mayoría de las salas no entra en ningún perfil): ${none.length > R.length / 2 ? 'SE CUMPLE' : 'NO SE CUMPLE'}.** ${none.length} de ${R.length} salas (${(100 * none.length / R.length).toFixed(0)} %) quedan en «ninguno»; ${prof.length} entran en un perfil.`, '',
  '### Matriz perfil × tipo DAC (conteo de salas)', '', '| Perfil | Diorama | Ascension | Cake | Total |', '|---|---|---|---|---|');
for (const p of PROF) out.push(`| ${p === 'ninguno' ? '**ninguno**' : p} | ${TYPES.map((t) => cell('profile', p, t)).join(' | ')} | ${R.filter((r) => r.profile === p).length} |`);
out.push(`| **Total** | ${TYPES.map((t) => R.filter((r) => r.type === t).length).join(' | ')} | ${R.length} |`, '');
out.push('Direcciones (`E.orient`) por tipo:', '', '| Dirección | Diorama | Ascension | Cake | Total |', '|---|---|---|---|---|');
for (const dn of ['Z', 'X', 'Hub']) out.push(`| ${dn} | ${TYPES.map((t) => R.filter((r) => r.dir === dn && r.type === t).length).join(' | ')} | ${R.filter((r) => r.dir === dn).length} |`);
out.push('');
const nz = none.filter((r) => r.dir !== 'Hub'), nh = none.filter((r) => r.dir === 'Hub');
out.push('### Las salas en «ninguno»', '',
  `- ${none.length} salas: ${nz.length} Z o X y ${nh.length} Hub.`,
  `- **Ancho típico** (mediana, dimensión corta de la extensión): ${f1(med(none.map((r) => Math.min(r.LH, r.WH))))} H; mediana de la dimensión larga: ${f1(med(none.map((r) => Math.max(r.LH, r.WH))))} H; mediana del ancho medio: ${f1(med(none.map((r) => r.meanWH)))} H. Rango del ancho: ${f1(Math.min(...none.map((r) => Math.min(r.LH, r.WH))))}–${f1(Math.max(...none.map((r) => Math.min(r.LH, r.WH))))} H.`,
  `- Z o X en «ninguno» (${nz.length}): ancho típico (mediana) ${f1(med(nz.map((r) => Math.min(r.LH, r.WH))))} H, largo típico ${f1(med(nz.map((r) => Math.max(r.LH, r.WH))))} H. Hub en «ninguno» (${nh.length}): ${f1(med(nh.map((r) => r.WH)))} × ${f1(med(nh.map((r) => r.LH)))} H (de través × de fondo), contra una toma de 18 × 17 H.`,
  `- Por qué quedan en «ninguno» (la razón de la clasificación estricta): ${Object.entries(none.reduce((a, r) => { const k = r.reason.startsWith('forma') ? 'forma P1/P2 pero largo de una sola toma' : r.reason.startsWith('no cabe') ? 'Hub que no cabe en una toma' : r.reason.includes('> 12') ? 'ancho > 12 H' : r.reason.includes('< 3') ? 'ancho < 3 H' : r.reason.includes('entre P1') ? 'ancho en el hueco 5–6 H' : r.reason; a[k] = (a[k] || 0) + 1; return a; }, {})).map(([k, v]) => `${k}: ${v}`).join('; ')}.`, '');
const lim = R.filter((r) => r.limit.length), altChange = R.filter((r) => r.profileMeanW !== r.profile);
out.push('## 3. Casos en el límite (contados aparte; no se movió ningún umbral)', '', `${lim.length} salas tienen al menos una señal de límite (la clasificación principal ya las puso donde la tabla estricta las pone).`, '', '| Señal | Salas |', '|---|---|');
const sig = {}; for (const r of lim) for (const l of r.limit) (sig[l] = sig[l] || []).push(r.id);
for (const [k, v] of Object.entries(sig)) out.push(`| ${k} | ${v.length}: ${v.join(', ')} |`);
out.push('', `**Lectura alternativa del ancho (ancho medio en lugar de la extensión de través, solo Z y X):** ${altChange.length} salas cambiarían de perfil (${altChange.map((r) => `${r.id}: ${r.profile} → ${r.profileMeanW}`).join('; ') || 'ninguna'}). Con el ancho medio el conteo sería: ${PROF.map((p) => `${p} ${R.filter((r) => r.profileMeanW === p).length}`).join(', ')}. La clasificación principal sigue siendo la de la extensión (es lo que pide el pedido: «ancho y largo de lo caminable… a lo largo de su eje y de través»).`, '');
out.push('## 4. Tabla completa de las 88 salas', '', 'L = largo a lo largo del eje, A = ancho de través, ambos en H (extensión de los tiles caminables); A medio = tiles caminables / dimensión larga; Δh = rango de alturas del piso caminable en H (relieve dentro de la sala); razón = L / A de `E.orient`.', '',
  '| Sala | Tipo DAC | Dir. | L (H) | A (H) | A medio (H) | razón | Δh (H) | Perfil | con A medio | Razón de la clasificación | Límite |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of R) out.push(`| ${r.id} | ${r.type} | ${r.dir || '–'} | ${f1(r.LH)} | ${f1(r.WH)} | ${f1(r.meanWH)} | ${r.ratio === undefined ? '–' : r.ratio.toFixed(2)} | ${r.hRange === undefined ? '–' : r.hRange.toFixed(2)} | ${r.profile === 'ninguno' ? '**ninguno**' : r.profile} | ${r.profileMeanW === r.profile ? '=' : r.profileMeanW} | ${r.reason || r.none || ''} | ${r.limit.join('; ') || ''} |`);
console.log(out.join('\n'));
