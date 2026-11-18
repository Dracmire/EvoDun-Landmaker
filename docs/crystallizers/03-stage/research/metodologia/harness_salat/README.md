# harness_salat — arnés del preparador (sala de prueba T, R1.5 v322)

Escrito por el subagente preparador. Se usa en el visor congelado `e882c5c` sin tocar `src/`: el pack y las piezas se inyectan en la página. Es investigación, no código del visor.

## Rutas fijas (hay que reproducirlas, o crear enlaces simbólicos)
- `/home/claude/salat/wt`: worktree de `e882c5c` (`git worktree add /home/claude/salat/wt e882c5c`).
- `/home/claude/salat/harness`: este directorio (copiarlo ahí).
- `/home/claude/salat/scratch`: copiar ahí `scratch/tuned.json`.
- `/home/claude/salat/out3`: salida.

## Orden
1. `node run3.js`: renderiza todos los estados de la Enmienda 3 con los parámetros de `scratch/tuned.json`. Escribe `scratch/results3.json`.
2. `node write3.js`: escribe en `out3` los PNG, `presencia.txt`, `medidas_v1.txt` y `SHA256SUMS`.

## Referencia para la Verificación 2
- `entrega_out3/`: la entrega del preparador (`SHA256SUMS` de los 68 PNG, `presencia.txt`, `medidas_v1.txt`, sondas del panel de A4b).
- `scratch/results3.json`: sus medidas en bruto.

Los demás `.js` son sondas y versiones anteriores (`run.js`, `run2.js`, `t*.js`, `probe*.js`). Se guardan para auditoría; no hacen falta para reproducir.
