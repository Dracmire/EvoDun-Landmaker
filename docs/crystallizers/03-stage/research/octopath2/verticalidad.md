# Verticalidad compositiva (R2, pase de diseño de [R])

Registro A501–A512. Fuentes: las 27 capturas de `refs/oct2/` (lectura a ojo de [R]), las medidas de PR #97, los mockups de PR #101 y MODELO_ACTUAL v2.4. Todo lo que no está medido es **[H] hipótesis**. Las alturas en H de Octopath están estimadas contando peldaños contra el alto del héroe; no se midieron.

## 1. El problema (A501, A506)

Topológicamente nuestra altura funciona: los niveles separan y las escaleras unen. En composición es terrible. En los mockups M1–M3 las masas son acantilados repartidos al azar alrededor del héroe. Ninguna diferencia de altura forma una **banda** que se lea en pantalla. Los perfiles ordenan el espacio, pero no lo convierten en escena.

## 2. Lo que hace Octopath con la altura (lectura de las capturas)

| Captura | Delante del héroe | Donde está el héroe | Al fondo | A los lados |
|---|---|---|---|---|
| 16 plaza | baranda y leones (mismo nivel) | plaza | **sube**: escalinata doble hacia una terraza con fuente y casas | casas |
| 20 biblioteca | escalera que **baja** hacia la cámara | rellano | **sube**: escaleras dobles a la galería | estanterías altas |
| 13–15 calle | — | calle | **sube**: escalinata entre fachadas | fachadas |
| 10 cañón | **cae**: borde con cercas y puente abajo | meseta | **sube**: pared del cañón | casas |
| 17 reja | **cae**: muro con arcos un nivel abajo | rellano | muro alto | — |
| 9 tribunal | baranda (mismo nivel) | centro | **sube**: estrado con peldaños | gradas elevadas |
| 19 nieve | cerca desenfocada | plaza | **sube**: escalones al edificio | muros |
| dungeon 0:58–1:12 | braseros (mismo nivel) | puente | **sube**: el puente asciende al fondo | pilares, vacío oscuro |
| 8 bosque | masa oscura | camino | **sube**: terraza con muro de contención | — |
| 01 desierto | filas de soldados | camino | **sube** suave hacia las tiendas | rocas |

**Patrón (13 de 13 escenas leídas):** la altura crece con la distancia a la cámara. En ninguna escena hay un nivel más alto delante del héroe, salvo una baranda baja o una masa de primer plano. Cada subida es una **franja horizontal en pantalla** (cara frontal de un muro de contención, escalones vistos de frente), casi siempre con **escalera sobre el eje** y **baranda en el borde superior**.

## 3. Reglas propuestas (hipótesis de [R], de la hoja 2.5D)

| # | Regla | Cifras (H, hipótesis) |
|---|---|---|
| **V1 · Subir al fondo** | Dentro de la toma, la altura de cada banda es no decreciente con la profundidad de vista *u*. El héroe está en la banda media; nada caminable más alto delante de él | — |
| **V2 · Caras de frente** | Cada cambio de nivel corre de través a la vista (la cara mira a la cámara), así se lee como franja. Los cambios a lo largo del eje van a los lados (el marco en U) | desviación ≤ 30° de lo transversal |
| **V3 · Escalera en el eje** | Toda subida que cruza el eje lleva su escalera ahí: ancha en Hub (doble si es simétrico), simple en pasillo | ancho ≥ 3 H (A182) |
| **V4 · Borde vestido** | El borde superior de cada subida lleva baranda baja: es la línea de nivel A6 (y 0,40–0,60) | baranda 1,0–1,4 H; subida de 1 a 2 terrazas (1,25–2,5 H) |
| **V5 · Marco en U** | Los lados son más altos que la banda del héroe y suben hacia el fondo. El fondo es la masa más alta | lados ≥ 3 H; fondo ≥ lados |
| **V6 · Caída al frente** | La banda delante del héroe está al mismo nivel o más abajo; si cae, el borde lleva baranda baja (la banda de primer plano, A488) | caída 1–2 terrazas |
| **V7 · Pocas bandas por toma** | 2–3 bandas visibles por toma: frente, héroe, fondo. Más se lee como escalera de cubos (A247 de la hoja top-down) | ≤ 3 |

