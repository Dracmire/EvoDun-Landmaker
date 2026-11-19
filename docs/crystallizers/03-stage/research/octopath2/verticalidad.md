# Verticalidad compositiva (R2, pase de diseño de [R])

Registro A501–A513. Fuentes: las 27 capturas de `refs/oct2/` (lectura a ojo de [R]), las medidas de PR #97, los mockups de PR #101 y MODELO_ACTUAL v2.4. Todo lo que no está medido es **[H] hipótesis**. Las alturas en H de Octopath están estimadas contando peldaños contra el alto del héroe; no se midieron.

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

## 2b. Segunda lectura con 20 tomas verticales (A511)

[U] aportó 20 tomas elegidas por su verticalidad (`refs/oct2/oct2_v01`–`v20`, tabla en el índice). Lectura de [R], 18 escenas distintas (v03/v04, v07/v08, v11/v12 y v19/v20 son pares de una misma escena):

| Familia | Escenas | Qué pasa con la altura |
|---|---|---|
| **A · Banda que sube** | v02, v03, v07, v10, v11, v13, v14, v15, v18 (9) | frente más bajo, héroe en la banda media, fondo más alto (muro, fachada, puerta, puente) |
| **B · Atalaya** | v01, v09, v16, v17, v19 (5) | el héroe está en lo alto (azotea, cima de muralla, duna, meseta); **todo cae a su alrededor**; el fondo es un hito aún más alto (v01, v17) o una **vista lejana y más baja** (v09, v19: el horizonte) |
| plano | v05, v06 | sin cambio de nivel; el fondo cierra por arcos u oscuridad |

**Corrige la primera lectura:** «la altura crece con la profundidad» solo vale en la familia A. Lo que se cumple **en las 31 escenas** (13 + 18) es más fuerte y más simple:

- **I1 · Nada caminable más alto delante del héroe.** Lo que tapa por delante son oclusores no caminables y desenfocados: tejados (v03, v10, v14), estandartes (v13), columnas (v05). Es la capa P, que sí puede ser más alta que el héroe.
- **I2 · Las caras de los desniveles miran a la cámara y van vestidas:** fachada con ventanas (v01), muro de contención de piedra (v11, v12), muralla (v15, v18), acantilado (v19). Son grandes: muro de contención ≈ 2–3 H, fachada o muralla ≈ 6–10 H. Es mucho más que la terraza de 1,25 H de la Base, y se permite porque están vestidas (A495).
- **I3 · Las escaleras van en el eje (de frente) o a lo largo de la cara (de perfil, a menudo en zigzag):** v11, v12, v15, v16, v02. Los tramos laterales son tan frecuentes como los frontales.
- **I4 · Cada borde superior lleva baranda, almena o cerca** (v01, v12, v13, v17): la línea A6.

## 3. Reglas propuestas (hipótesis de [R], revisadas con 2b)

| # | Regla | Cifras (H, hipótesis) |
|---|---|---|
| **V1 · Nada caminable más alto delante** (I1) | Dentro de la toma, ningún suelo caminable delante del héroe está más alto que él. Los oclusores P no caminables pueden serlo, en bordes y esquinas | — |
| **V1a · Familia A, banda que sube** | La altura no decrece con la profundidad: frente ≤ héroe ≤ fondo | — |
| **V1b · Familia B, atalaya** | El héroe ocupa la parte más alta de su parte de sala. Frente y lados caen. El fondo es un hito más alto o una vista lejana más baja | caída frontal ≥ 2 H |
| **V2 · Caras de frente y vestidas** (I2) | Cada desnivel corre de través a la vista y su cara se viste (muro, fachada, acantilado) | muro 2–3 H; fachada o muralla 6–10 H |
| **V3 · Escaleras de frente o de perfil** (I3) | La subida que cruza el eje lleva escalera de frente, o tramos a lo largo de la cara (zigzag) | ancho ≥ 3 H (A182) |
| **V4 · Borde con baranda** (I4) | Baranda, almena o cerca en el borde superior de cada subida: la línea de nivel A6 | 1,0–1,4 H |
| **V5 · Marco en U** (solo A) | Los lados más altos que la banda del héroe; el fondo es la masa más alta | lados ≥ 3 H |
| **V6 · Caída al frente** | El frente igual o más bajo; si cae, el borde lleva baranda (banda de primer plano, A488) | A: 1–3 H; B: ≥ 2 H |
| **V7 · Pocas bandas por toma** | 2–3 bandas visibles: v11 y v12 muestran exactamente 3 | ≤ 3 |

