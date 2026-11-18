# Pedido a CC · Cam 8 «Stage comprimida» (B6 en el visor) (v323)

Decisión de [U] (2026-11-17): se aprueba tocar `src/` para B6, como una cámara nueva del banco, la **Cam 8**.

## Qué se construye
1. **`src/render.js`:** el campo opcional `view.zScale` de tu propuesta (`propuesta_B6/B6_zScale_render.diff`). Escala el suelo a lo largo del eje de la cámara antes de proyectar.
   - Con el campo ausente o en 1, la salida es idéntica byte a byte.
   - `unp`, `panFor` y la prueba de cara (`nrm`) quedan coherentes, como en el diff.
2. **Cam 8 en el banco de cámaras:**
   - Botón «Cam 8»; id a tu elección, por ejemplo `stagez`.
   - Es Cam 6 (perspectiva, FOV 30, pitch 25, mismo dolly y la misma regla de pivote) con `zScale` = 0,5.
   - Se ofrece en los modos donde se ofrece Cam 6.
   - El seguimiento del héroe del modo 3 funciona igual.
   - El valor 0,5 es una HIPÓTESIS (A223: el remake muestra 0,31–0,67); va en una constante con nombre, en un solo lugar.
3. **Manifiesto:** `viewer.camera` acepta el id nuevo (`docs/pack-format.md`).
4. **Documentación:**
   - `CLAUDE.md`, sección del banco de cámaras: Cam 8 con su contrato.
   - `docs/controls.md` y `docs/modes.md`, generados con `tools/build.py`.

## Verificación (carril por PR de CLAUDE.md)
- `node tools/test_cams.js`, ampliado: la inversa pantalla → suelo es exacta con `zScale` 0,5 y 0,67 (pick, marcas y foco). Además, un hash de Cam 6 que no cambia.
- `tools/verify.sh regress --sample 1/4`, porque es código compartido: 0 imágenes distintas en Cam 1–7.
- Como máximo 3 scripts de UI de cámara o pick, con `--only`.
- Capturas de Cam 6 y Cam 8 en dos ejemplos.
- Informa los segundos de cada comando y lo que no corrió.

## Después, las hojas de B6
Con el campo nuevo, renderiza las 6 celdas pendientes de `stage_r15_transformadores_go.md` (k = 0,67 y 0,5 × FOV 30 / 20 / 12), más SUELO en k = 0,5 / FOV 12. Usa el mismo gancho de FOV y las mismas reglas de control. Rehaz las 3 hojas completas.

## Entrega
- Una rama nueva desde `main` (por ejemplo `feat/cam8-depth`) y un PR con los commits pequeños de siempre.
- El zip de las hojas, igual que antes.
- Ningún juicio de composición.

## PARADAS
- Una imagen de Cam 1–7 cambia.
- La inversa no queda exacta.
- Una prueba falla dos veces.