**Una sola cifra que se puede medir sin juez:** el **índice de banda** ρ, la correlación de rangos (Spearman) entre la altura del suelo y la profundidad *u* de las baldosas visibles en una toma. Octopath debería dar ρ alto y positivo (hipótesis). Los mockups M1–M3 deberían dar ρ cercano a 0, porque la altura de DAC no depende de dónde está la cámara. Además se cuentan los **oclusores**: baldosas caminables más altas que el héroe y delante de él.

## 4. Cómo se aplica a DAC (respetando el linaje, A503)

La altura de DAC es natural (sale de la elevación) y en el proyecto es «casi decorativa»: lo que importa son los niveles que separan y las escaleras que unen (CLAUDE.md, «Agreed design»). El remake de DQ3 hizo lo mismo: levantó los pisos sin cambiar el plano. Propuesta:

1. **Se conserva la topología:** qué baldosas son caminables, qué niveles están separados y dónde están las escaleras. Nada de eso cambia.
2. **Se reasigna la altura de los niveles caminables de la sala**, de forma monótona con la profundidad de vista *u* (V1). El orden de los niveles se toma por la *u* media de cada uno, con la cámara que da `orient`. Los pasos son los de la Base: terraza 1,25 H y `subs` 2.
3. **Si un nivel delante del héroe tiene que quedar más alto** (la topología lo obliga), primero se prueba la otra orientación de la cámara (`orient` ya pone el lado alto al fondo en las salas X). Si ninguna sirve, se marca **conflicto** y no se fuerza.
4. **El escenario no caminable** sigue V5 y V6: lados altos, fondo más alto, frente igual o más bajo. Ya existe en `planes`, que alza el fondo y baja el frente; se completa con los lados en U y las caras transversales.
5. **Primero se mira en Cam 7** (Classic 3/4, la proyección 16 bits, A503). Si las bandas no se leen ahí, Cam 6 no las va a salvar.

**Decisión de [U] (D-V1):** hoy ninguna regla del modo 3 cambia la altura de lo **caminable**, solo del escenario (`planes`, `border`, `volumes`). Además, las terrazas salen siempre de la elevación (Agreed design). El punto 2 rompe las dos cosas, aunque solo sea visualmente y en el modo 3. Sin la aprobación de [U] no se construye; la alternativa es aplicar V1 solo al escenario y ver cuánto alcanza.

## 5. Tesis

- **T3:** con V1–V7 aplicadas en Cam 7 y en Cam 6, las salas de los mockups pasan de ρ ≈ 0 a ρ alto, sin oclusores, y [U] las lee más cerca de 2D-HD que M1–M3 sin las reglas. Si solo sube ρ pero la lectura no cambia, la verticalidad no era el problema.
- **T2 (rehecha):** clasificación por partes (A500) con la tabla v2 de perfiles (§6). Esperado: la mayoría de las partes entra en un perfil (A505).

## 6. Tabla de perfiles v2 (corrige A505; umbrales de [R])

| Perfil | Ancho (H) | Largo / tamaño (H) |
|---|---|---|
| P1 pasillo angosto | 2,5–6 | > 17 (varias tomas) |
| **P1c pasillo de una toma** (nuevo) | 2,5–6 | ≤ 17 |
| P2 corredor ancho | 6–12 | cualquiera |
| P3/P4 Hub | — | ≤ 22 × 22 (≈ 1,25 tomas) |
| ninguno | < 2,5, o > 12 de ancho y no Hub, o Hub > 22 | — |

Se cerró el hueco de 5–6 H. P4 se distingue de P3 por el fondo, no por el tamaño.
