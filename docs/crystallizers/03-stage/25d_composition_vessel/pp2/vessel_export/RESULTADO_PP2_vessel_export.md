# PP2 paso 8 · exportar la profundidad del 3D al 2D: pase 1, lo que sobra sobre los muros

Base `5231131`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/` y `pp3/`. Antes de empezar comprobé los hashes de `vessel_altura_c/` y `vessel_profundidad/`: coinciden. Scripts y salidas pesadas fuera del repo (`~/pp7/`). Sin veredicto: son lecturas.

## Qué hice

- **Base 2D** (`base_muros_piso.png`, planta de `vessel_altura_c`, 57 × 108 celdas): muro mínimo, sobrante y externo en gris oscuro con su contorno exacto (1040 celdas; los pilares son muro); todo lo demás dentro de la silueta en blanco continuo (3882 celdas: salas, los dos niveles, banda, escaleras, puentes, gates y piso decorativo, sin marcadores ni colores); fuera de la silueta, negro (1234 celdas). Las celdas de muro mínimo o sobrante que la banda absorbió son piso blanco, como en la planta del 6c.
- **Tomas:** las 5 de 71° de `vessel_profundidad` (global, g23, g10, g04, g24), con exactamente las mismas cámaras. No volví a pasar la red: recalculé los mapas de 4 bandas con K-means (`seed 0`) sobre los mapas de profundidad que guardé, y comprobé que dan los mismos porcentajes por banda que `vessel_profundidad.json` en las cinco.
- **Retroproyección:** cada píxel (sin el héroe ni el fondo vacío) se lleva al plano z = 0 con el rayo de su cámara, sin importar qué tocó en el 3D; se rasteriza a 2 × 2 subceldas por celda y cada subcelda toma la banda de la mayoría de sus píxeles. Con el buffer del 3D se guarda qué tocó cada píxel (piso nivel 0, piso nivel 1, cara o banda, peldaño, muro, baranda).
- **Lo que sobra:** subceldas que en la base son piso blanco y en las que más de la mitad de los píxeles vienen de una superficie elevada (muro, cara, baranda, piso de nivel 1 o peldaño; los peldaños los cuento aparte). Es mi lectura de «vertical o elevada»: el piso de nivel 1 desplazado cuenta aunque caiga sobre su propia franja.
- **Cuánto sobresale un muro:** por cada tramo horizontal de muro con piso al norte (52 tramos), el número de celdas contiguas al norte de su borde cuyo origen dominante elevado es muro, parando en la siguiente pared de la base. Predicción de la geometría: altura × |d_y / d_z| del rayo que pasa por el borde.

## Lecturas

**Subceldas que sobran por toma** (de 15 528 subceldas de piso en la base; entre paréntesis las cubiertas por la retroproyección):

| Toma | Sobran | Piso nivel 1 | Cara o banda | Peldaño | Muro | Baranda |
|---|---|---|---|---|---|---|
| global (21 001) | 5348 | 2383 | 231 | 464 | 2116 | 154 |
| g23 (5445) | 1624 | 363 | 39 | 141 | 1039 | 42 |
| g10 (4417) | 2726 | 1263 | 88 | 190 | 1125 | 60 |
| g04 (8834) | 3214 | 1392 | 0 | 108 | 1654 | 60 |
| g24 (5441) | 1803 | 408 | 102 | 129 | 1112 | 52 |

**Cuánto sobresale cada muro, por tercio de pantalla** (celdas, media de los tramos de 7 de alto; entre paréntesis la predicción de la geometría para esos mismos tramos): global arriba 3,48 (3,73), medio 2,35 (2,81), abajo 1,95 (1,38). Locales de 7 de alto: g23 abajo 1,90 (2,06), medio 4,17 (3,39), arriba 13,5 (4,60, un solo tramo largo); g04 medio 2,92 (3,24), arriba 4,75 (5,43); g24 abajo 2,74 (1,52), medio 4,29 (3,26), arriba 2,50 (4,50); g10 arriba 3,78 (5,55). Los tramos de 14 de alto (los que tocan la franja) miden menos que su predicción en todas las tomas (global medio 3,42 frente a 5,41; abajo 1,58 frente a 3,16): su sobrante lo corta la siguiente pared. Por tipo (media de las tomas que los ven): muro mínimo 3,05 celdas (máximo 8,38), sobrante 2,39 (5,50), externo 1,72 (4,08). Todo sobresale hacia el norte: toda superficie está a z ≥ 0 y la cámara viene del sur.

**Nivel 1** (píxeles de piso de nivel 1; corrimiento hacia el norte respecto de su lugar en la base, en celdas, media y p10–p90): franja X4–X5–X6: 2,67 (2,45–2,87) en la global, 3,23 (2,26–4,21) en g10, 1,85 (1,44–2,27) en g04. Hub 25: 1,39 (1,26–1,52) en la global, 2,47 (1,83–3,06) en g23, 2,78 (2,16–3,38) en g24.

**Superposición** (5 tomas): 14 251 subceldas de piso las ven 2 o más tomas; en 3400 coincide la banda en todas las que las ven y en 10 851 hay alguna banda distinta. Ninguna subcelda la ven las 5 tomas (máximo 3: 1277 las ve una, 8912 dos, 5339 tres), así que «las 5 la ven y coinciden» es 0 y «las 5 la ven y difieren» también. Sobran en al menos una toma 7629 subceldas (2623 en una, 2926 en dos, 2080 en tres).

## Lo que no coincidió con la predicción de [R]

- **Cada muro sobresale al norte, nunca al sur:** cumple.
- **0,5 / 2,4 / 4,7 celdas (abajo / centro / arriba) para un muro de 7:** en la global salen 1,95 / 2,35 / 3,48; el orden crece hacia arriba, pero abajo es mayor y arriba menor que lo previsto. En las locales hay tramos sueltos muy por encima (13,5).
- **La franja y hub 25 se corren como un muro de 7:** la franja 2,67 y hub 25 1,39 en la global (hub 25 cae abajo de la toma); en las locales 1,85 a 3,23, según dónde caen en pantalla.
- **La sombra es más ancha en las locales que en la global:** sí en el tercio medio y alto (4,17 y 4,29 frente a 2,35; 4,75 frente a 3,48); en el bajo, g24 2,74 frente a 1,95 y g23 1,90.
- **Parece la cara del SNES:** no lo medí. Para fijar la escala: la cara del 5e / 6 es de 5 celdas, y el sobrante medio de un muro es de 3,05.
- **Subceldas que ven las 5 tomas:** ninguna; el criterio se midió con las que ven 2 o más.

## Archivos

`base_muros_piso.png`, `pase1_global.png`, `pase1_g23_codo.png`, `pase1_g10_escalera.png`, `pase1_g04_mirador.png`, `pase1_g24_codo.png` (toma | bandas en pantalla | bandas retroproyectadas sobre la base | lo que sobra en rojo), `pase1_superpuesto.png`, `pase1_sobrante_por_muro.png` (verde azulado a rojo según las celdas que sobresale; gris oscuro = muro sin cara norte), `vessel_export.json` (por toma y por tramo), `HASHES_vessel_export.txt` (dos corridas, mismos hashes). Solo el primer pase de la exportación.
