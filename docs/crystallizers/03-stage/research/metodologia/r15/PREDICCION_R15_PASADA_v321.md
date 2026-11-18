# R1.5 · Pasada única de trucos con ficha — predicciones, reglas y juez — [R], v321, 2026-11-17
Congeladas ANTES de pedir la pasada a CC, con las cifras del Paso 0 (pasada_paso0.txt, df7946ad…). Solo se añaden enmiendas al final.
Fichas: INFORME_METODO_TRUCOS (v318), con los ajustes numéricos de la §2 de este archivo.

## 1. Base común (todos los estados)
- Terreno: `dac_stage`, terraces 3, subs 1, salto de terraza 1,25 H (terH 2,5 tiles, tilesPerH 2, «Measures in H» off), spread 1; decisión de [U] (A373). Hash del terreno puro 31ca6663….
- Cámara: Cam 6 (FOV 30, pitch 25), heroFrac 0,10 (render ≈ 0,12 del alto, entre 0,108 de 0202 y 0,128 de 0137; A366), exag 1, vScale 1.
- BASE: A1 vistazo (baranda BACK 1 H, margen mínimo con la vecina entera, vecina + Δ*) + A2 + A7 (noFront) + C1 (orient, hotspot en el eje). Hooks de página de G2 (noGrid, volumeOnWalkable, envoltorio de insertLevels para Δ < 0).
- Salas (Paso 0, puerta del vistazo V(k4) ≥ 10 %): 3 (Δ* +2,0), 8 (Δ* +2,5), 14 (Δ* +0,5).
- Posiciones: k0, k4, k8 del camino de props; k_mir (Paso 0) solo para A6.
- tilesPerH 2 (no 1,5): se mantiene el de todas las salas medidas; la ficha C4 (pasillo ancho) NO se prueba en esta pasada.

## 2. Ajustes a las fichas por las medidas del Paso 0 (antes: lectura de [R] a ojo)
- A6: línea media en las tomas: 0137 baranda y 0,417–0,574; 0202 pretil y 0,533–0,585 → objetivo del tope de la línea y ∈ [0,40; 0,60] sin cambio.
- A3a: columnas con farol de 0137 x 0,000–0,204, salen por arriba → objetivo sin cambio.
- A3b: dragón 0137 x 0,000–0,214, y 0,410–1,000 (alto 0,59); plintos 0202 x 0,190–0,346 y 0,785–0,961, y 0,562–1,000 → objetivo nuevo: x ∈ [0,00; 0,35] o [0,65; 1,00], alto aparente 0,25–0,60, toca el borde inferior.
- C2: búhos x 0,350–0,464 y 0,650–0,767, hueco 0,186 → sin cambio (≥ 0,17).
- B1: escalera del eje 0202 x 0,448–0,667, y 0,654–0,900 → sin cambio.
- C3: pentagramas ≈ 0,20–0,25 de ancho y 0,13–0,20 de alto del cuadro → objetivo «3–8 % del cuadro» sin cambio.
- B4 va dentro de A3a (alturas por pieza, exag 1). B2, A8, B6, C5, C7 (salvo el encuadre de A6) y D: fuera de esta pasada.

## 3. Estados por sala
BASE · BASE+A6 · BASE+A3a · BASE+A3b · BASE+C3 · BASE+A4 · BASE+C2 (con B1 si hay transición) · BASE+B3 · BASE+N1 · TODO (BASE + todos los PRESENTES en esa sala).

## 4. Puerta de presencia (de cada ficha, campo 7)
CC entrega, por estado, sala y posición, PRESENTE (con sus medidas) o AUSENTE (con motivo). Lo AUSENTE no va a los jueces y no cuenta. Un truco con < 5 posiciones PRESENTES de 9 (k0/k4/k8 × 3 salas) queda «no evaluable» en esta pasada.

## 5. Juez
3 subagentes nuevos sin contexto, tandas de ≤ 9, texto exacto de P1, orden y nombres al azar, mapa con sha256 abierto tras los votos. Referencia R: toma 0202 para A3b, C2, B1 y N1 (rasgos de 0202); toma 0137 para el resto y para TODO. Comparaciones: BASE+X contra BASE en cada posición donde X está PRESENTE; para A6 también en k_mir; TODO contra BASE en k0/k4/k8. Pares idénticos = AUSENTE. Gana el estado elegido por ≥ 2 de 3.

## 6. Predicciones
- P1 (A6, línea media con encuadre): BASE+A6 gana en ≥ 2/3 de sus posiciones PRESENTES.
- P2 (A3a, columna suelta de borde): BASE+A3a gana en ≥ 2/3 de sus posiciones PRESENTES.
- P3 (TODO): TODO gana a BASE en ≥ 6 de 9.
- Sin predicción: A3b, C3, A4, C2(+B1), B3, N1.
- Control: máscara transitable, camino y meta iguales en todos los estados de una sala; ningún volumen sobre tile del camino; billboards + rojo ≤ 30 % del cuadro; hashes ×2.
- Firma de [R]: P1 ≈ 60 %, P2 ≈ 65 %, P3 ≈ 55 %.

## 7. Decisión
- Un truco «aporta» si BASE+X gana en ≥ 2/3 de sus posiciones PRESENTES (con ≥ 5 presentes). Los que aportan forman la base de la prueba de Generación ciega.
- P3 cumple → la combinación funciona; P3 falla con trucos que aportan por separado → interacción entre trucos: se informa cuáles se estorban (mismos lados, centro ocupado).
- Lo «no evaluable» vuelve a NUNCA PROBADO con el motivo.

## 8. Límites
3 salas de un generador; jueces del mismo modelo; referencias de otro juego; trucos sin predicción son exploratorios; el juicio usa 2 referencias distintas según el truco.
