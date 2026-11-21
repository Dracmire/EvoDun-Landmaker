# Brief H5 · Interior — pasada 1 de 2 (A594)

Para: CC (construye y mide). Diseña: [R]. Mergea y juzga: [U].
Destino en el repo: `docs/crystallizers/03-stage/research/octopath2/stage_h5_interior_go.md`.
Base: main `519df5d`. Hoja de origen: **top-down (DQ3)**; el trono viene de DQ3 (A593).
Regla de este brief: cada ítem cita H5 y su criterio de descarte (`HIPOTESIS.md`, reglas de uso 1–3). Un ítem sin cita no se hace.

## 0. Qué se prueba

**H5 (afirmación).** Un interior es una sala cerrada por muros, con el muro frontal cortado (cutaway): un hub simétrico en el eje, con la meta al fondo. Suelo, muros y pilares son geometría.

**Lo que esta pasada decide** (método: `research/metodologia/PROTOCOLO_PRUEBAS.md` v322, adaptado):
1. **Presencia:** ¿la regla del cutaway (`planes`: BACK cierra, FRONT baja) funciona sola en interiores que nadie armó a mano?
2. **Necesidad (quita-uno):** en el trono, ¿cada parte 3D hace falta? Si se quita y no pierde nada, el 3D era solo piso, o sea, HD-2D falso (definición de [U], A590).
3. **Fallas:** requisito previo; no prueban nada.

**Criterios de descarte de H5** (fijados aquí, antes de medir; reemplazan los de `HIPOTESIS.md`):
- **D1 · Presencia.** Si el cutaway por regla cumple F1 y F2 (§3) en menos de 2/3 de las salas interiores (§1.1), la regla no es general: H5 **cambia** (el corte pasa a ser dato declarado por sala).
- **D2 · Necesidad.** Si «sin altura» (X4) **y** «sin muros ni pilares» (X1 + X2) no pierden contra TECHO en al menos 2/3 de las posiciones, según [U] mirando, **y** la masa alta M (§3) no cae al menos un 50 %, el 3D es solo piso: H5 se **descarta** como composición.
- **D3 · Fallas.** Billboards por encima del 30 % o héroe tapado en cualquier posición de TECHO: se **para** la pasada y se informa, sin juicio.

No se ajusta ningún parámetro para salvar H5. Esta es la pasada 1 de 2.

## 1. Ítems

### 1.1 Presencia del cutaway en salas no armadas · H5 · D1
- Universo: las salas **Ascension** de «Balanced types» según `E.s3.roomTypes.classify` (las que la cadena cierra con muros; `HIPOTESIS.md` H4 dice 41 de 88: **re-medir**, no copiar).
- Cada sala es una ventana de una sala en el modo 3, con `orient`, `planes` y `props` ON, `volumes` y `objects` vacíos, Cam 6, la yaw de `orient`, `tilesPerH` 1,5 y `heroFrac` 0,10 (v325 §1.6).
- La ventana la inyecta el arnés, **sin tocar `src/`**. Si no se puede sin `src/`, se para y se pregunta.
- Caminata k0–k8 por el camino de `props`, como en `tools/ui/perfiles_walk.js`.
- Por sala se informan F1 y F2 en cada posición, y si la sala cumple en al menos 7 de 9.
- El Diorama 31 (F9 de PENDIENTES) se mide igual y se informa aparte; no entra en el conteo de D1.

### 1.2 Quita-uno en el trono · H5 · D2
- **TECHO** = `throne_aliahan` como está en main (volúmenes, cintas y objetos del commit 3).
- **SUELO** = el mismo, con `planes`, `volumes`, `objects` y `props` en OFF.
- Estados a generar, uno por elemento, cambiando **solo** ese elemento:

  | Estado | Qué se quita | Cómo |
  |---|---|---|
  | X1 | los 6 pilares | quitar las 6 entradas `pillar` de `volumes` |
  | X2 | los 3 muros (N, O, E) | quitar las 3 entradas `wall` de `volumes` |
  | X3 | el corte frontal | gancho `noFront` de `planes` (existe en `src/s3/planes.js` L48) |
  | X4 | la altura | todo el piso transitable a un solo subnivel y los volúmenes a 0; si no se puede sin `src/`, X4 sale con su motivo (V1.4) |
  | X5 | los billboards | `objects` OFF y props sin billboards |

- Posiciones: las 3 salidas de la caminata de `tools/ui/test_throne_world_ui.js` (eje a 3 baldosas viejas del estrado, borde sur de la alfombra, 4 baldosas fuera del eje), más k0, k4 y k8 del camino de `props`. Son 6 posiciones.
- Por estado y posición se mide §3 y se guarda una captura. **Sin nombres en las capturas** (A, B…); el mapa de nombres va con su sha256 en un archivo aparte, que se abre después del juicio de [U].

### 1.3 Corrección de `HIPOTESIS.md` · H5
En «Falta», el commit 2 (volúmenes) y el corte frontal **ya existen** en main: `src/modes.js` L232–238 y `src/s3/planes.js` L48 (fila 12 de `map1.txt`). Se cambia el texto a «hecho» con esas referencias, y los descartes D1–D3 de este brief reemplazan el apartado «Descarte» de H5. Nada más se toca.

## 2. Predicciones (las congela [R] con hash antes de que CC corra)
Van en `PREDICCION_H5_p1.md`, con su sha256 en la ficha del PR. CC no las abre hasta terminar de medir.

## 3. Medidas (con los instrumentos que ya existen; ninguna nueva salvo M)
- **F1 · Héroe visible:** el héroe no pierde más del 25 % de sus píxeles por geometría (render de selección).
- **F2 · Fondo vacío:** como mide `perfiles_walk.js`; cumple si es ≤ 2 %.
- **B · Billboards:** como en `test_throne_world_ui.js` L175–195; cumple si es ≤ 30 %.
- **M · Masa alta (nueva, la única):** porcentaje del panel cuyo píxel en el render de selección es geometría (terreno, volumen, planos) con su tope al menos 1 H por encima del piso donde está el héroe. Se informa en total y por tercios (izquierda, centro, derecha). Es la medida de la relación vertical de A590: en un HD-2D falso, M está cerca de 0.
- **Encierro visto:** como en `perfiles_walk.js`; se informa, no decide.

## 4. Juicio de [U] (no lo hace CC ni ningún agente)
- 5 pares TECHO contra TECHO − X en las 6 posiciones (30 pares), más 3 pares de control TECHO contra SUELO. Orden al azar y sin nombres.
- Pregunta, una sola: **«¿Cuál integra mejor espacio, personaje y acción?»** (A590).
- Validez: si TECHO no gana a SUELO en los 3 controles, el juicio es **inválido**, no negativo, y se informa.

## 5. Paradas (CC para y pregunta)
- Cualquier cambio en `src/`, salvo lo de §1.3, que es solo documentación.
- La cadena DAC original llamada desde el modo 3, o cámaras tocadas (Cam 1–8 sin cambios).
- Un estado que cambie algo fuera de su elemento (diff fuera de su caja).
- D3 en TECHO.

## 6. Verificación (carril rápido, ≤ 10 min, CLAUDE.md)
Tests node y UI afectados, con `--only`; la tabla de hashes de 24 estados. Sin `regress --sample` salvo que el diff toque código compartido, lo que no debería pasar.

## 7. Entrega
Ficha `docs/crystallizers/03-stage/entregas/PR-<n>.md` con sus cuatro tablas: presencia por sala (§1.1), medidas por estado y posición (§1.2), capturas con su mapa sha256, y la verificación. Sin firmas en commits ni en el PR.
