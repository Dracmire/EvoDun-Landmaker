# R1.5 · G4b — ¿el piso de abajo es una capa plana? (movimiento) + FOV — predicciones congeladas — [R], v320, 2026-11-17
Congeladas ANTES de pedir nada a CC. Solo se añaden enmiendas al final.
Origen: G4-M nulo (A364, A367); hipótesis refinada de [U] (03:48).

## Hipótesis de [U] (03:48), tal como la dijo
Un plano ortográfico al que se le corta el centro; en ese centro va la habitación 3D, elevada (una terraza más alta) para ver hacia abajo; la baranda tapa las costuras entre los dos planos. Mirando sobre la baranda, el piso de abajo es 2D plano, pero compuesto para calzar con el ángulo de la cámara (como un isométrico) y así parece tener perspectiva. Las ventanas del fondo son otra capa de fondo.

## Por qué una foto no basta (lección de G4-M)
Una imagen plana pintada o pre-renderizada «a juego con el ángulo» conserva la inclinación de las verticales y las fugas: en una foto quieta se ve igual que 3D. Lo que la delata es el MOVIMIENTO: una capa plana no tiene paralaje interno.

## Material
Video https://youtu.be/3STaQ8wZqcw (piso 2, desarrollo; no es el piso ciego). Tramos de [U]: 0137 = 1:35–1:40; 0202 = 1:57–2:02, en especial la caminata desde la escalera hacia la salida sur.

## Medidas (CC mide; no juzga)
Puntos rastreados cuadro a cuadro (≥ 10 cuadros/s): R = 4+ puntos del suelo y piezas de la habitación F (adentro de la baranda, a distintas profundidades); B = 4+ puntos del piso de abajo / salón exterior (faroles, cantos, escalones), al menos 2 cercanos a la baranda y 2 lejanos; W = 1–2 puntos de las ventanas del fondo.
- Rigidez de B: ajuste por grupo de una transformación 2D de similitud (traslación + escala) entre el cuadro inicial y cada cuadro; residuo RMS en px del grupo B y del grupo R.
- Paralaje interno de B: desplazamiento total de los B cercanos ÷ desplazamiento de los B lejanos a lo largo del tramo.
- Oclusión: eventos en que un objeto de B se desliza sobre otro de B más lejano (lista con cuadros).

## Predicciones
- G4b-1 (hipótesis de [U], capa plana): en la caminata de 1:57–2:02, el residuo RMS de B con similitud es ≤ 1,5 px y ≤ 1/3 del de R; el cociente de paralaje B cercanos ÷ B lejanos está en [0,9; 1,1]; no hay eventos de oclusión dentro de B.
- G4b-2 (alternativa, 3D en perspectiva): residuo de B > 1,5 px y cociente de paralaje B > 1,2, o al menos un evento de oclusión dentro de B.
- Control: el mismo análisis sobre una caminata del render de P1 (Cam 6, una sola cámara, salón C en 3D) da G4b-2. Si da G4b-1, el método no distingue y el resultado es NULO.
- Cualquier otro caso: NO CONCLUYENTE.
- Firma de [R]: creo que G4b-2 (≈ 55 %): el remake usa el entorno 3D de Unreal; pero la niebla y el DoF podrían ocultar el paralaje.

## Parte B · FOV y picado (fotos quietas, del mismo video)
En el cuadro de 0202 y el de 0137: elipse del pentagrama (eje menor ÷ eje mayor → picado local), fuga en Z con ≥ 3 rectas de suelo, y alto aparente de 3 filas de baldosas (cerca, baranda, más allá). Se ajusta un único par (FOV, picado) a las tres medidas.
- G4b-F (hipótesis de [U]): FOV ≥ 40° con picado 20–30°.
- Firma de [R]: FOV ≈ 30–40° (≈ 50 %); T49 da indicio de un FOV más ancho, con 2 rectas.

## Decisión
- G4b-1 y control válido → el fondo bajo la baranda se trata como capa plana: se diseña el truco «fondo plano compuesto» (ficha nueva) y se prueba con juez ciego.
- G4b-2 y control válido → el piso de abajo es 3D en perspectiva; la regla del vistazo actual (vecina 3D) es la correcta; la diferencia de aspecto se busca en el FOV (Parte B).
- G4b-F se cumple → se prueba Cam 6 con ese FOV en un pase propio (no va contra el Ancla: sigue siendo perspectiva).

## Límites
Video comprimido, niebla y DoF en el fondo; la cámara del juego sigue al héroe y puede hacer zoom (lo absorbe la similitud); un solo tramo principal.
