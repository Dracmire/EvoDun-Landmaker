# PP2 paso 8c · pase 1 rehecho: alturas en tiles, base de muros + piso blanco, y el rojo sale de las bandas de profundidad

Base `d7db3c0`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`. Antes de empezar comprobé los hashes de `vessel_altura_c/`, `vessel_profundidad/`, `vessel_export/` y `vessel_export_b/`: coinciden. Sin veredicto: son lecturas.

## Qué hice

- **Escena con las alturas ×2** (tiles de 16 px = 2 celdas, la unidad con que se midió la cámara de 71°): héroe 8 celdas; muros 14 sobre el lado alto; muros sobre la franja 28; nivel 1 = 14; baranda 4 celdas (2 tiles), abierta en las bocas de Y12 e Y13; Y12 e Y13 son rampas de 0 a 14; peldaños de banda y de gate ×2. La franja es solo X4, X5, X6 y hub 25 (no le agregué escaleras). La planta del vaso no cambia.
- **Cámaras:** exactamente las de las tomas a 71° (perspectiva, FOV 30, yaw 0, desde el sur, mismos encuadres, el mismo `D` de las tomas locales). Red solo en las 5 tomas (global, g23, g10, g04, g24): MiDaS `dpt_beit_large_512` (XChengCode `4c37fbb`), Python 3.10, timm 0.6.12, K-means N = 4 con `seed 0`, bandas ordenadas por gris medio (0 = la más cercana).
- **Base 2D** (`base_muros_piso_c.png`): **gris** = todos los muros (862 celdas de 14 y 178 de 28) + X4, X5, X6 y hub 25 (619 celdas de piso, muescas y gates de nivel 1) = 1659 celdas; **blanco** = el resto dentro de la silueta, continuo, sin gates ni marcadores = 3263 celdas (Y12 e Y13, 63 celdas, quedan blancas: restadas del muro, no reciben pared); **negro** = fuera de la silueta, 1234 celdas. Las demás escaleras (73 celdas, que en el 8b conté dentro del bloque) quedan blancas.
- **Retroproyección:** cada píxel se proyecta por su rayo al plano z = 0, subceldas de 2 × 2 por celda, banda = la mayoritaria de los píxeles que caen en la subcelda (el héroe no cuenta).
- **Rojo desde las bandas, regla literal:** una banda es «de muro» si más de la mitad de sus subceldas cae sobre gris; el rojo son las subceldas blancas de esa banda conectadas (4-vecinas) con sus subceldas grises. Los ids solo **etiquetan** el origen de cada subcelda roja (muro común / franja y hub 25 / baranda / rampa / ninguno); no deciden qué es rojo. Las subceldas de origen rampa dentro de una banda de muro se cuentan aparte y no se pintan de rojo.
- **Variante por zona** (cada zona conexa de una banda es de muro si más de la mitad de sus subceldas es gris) y una **sensibilidad al umbral de gris** (0,5 / 0,4 / 0,3 / 0,2): son lecturas adicionales, **no son la regla** del encargo; están en el json y en la 5.ª columna de cada hoja (umbral 0,3).

## Fuera de cuadro (anotado, no corregido)

- Global: 6 de las 8 esquinas del volumen (planta × z 0 y 28) caen dentro del cuadro, 2 fuera; la geometría no toca el borde superior.
- Locales: el héroe cae dentro de la toma en las 4 (pies en la fila 324,9, cabeza en la 280,6: 44,3 px de alto); el terreno toca el borde superior de la toma en las 4.

## Lecturas

**Fracción de gris de cada banda** (subceldas de la banda sobre gris / subceldas de la banda):

| Toma | Banda 0 | Banda 1 | Banda 2 | Banda 3 | Bandas «de muro» (> 0,5) |
|---|---|---|---|---|---|
| global | 0,301 | 0,310 | 0,246 | 0,086 | ninguna |
| g23 | 0,203 | 0,291 | 0,286 | 0,070 | ninguna |
| g10 | 0,507 | 0,550 | 0,259 | 0,596 | 0, 1 y 3 |
| g04 | 0,336 | 0,463 | 0,259 | 0,206 | ninguna |
| g24 | 0,328 | 0,350 | 0,177 | 0,029 | ninguna |

**Rojo con la regla literal** (subceldas): global 0, g23 0, **g10 1419**, g04 0, g24 0. Por origen (ids, solo etiqueta) el rojo de g10 es: franja / hub 25 1210, baranda 105, muro común 17, ninguno (suelo) 87. **Rojo donde los ids dicen que no hay muro:** 87 de 1419 en g10 (6,1 %); en las otras 4 tomas no hay rojo. Rampas dentro de una banda de muro: 5 subceldas en g10 (no pintadas), 0 en el resto. La variante por zona da lo mismo salvo 12 subceldas en g24 (una zona de 88 subceldas con 76 grises).

**Ancho del rojo al norte de cada tramo** (celdas; tramos del plano: muro común de 14, 38; muro sobre la franja de 28, 9; borde norte de la franja con baranda, 7; sin baranda, 3; medidos = tramo × toma donde se ve: 70, 13, 15 y 8):

| Tramo | Predicción h · cot 71° | Literal, media | Tercio medio |
|---|---|---|---|
| muro común (14) | 4,82 | 0,00 | 0,00 |
| muro sobre la franja (28) | 9,64 | 0,00 | 0,00 |
| borde norte con baranda (14 + 4) | 6,20 | 0,00 | 0,00 |
| borde norte sin baranda (14) | 4,82 | 4,25 | 0,00 |

El 4,25 de «sin baranda» sale de 2 tramos de g10 en el tercio de arriba (17,0 celdas) y 0 en los otros 6; no hay ratio con D = 5 que leer: la razón del tercio medio es 0,00 en los cuatro tramos (los 3 tramos sin baranda del tercio medio miden 0).

**Sensibilidad al umbral de gris** (no es la regla; rojo en subceldas en las 5 tomas y ancho medio del tercio medio de los muros comunes, celdas): umbral 0,5 → 1419, 0,00; 0,4 → 2425 (banda) / 4864 (zona), 0,24 / 0,33; 0,3 → 8975 / 7604, 1,08 / 1,02; 0,2 → 23 752 / 22 462, 8,34 / 7,81. Con 0,3 el rojo cae donde los ids dicen que no hay muro en el 18,6 % (banda) u 8,7 % (zona); con 0,2, en el 45,5 % / 45,9 %. El ancho por tercio y por tramo para los cuatro umbrales está en `vessel_export_c.json` (`sensibilidad_de_anchos_...`).

## Lo que no coincidió con la predicción de [R]

- **Predicción:** unos 4,8 celdas de rojo en el centro de la toma para el muro de 14 (de ~1 abajo a ~9 arriba), razón ~0,96 contra D = 5, baranda ~6,2, muros sobre la franja ~9,6. **Medido con la regla literal:** 0,00 en el tercio medio para los cuatro tipos de tramo; no hay razón con D = 5 que comparar.
- **Por qué sale vacío, lo que muestran las fracciones de gris:** ninguna banda llega a 0,5 de gris en 4 de las 5 tomas (máximos 0,31 a 0,46). Las bandas del K-means son manchas grandes de profundidad (regiones enteras de piso, no la silueta del muro), y la retroproyección de la cima de un muro cae sobre celdas blancas al norte del muro, así que la mayoría de las subceldas de cualquier banda son blancas. Solo g10 (héroe pegado a la franja, 2184 subceldas en la banda 0) supera 0,5 en tres bandas.
- **Las bandas siguen la geometría solo en parte:** con umbral 0,3 el rojo aparece en todas las tomas menos g23, pero ya con 18,6 % sobre suelo; con 0,2 casi la mitad.
- **Forma:** el rojo de g10 es un bloque de ~1400 subceldas pegado al norte de la franja, sin la forma del muro (ver `pase1c_g10_escalera.png`).

## Archivos

`base_muros_piso_c.png`; `pase1c_global.png`, `pase1c_g23_codo.png`, `pase1c_g10_escalera.png`, `pase1c_g04_mirador.png`, `pase1c_g24_codo.png` (cada una: toma | bandas en pantalla | bandas retroproyectadas sobre la base | rojo literal | sensibilidad 0,3); `pase1c_superpuesto.png` (solo el rojo literal de las 5 tomas; más intenso = en más tomas); `pase1c_vs_snes.png` (banda D = 5 del 5F junto al rojo medido, misma escala de 10 px por celda); `vessel_export_c.json`; `HASHES_vessel_export_c.txt` (dos corridas, mismos hashes).
Los scripts, el entorno, los pesos y las salidas pesadas (mapas de profundidad crudos) quedan fuera del repo.
