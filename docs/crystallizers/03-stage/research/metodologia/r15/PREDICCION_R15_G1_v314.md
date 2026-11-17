# R1.5 · Pase G1 (masas verticales y planos) — predicciones, reglas y juez — [R], v314, 2026-11-16
Congeladas ANTES de pedir nada a CC. Solo se añaden enmiendas al final. Plan: PLAN_R15_grupos_v314.md.

## 1. Salas y posiciones
Salas 1, 3 y 9 de dac_stage (árbol e882c5c), las 3 primeras candidatas por id del Pase 2. Posiciones k0, k4, k8 del camino de props de cada sala.

## 2. Estados
- BASE = la regla del vistazo del Pase 2 en cada sala (baranda de 1 H al fondo, ventana con la vecina, Δ por V ≥ 20 % con tope 4 H).
- TODO = BASE + A3 + A4 + C2. TODO−A3, TODO−A4, TODO−C2 = TODO sin ese truco.

## 3. Reglas de los trucos (solo mapa y cámara; volúmenes del visor; nada de `src/`)
- A3 · Obstructores de primer plano: en el lado cercano a la cámara (FRONT con el yaw de `orient`), 2 pilares de 2×2 tiles y 5 H sobre tiles NO transitables pegados al suelo de la sala, uno en cada tercio lateral del ancho de la sala (el más cercano al centro de su tercio). Distancia mínima al camino: 3 tiles. Si en un tercio no hay tile válido, ese pilar se omite y se informa.
- A4 · Fondo con vano focal: en el plano más lejano visible sobre el eje de cámara desde k4 (el cierre o la vecina), un vano de 2 tiles de ancho y 3 H de alto: un volumen claro de 2×1 tiles, a la altura de ese plano, centrado en la columna del eje. Si el plano más lejano está a menos de 3 H de altura visible, el vano se apoya en él y se informa.
- C2 · Pares que flanquean el camino: cada 6 tiles del camino de props (empezando en el tile 3), 2 pilares de 1×1 tile y 4 H a ±2 tiles perpendiculares al camino, solo sobre tiles NO transitables; si el tile es transitable, se omite ese pilar (nunca se bloquea el paso) y se informa.

## 4. Juez
3 subagentes sin contexto; referencia R = toma 0137; mismo texto del Pase 2. Por sala y posición: TODO vs BASE, TODO vs TODO−A3, TODO vs TODO−A4, TODO vs TODO−C2 (36 pruebas por juez). Orden y nombres al azar; mapa con sha256, abierto solo tras los votos. Gana una prueba el estado elegido por ≥ 2 de 3.

## 5. Predicciones
- H1 (principal): TODO gana a BASE en ≥ 6 de 9 (sala × posición).
- H2: A3 aporta (TODO gana a TODO−A3 en ≥ 5 de 9).
- H3: C2 aporta (≥ 5 de 9).
- H4: A4 sin predicción (el vano es pequeño a esta distancia).
- H5 (control): máscara transitable, camino y meta iguales en los 5 estados de cada sala.

## 6. Decisión
- H1 y H5 se cumplen → el grupo entra; a la base de G2 pasan solo los trucos que aportan (H2–H4).
- H1 falla → ningún truco de G1 entra en la base; se informa cuáles empeoran.
- H5 falla → nulo, se corrige y se repite.

## 7. Límites
- 3 salas de un mismo generador; 3 jueces del mismo modelo; referencia de otro juego.
- Tamaños (2×2, 5 H, 4 H, cada 6 tiles, ±2) fijados aquí por [R], antes de ver nada.
- La atribución por quita-uno no detecta interacciones entre trucos.