**Qué familia toca a cada parte de sala** (enlaza con la matriz perfil × tipo DAC): la familia B corresponde a la parte más alta de una sala y a los Dioramas tipo **Cima, Mirador e Isla**. La familia A corresponde a pasillos, plazas y Hubs, es decir, a Ascensión, Cake y el resto. [H]

**Índice de banda** (medible sin juez): en la familia A, ρ = correlación de rangos (Spearman) entre la altura y la profundidad *u* de las baldosas visibles; se espera alto y positivo. En la familia B, ρ no sirve; se mide en cambio la **altura relativa del héroe** (qué fracción de las baldosas visibles queda por debajo de él; se espera ≥ 0,8). En ambas familias se cuentan los **oclusores caminables** (I1), que deben ser 0.

## 4. Cómo se aplica a DAC (respetando el linaje, A503)

La altura de DAC es natural (sale de la elevación) y en el proyecto es «casi decorativa»: lo que importa son los niveles que separan y las escaleras que unen (CLAUDE.md, «Agreed design»). El remake de DQ3 hizo lo mismo: levantó los pisos sin cambiar el plano. Propuesta:

1. **Se conserva la topología:** qué baldosas son caminables, qué niveles están separados y dónde están las escaleras. Nada de eso cambia.
2. **Se reasigna la altura de los niveles caminables de la sala** según la familia de cada parte: A = monótona con la profundidad de vista *u* (V1a); B = la parte del héroe es la más alta y lo demás cae (V1b). Siempre se cumple I1. El orden de los niveles se toma por la *u* media de cada uno, con la cámara que da `orient`. Los pasos son los de la Base: terraza 1,25 H y `subs` 2.
3. **Si un nivel delante del héroe tiene que quedar más alto** (la topología lo obliga), primero se prueba la otra orientación de la cámara (`orient` ya pone el lado alto al fondo en las salas X). Si ninguna sirve, se marca **conflicto** y no se fuerza.
4. **El escenario no caminable** sigue V5 y V6: lados altos, fondo más alto, frente igual o más bajo. Ya existe en `planes`, que alza el fondo y baja el frente; se completa con los lados en U y las caras transversales.
5. **Primero se mira en Cam 7** (Classic 3/4, la proyección 16 bits, A503). Si las bandas no se leen ahí, Cam 6 no las va a salvar.

**Resuelto por [U] (A514): D-V1 se aplica, pero en un constructor propio del Stage, un clon de DAC que se muta, para no romper el DAC puro (`stage_s3_fork_go.md`).** Lo que sigue es el planteamiento original. **Decisión de [U] (D-V1):** hoy ninguna regla del modo 3 cambia la altura de lo **caminable**, solo del escenario (`planes`, `border`, `volumes`). Además, las terrazas salen siempre de la elevación (Agreed design). El punto 2 rompe las dos cosas, aunque solo sea visualmente y en el modo 3. Sin la aprobación de [U] no se construye; la alternativa es aplicar V1 solo al escenario y ver cuánto alcanza.

## 5. Tesis

- **T3:** con V1–V7 aplicadas en Cam 7 y en Cam 6, las salas de los mockups pasan de ρ ≈ 0 a ρ alto (familia A) o a altura relativa ≥ 0,8 (familia B), sin oclusores caminables, y [U] las lee más cerca de 2D-HD que M1–M3 sin las reglas. Si solo sube ρ pero la lectura no cambia, la verticalidad no era el problema.
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
