# Delta al pedido de calibración (P0, v311) — respuesta a la PARADA de CC (2026-11-16 04:44)
Complementa `claude/stage_calib_juez_go.md` (sha256 523d3b33…); no lo reemplaza. Repo solo lectura (e882c5c). CC no juzga composición.
La parada fue correcta: V1, V2 y DAC 84 por defecto salieron de sesiones anteriores (v301, v302) y sus renders no quedaron en el repo.

## Fuente de cada ítem (en este orden de preferencia)
1. **V1 y V2 del desierto: SOLO desde la hoja que [U] adjunte** (hoja de v301, «toma | V1 | V1b | V2», enviada a [U] el 2026-11-15). Recortar los paneles V1 y V2. NO exportar V1b (no se puntuó) ni el panel de la toma del desierto (no está en el set). Si la hoja no llega: PARA. No reconstruir (la rejilla del mapa viejo y `photo_readings_desert.json` eran del scratchpad de aquella sesión).
2. **DAC 84 por defecto:**
   a. Preferente: recortar el panel Cam 6 de la hoja de la sala 2 de v301 o de P0 de v302, si [U] la adjunta (es el cuadro exacto que se puntuó).
   b. Si no llega: regenerar con la receta de abajo y aceptar SOLO si coinciden las comprobaciones.
3. **Tomas 0202 y 0137:** las que encontraste (`rv_f2_0202_…`, sha256 `fe2b7b85…8d33`; `rv_f2_0137_…`, sha256 `8235f171…f629`).

## Receta de DAC 84 por defecto (v301 §5; v302 P0)
- Ejemplo `dac_stage` sin tocar; ventana = sala 84; orient, planes y props ON; volumes y objects OFF.
- Héroe por defecto en (192,5; 92,5). Cam 6 (FOV 30°, pitch 25°, sin arrastre de pitch), 1280×720.
- Panel Stage: `tilesPerH` 2, `heroFrac` 0,14, `vScale` 1, `exag` 1, «Measures in H» ON, border off.

## Comprobaciones (todas deben coincidir para aceptar el render regenerado)
- Transitable con la definición estricta de los módulos del Stage (`!block && !void && region >= 0 && !nowalk`): 283 tiles.
- Ventana 77 × 72; yaw 270; meta en (49,5; 35,5) con h 9,76 tiles; 24 niveles; camino de props de 37 tiles.
- M5a (alto del héroe / alto del panel) = 0,1378.
- W p95 = 5,00 H (tu definición de los pasos 1a–2).
- R1 = máximo |Δh| entre pares de tiles transitables 4-vecinos, en alturas de héroe = 1,12 H.
- Z1 (fracción del alto del panel por encima de la banda del héroe, definición operativa de v301: bandas en filas de pantalla relativas al hotspot, u = alto del héroe en px): v302 da 0,356. Si tu definición no da exactamente eso, infórmalo y NO lo uses para aceptar ni rechazar.
- v302 informó el hash del render P0 como `1d6b2a2a` (prefijo, algoritmo sin declarar): informa el tuyo y el algoritmo; no decide.
- Si falla alguna comprobación salvo Z1 y el hash: PARA y reporta las cifras.

## Sin cambios
Recorte sin rótulos, 1280×720 con letterbox declarado, nombres `c_XXXX.png` al azar, `MAPA_calib.json` aparte con sha256, `calib_cuadros.zip` + `HASHES_calib.sha256`. Si un panel recortado de una hoja es más chico que 1280×720, escalar con el mismo filtro para todos y declararlo.
