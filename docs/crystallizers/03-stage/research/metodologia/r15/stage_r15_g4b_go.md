# Pedido a CC — R1.5 G4b: ¿el piso de abajo es una capa plana? (paralaje en movimiento) + FOV (v320)
Predicciones ya congeladas por [R]. CC extrae, rastrea y mide; NO juzga composición. Nada de `src/`. Piso 2 (desarrollo): no es material ciego.

## Qué se busca (léelo primero)
[U] sospecha que en DQ3 lo que se ve por encima de la baranda (el salón de abajo) no es 3D: sería una imagen plana compuesta para calzar con la cámara, con la habitación 3D elevada en un hueco y la baranda tapando la unión. En una foto quieta eso no se distingue de 3D. En movimiento sí: una capa plana se mueve en bloque (todos sus puntos con el mismo desplazamiento y escala), mientras que en 3D los puntos más cercanos se mueven más que los lejanos (paralaje) y los objetos se deslizan unos sobre otros.

## Paso 1 — fotogramas
1. Video https://youtu.be/3STaQ8wZqcw. Tramos: A = 1:57–2:02 (caminata desde la escalera hacia la salida sur; el principal), B = 1:35–1:40.
2. Extrae a ≥ 10 cuadros/s, resolución original, sin reescalar. Si no puedes descargar el video desde tu entorno: PARA y dilo (no uses otra fuente).
3. Recorta la UI (minimapa, logos) a una máscara fija; dilo.

## Paso 2 — puntos (PARADA 1)
En el primer cuadro de cada tramo marca y numera:
- R (≥ 4): puntos de la habitación F, adentro de la baranda, a distintas profundidades (esquinas del pentagrama, base de los pilares-búho, cantos de escalón).
- B (≥ 4): puntos del salón de abajo, más allá de la baranda: ≥ 2 cerca de la baranda y ≥ 2 lejos (faroles, cantos, escalones, columnas).
- W (1–2): ventanas del fondo.
Rastréalos con flujo óptico (p. ej. Lucas-Kanade) y revisa a ojo cada 10 cuadros que no salten; un punto que se pierde se marca y se excluye. Entrega `g4b_puntos_A.png` y `g4b_puntos_B.png` y PARA para que [R] apruebe la lista.

## Paso 3 — medidas (tras la aprobación)
Por tramo:
1. Trayectoria de cada punto (px por cuadro) en CSV.
2. Rigidez: por grupo (R, B, W), ajuste de una similitud 2D (traslación + escala uniforme) del cuadro 0 a cada cuadro; residuo RMS por cuadro y final, en px.
3. Paralaje interno de B: desplazamiento total de los B cercanos ÷ el de los B lejanos (con su error).
4. Oclusión: cuadros en que un objeto de B se desliza sobre otro de B (lista).
5. Lo mismo para R (referencia de cómo se mueve el 3D de la habitación).

## Paso 4 — control con el visor
Renderiza una caminata equivalente en el ejemplo de P1 (estado B1, sala F + vecina C en 3D, Cam 6), del tile de 0202 hacia la salida sur, 25 cuadros, y repite los pasos 2–3 con puntos R y B equivalentes (aquí puedes usar las posiciones 3D exactas).

## Paso 5 — FOV y picado (Parte B)
En un cuadro de cada tramo con el pentagrama completo: elipse ajustada (ejes en px y cociente), ≥ 3 rectas de suelo hacia el fondo con su punto de fuga (ajuste por bordes, como en G4-M), y el alto aparente de 3 filas de baldosas (cerca, en la baranda, más allá si se ve). Ajusta un único par (FOV, picado) con un modelo de cámara en perspectiva y da su incertidumbre.

## Entrega
`g4b_puntos_*.png`, `g4b_trayectorias_*.csv`, `g4b_medidas.txt` (rigidez, paralaje, oclusión, control, FOV), hoja `g4b_flujo.png` con las trayectorias dibujadas, SHA256SUMS.
## Paradas
No se puede descargar el video · PARADA 1 · hace falta tocar `src/`. Sin «se parece».
