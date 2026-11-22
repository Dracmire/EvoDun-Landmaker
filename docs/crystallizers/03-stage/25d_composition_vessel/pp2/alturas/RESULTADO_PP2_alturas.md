# PP2 · paso 3 · mapeo de muros del 5F (separar muros de piso y extraer su altura)

Base: commit 365b2c6. sha256 del mapa SNES y de las cuatro capturas iguales a `refs/README.md`. No se tocó `src/`, `tools/` ni `pp2/guias/` (los 10 archivos de `guias/E/` mantienen el hash de `HASHES_E.txt`). Script y entorno no se guardan aquí.

## Qué hice
- **P1 · héroe contra tiles.** Paso del tile de 16 px por autocorrelación vertical del suelo; alto del héroe (pelo a pies) leído a mano sobre recortes ampliados con regla (±2 px; las líneas están en `heroe_capturas.png`).

| Captura | Paso 16 px | Héroe, px captura | px juego | tiles de 16 | tiles de 8 |
|---|---|---|---|---|---|
| SNES cap1 | 53,74 | 76 | 22,6 | 1,41 | 2,83 |
| SNES cap2 | 53,69 | 77 | 22,9 | 1,43 | 2,87 |
| Switch cap1 | 41,54 | 68 | 26,2 | 1,64 | 3,27 |
| Switch cap2 | 41,55 | 67 | 25,8 | 1,61 | 3,22 |

  **H_SNES = 22,8 px del juego** (1,42 tiles de 16; 2,85 de 8). **H_Switch = 26,0** (1,62; 3,25). Las guías E siguen con 1 tile de 8 px = 1 H; con estas medidas 1 H son 2,85 (SNES) o 3,25 (Switch) tiles de 8 px.
- **P2 · clasificación.** 1512 tiles de 16 × 16 alineados a (8, 4) (recortes: 8 px izquierda, 4 arriba, 7 derecha, 8 abajo) dan 210 únicos; el siguiente desfase da 259. Cada píxel recibe una de 9 clases y cada tile único la clase mayoritaria (44 tiles mezclan: fracción < 0,70; 9 tiles tienen otra clase según dónde aparecen). Reglas de cada clase en `muros.json` (`regla_de_clase`). Hoja: `hoja_tiles.png`. Después, clase mayoritaria y fracción por tile de 8 px de la grilla de las guías (desfase (1, 5)): `muros.json` y `pack_clases_tiles8*.png`.
- **P3 · muros.** Cada componente conexo de tope es un muro (W1–W8). La cara se mide columna por columna: desde el fin del borde hasta el primer suelo caminable (o la cornisa / el borde de la imagen en la fachada).
- **P4 · contra las guías E.** Ningún tile de 8 px de un grupo de E (1945) tiene cara, tope, borde, pilar ni fachada como clase mayoritaria ni con ≥ 25 % de sus píxeles: 1929 son suelo y 16 son los cuatro carteles de escalera. Áreas, gates y flow de E no cambian (hashes iguales).

**Alturas por tipo** (px del juego; H = px / H_SNES o H_Switch):

| Tipo | Segmentos | Mediana (min–máx) px | H_SNES | H_Switch |
|---|---|---|---|---|
| Cara de muro interior (W1–W4) | 16 | 38 (35–41 por columna) | 1,67 | 1,46 |
| Pilar interior | 23 | 43 (37–54 por columna) | 1,89 | 1,65 |
| Cuerpo de fachada completo | 15 | 38 (38–44) | 1,67 | 1,46 |
| Pilar de fachada | 12 | 44 (43,5–45) | 1,93 | 1,69 |
| Cuerpos y pilares de fachada cortados por el borde de la imagen | 22 | 45–155 (solo cota inferior) | — | — |

Tope a suelo en el interior: 39 px de mediana (39–43). Borde: 1 px de mediana (0–4). Los cuatro topes pequeños (W5–W8, 130 px) no tienen cara medida.

## Lecturas que tomé
- Tope = región clara sólida (apertura 9 × 9 de los píxeles claros) más 3 px de contorno. Borde = lo que queda entre ese tope y el inicio de la cara; por eso sale de 1 px, y no de 4–5 como lee [R], que cuenta la cornisa clara dentro del tope. La cara empieza donde una ventana de 8 filas es ≥ 60 % oscura.
- Pilar = columnas contiguas (≥ 3 px) cuya cara pasa 3 px o más de la mediana de su muro, o corridas de ≤ 28 px de ancho con cara ≥ 40 px.
- Fachada = caras que terminan en una cornisa verde (suelo de < 3000 px) o en el borde de la imagen. Cada cuerpo es una banda de igual inicio de cara. Los cuerpos de abajo salen cortados: la imagen termina antes que ellos.
- Héroe = pelo a pies sin la espada. «Fuera» = las bandas oscuras de los bordes izquierdo y derecho.

## Qué no calzó
- En las capturas de Switch mi lectura da tope a suelo 36,2–36,6 px del juego y cara 32,7–33,5 (en SNES, 39,9–41,4 y 37,8–39,3); [R] da 38 en las dos versiones. No ajusté nada.
- Fuera de muros y fachada hay 27 tramos oscuros de 12–14 px de alto y 3 px de ancho (capiteles de pilar), listados en `muros.json`; no tienen otra altura de muro. No detecté pozos ni escalones con esta clasificación.

## Archivos
`muros_clases.png`, `muros_mapa.png`, `hoja_tiles.png`, `heroe_capturas.png`, `muros.json`, `pack_clases_px.png` (clase por píxel, valor = código de `clases`), `pack_clases_tiles8.png`, `pack_clases_tiles8_fraccion.png`, `HASHES_alturas.txt` (dos corridas, mismos hashes).
