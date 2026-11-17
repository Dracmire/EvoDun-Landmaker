# Delta al pedido R1.5 Pase 1 — Paso 0 rehecho con el mapa completo del 4F (v312)
Complementa `claude/stage_r15_p1_vistazo_go.md` (sha256 2584875f…); no lo reemplaza. Pasos 1 y 2 sin cambios. Árbol congelado e882c5c (`/tmp/m6n/wtC`), declarado.

## Fuentes
- USAR: mapa completo del 4F del remake («Dreamer's Tower - 4F», captura de [U] del 2026-11-12, ~601×612 px). Es el mismo mapa del que sale tu recorte de 157×175 px; F y su dato del 4h vienen de él.
- NO USAR en este pase: el mapa SNES de Najimi Tower (16 bits, varias plantas). Se guarda para el pase de Generación. Mezclarlo ahora cambiaría la fuente de una sola sala.

## Lectura de [R] (la verificas, no la asumes)
- F = sala del medio a la derecha (marcador «2»).
- C = sala de arriba a la derecha (escalera «3», calcomanías circulares), hasta su muro N.
- Tu franja y 2–4 (color 150,105,55) es la faja oscura entre salas: borde, no suelo de C.

## Paso 0 (rehacer)
1. Registra el mapa completo contra tu recorte conservando el origen de F en el tile (10, 8): ≥ 3 rasgos comunes (el «2», esquinas de F, aberturas del O). Declara escala (px por tile en el mapa completo) y error en tiles.
2. Faja entre F y C: no transitable, sin altura asignada. Mide su ancho en tiles.
3. Contorno de C completo hasta su muro N; aberturas (hacia el pasillo central del N y hacia la escalera «3»); la escalera «3» como peldaños si se lee, si no, como abertura. Nada fuera de lo que el mapa muestra.
4. Si la registración da error > 1,5 tiles, o C no se distingue con claridad: PARA y dilo.
5. Borde S de F sin cambios (y = 5, postes intactos).
6. Entrega `r15_C_contorno_v2.png` (mapa con F en cian, C en magenta, faja rayada, rejilla de tiles) y `r15_C_contorno_v2.txt` (escala, error, vértices de C en tiles del visor, ancho de la faja, aberturas). PARA hasta el OK de [R].

## En B1 y B2
- La faja entra como borde no transitable con las reglas por defecto del generador (como los bordes de F). Ella no es la variable.
- Δ (B2) se aplica solo al suelo de C.
