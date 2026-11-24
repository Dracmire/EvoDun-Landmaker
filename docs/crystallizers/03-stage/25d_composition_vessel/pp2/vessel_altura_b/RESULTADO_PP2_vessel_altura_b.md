# PP2 paso 6b · terminar el ala derecha (X6) y fijar la altura del nivel 1

Base `d6b6ea8`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/`, `alturas/`, `vessel_limites/` y `vessel_altura/` contra sus `HASHES_*.txt`: coinciden. Script y entorno fuera del repo. Sin veredicto: son lecturas.

## Qué hice

Parto de V1 con banda de 5 celdas (V2 descartada). El lado norte sigue siendo mirador o quebrada: sin escaleras propias, y en la vista su borde lleva una **baranda de 0,5 H (2 celdas)**; Y12 e Y13 son las escaleras largas de 5 celdas.

**Lo que el mapa decía y el brief no.** El «rincón del este» no es piso decorativo ni muro sobrante: entre X6 y el muro derecho está el piso del **grupo 11** (en las filas 40–47, columnas 47–56, 80 celdas; 46 son piso original de la guía E y 34 crecimiento del 5h, y encima de él, filas 36–39, hay decorativo). Lo leí así: **rincón = esas 80 celdas del grupo 11**; X6 se come como máximo el 50 % (40), el resto queda como rincón de g11. Es lectura mía; si [U] quería otro espacio, hay que decirlo.

**Cambio en la segunda mitad de X6** (rectángulo filas 40–48, columnas 45–51):
- **+6** celdas de piso de X6 en el fondo de la muesca (filas 43–45, columnas 45–46; eran los gates X6 ↔ g11);
- **+18** de flanco este (filas 40–45, columnas 47–49), tomadas del grupo 11;
- muro mínimo de 2 celdas en las filas 46–47 (columnas 45–46) y en las columnas 50–51 (filas 40–47);
- **escalera nueva X6 ↔ g11** en las filas 46–47, columnas 47–49 (3 × 2, vertical: baja hacia el sur, como X5 ↔ Y10, que es 3 × 2 en las filas 47–48, columnas 3–5);
- el contacto heredado X5 (48, 6) ↔ Y10 (49, 6) se cierra cerrando la celda **Y10 (49, 6)** (queda como banda); no había celda espejo que cerrar en el lado derecho.

Con eso la muesca de Y13 queda con X6 a los dos lados (como la de Y12 en X5) y su escalera pasa a medir lo mismo que la de Y12: filas 35–39, 5 × 4.

## Lecturas

**Cambios de piso.** 47 celdas cambian en total, **0 fuera del rectángulo de la extensión** (más la celda 49, 6). X4 y X5: 0. X6: +24 (6 de los gates, 18 del grupo 11), 0 perdidas. Grupo 11: 406 → 366 celdas; del rincón se usan **40 de 80 = 50,0 %** (18 a piso de X6, 16 a muro mínimo, 6 a escalera; 18 de las 40 eran piso original de la guía E); le quedan 280 de las 298 celdas de su piso original. Y10: −1.

**Reglas.**

| Regla | Resultado |
|---|---|
| 1 · solo crece la segunda mitad de X6 | sí: la primera mitad, la que toca a X4, no cambia |
| 2 · muro mínimo con el piso del g11 | las celdas nuevas de X6 quedan a ≥ 3 (cheb) del piso del g11; el mínimo global de X6 a g11 sigue siendo **1**, en el contacto diagonal heredado X6 (47, 44) ↔ g11 (48, 45), idéntico antes y después |
| 3 · máximo 50 % del rincón | 40 de 80 = 50,0 % |
| 4 · puente y escalera sin borde común | sí: distancia cheb 4 entre el puente Y13 (con sus gates) y la escalera nueva |
| 5 · frente libre ≥ largo | piso libre del g11 delante del pie: 8, 8 y 32 celdas por columna (largo de la escalera: 2) |
| 6 · ninguna escalera mira a otra | ningún par se mira ni está pegado; la separación mínima entre cajas de escalera es de 6 celdas |
| 7 · Y13 en el espejo de Y12 | desvío **0** con el eje real (x = 28,5, i ↔ 57 − i): Y12 en columnas 11–14, Y13 en 43–46. Con la tabla del brief (i ↔ 56 − i, columnas 42–45) el desvío sería 1; **no la moví**: Y13 ya estaba en su espejo, y moverla rompería la simetría de la guía |
| 8 · ≥ 4 celdas entre Y13 y la escalera X6 ↔ g11 | 6 celdas entre las cajas de escalera (filas 40–45); contando desde el gate de Y13 (fila 42), 3 |
| 9 · simetría con X5 | error de espejo X5 ↔ X6 **131 → 107** (no baja a menos de la mitad); nivel 1 completo 268 → 220; banda 174 → 102; escaleras 80 → 24. La escalera de X5 ↔ Y10 está en las columnas 3–5; su espejo sería 52–54, la nueva está en 47–49 |

Ninguna escalera es diagonal ni queda sobre muro mínimo; la banda no pisa piso, puente ni gate (0).

**Celdas.** Nivel 1: 504 de piso + 47 de muesca; banda 269 → 313; escalera 96 → 92; decorativo restante 727 → 695. Perímetro de X6 cerrado por muro o banda: 68,6 %; X4 72,7 %.

**Escaleras (después).** 1 Y12 filas 35–39 col 11–14, 5 × 4; 2 Y13 filas 35–39 col 43–46, 5 × 4; 3 X6 ↔ g11 filas 46–47 col 47–49, 2 × 3; 4 X5 ↔ Y10 filas 47–48 col 3–5, 2 × 3; 5 Y14 filas 56–60 col 19–22, 5 × 4; 6 Y15 filas 56–60 col 35–38, 5 × 4. Todas verticales y rectangulares.

**A\*.** Antes (paso 6, con el contacto heredado abierto): 114 / 210 / 140, con 1 cambio de nivel directo sin escalera cada una. Después: **116 / 216 / 142** (iguales a la guía D), mismas secuencias de salas, G cerrada, **2 escaleras por ruta y 0 cambios de nivel directos**.

**Altura (vista).** H = 4 celdas. Panel principal: nivel 1 = 1,45 H = **6 celdas**; segundo panel: 1,25 H = **5 celdas**. La banda sigue midiendo 5 celdas en planta, así que con 6 de altura la rampa es de unos 50° y con 5, de 45°. Baranda norte de 2 celdas; héroes de 4 celdas sobre X5 (nivel 1) y sobre Y10 (nivel 0); cámara ortográfica de 71°.

## Lo que no coincidió con la predicción de [R]

- **X6 crece 3 a 5 columnas hacia el este y usa menos del 50 %:** crece 3 columnas de flanco (47–49) más 2 de relleno de la muesca (45–46), y usa **exactamente el 50 %** del rincón, que no era decorativo sino piso del g11.
- **La escalera de Y13 se mueve 1 columna:** no se mueve (ya estaba en su espejo real); lo que cambia es su largo visible, que pasa de filas 38–42 a 35–39.
- **La escalera X6 ↔ g11 baja hacia el sur en el espejo de X5 ↔ Y10:** baja hacia el sur, pero 5 columnas más al oeste que el espejo.
- **El error de espejo X5 ↔ X6 baja a menos de la mitad:** baja de 131 a 107.
- **Las rutas A\* quedan en 116 / 212 / 142:** quedan en 116 / **216** / 142, iguales a la guía D.
- Quedan por reportar: el contacto diagonal heredado X6 ↔ g11 (distancia 1) sigue ahí, y la distancia de la celda de Y13 al primer escalón nuevo es corta si se cuenta desde el gate (3 celdas libres).

## Archivos

`planta.png` (antes | después, rincón en cian, escaleras numeradas), `vista.png` (después, nivel 1 a 6 y a 5 celdas, baranda norte, héroes), `detalle_ala_derecha.png` (X5 y X6 con el espejo superpuesto), `vessel_altura_b.json`, `HASHES_vessel_altura_b.txt` (dos corridas idénticas). El estiramiento, la escala × 2 y el techo doble van en otros pasos.
