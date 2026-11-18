# Pedido a CC · R1.5 · Sala T3: bandas de 0202 + distorsión del fondo + bloqueo suave de la cámara (v325)

Decisiones e hipótesis de [U] (2026-11-18), con las bandas que marcó sobre las tomas. Bandas contadas desde ABAJO.
- **0202:**
  - banda 1 = la escalera sur, en primer plano;
  - banda 2 = el héroe, en y ≈ 0,45–0,56, de pie en el pentagrama, DETRÁS de lo alto de la escalera, no sobre ella;
  - banda del horizonte (fondo) = y 0–0,18.
- **0137** (el héroe se acercó a la baranda norte): la banda del horizonte baja hasta y ≈ 0,51 y se junta con la del héroe, que queda en y ≈ 0,51–0,62.
- **Hipótesis de [U]:** cuando el fondo entra en la vista, la cámara queda trabada en Z (bloqueo suave). Al acercarse, el fondo crece hacia abajo hasta encontrarse con el héroe en el medio. La cámara es prioritariamente Z: en X se traba cerca de los bordes, y en Z sigue para ver lo más lejos posible.

TU PAPEL: construyes, renderizas y mides. Sin juicio. Cam 6 FOV 30, pitch 25 (FOV confirmado, A425). Sin `src/`: el bloqueo suave se hace con el gancho de cámara del arnés (`focus` / pan).

## 1. Medir 0202 y 0137 con cajas (cuadros limpios c_bc55 = 0202 y c_1320 = 0137)
- **0202:**
  - caja de la escalera sur (x, y; ancho y alto en pantalla, número de peldaños visibles);
  - y del pretil;
  - pies y alto del héroe;
  - x de los pilares-búho;
  - borde inferior de la banda del horizonte (el último elemento lejano: la balaustrada del fondo).
- **0137:** pies del héroe, borde inferior del horizonte (la línea de la baranda norte y lo que asoma detrás) y x del héroe.
- Si tus cifras difieren de las de [U] (0202: héroe 0,45–0,56, horizonte 0–0,18; 0137: horizonte hasta 0,51, héroe 0,51–0,62), informa las dos.

## 2. Sala T3 (desde T2)
- La escalera sur ocupa la BANDA 1 con el tamaño exacto que mediste en 0202: ancho y alto en pantalla, con ± 5 % de tolerancia. Ajusta su ancho en tiles (probablemente 5, para que los pilares queden en x 0,35–0,46 y 0,65–0,77), su subida y su recorrido.
- El héroe va DETRÁS de lo alto de la escalera, a los tiles que hagan falta para que sus pies caigan en la banda 2 de 0202. `heroFrac` 0,108.
- La sala se alarga o acorta hasta que el borde inferior del horizonte caiga donde en 0202. Informa los tiles.
- Mismos controles que antes: máscara y camino transitables, sin `src/`, fondo vacío ≤ 2 %.

## 3. Distorsión del fondo (A427)
- **Líneas:** marca 5–8 líneas sur→norte en 0202. Por ejemplo los bordes de la escalera, los extremos del pretil, las bases de los pilares, las juntas del suelo y el borde de la sala. Pueden ir a mano donde el ajuste automático falle.
- **Ajuste:** con ellas calcula el punto de fuga y el espaciado de profundidad (cuánto se comprimen filas iguales hacia el fondo).
- **Comparación:** haz lo mismo en T3 con k = 1, 0,67 y 0,5 (Cam 8 / `zScale`, PR #94).
- **Hoja para [U]:** 0202 | T3 con k = 1, 0,67 y 0,5, con las líneas dibujadas y la tabla de punto de fuga y espaciado.

## 4. Bloqueo suave (la hipótesis de [U])
- **Caminata:** de 6 a 8 posiciones del héroe en el eje, desde la de 0202 (banda 2) hasta junto al borde norte (situación de 0137).
- **Dos cámaras:**
  - (a) Cam 6 normal: sigue al héroe con `heroScreen` fijo;
  - (b) bloqueo suave: la cámara avanza en Z hasta que el borde lejano entra en el cuadro y ahí se detiene en Z. El héroe sube por la pantalla y el fondo crece hacia abajo.
- **Por posición:** borde inferior del horizonte (y), pies del héroe (y) y la distancia entre las dos.
- **Hoja:** las dos caminatas en tiras, con la toma 0202 al inicio y 0137 al final, y las bandas pintadas (horizonte y héroe) como en las imágenes de [U].
- Repítelo en k = 1 y en el k que mejor calce en la §3 (dilo por cifras, no por juicio).

## 5. Entrega
- Hojas de las §3 y §4.
- `medidas_T3.txt`.
- Los PNG sueltos.
- `SHA256SUMS` y un zip.
- Las tomas de terceros, solo en las hojas: no se commitean.

## PARADAS
- Algo exige `src/`.
- La escalera de la banda 1 no logra el tamaño de 0202 con ± 5 %.
- El mismo fallo se repite dos veces.
