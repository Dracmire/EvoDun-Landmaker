# R1.5 · Pase G4-M (cámaras: medición en tomas) — predicciones congeladas — [R], v317, 2026-11-17
Aprobado por [U] (01:10). Congelado ANTES de pedir nada a CC. Solo se añaden enmiendas al final.
Origen: hipótesis de dos cámaras de [U] (A348, T45); plan PLAN_R15_G4_camaras_v316. No se construye nada en este pase.

## 1. Material
- Tomas DQ3 de la sala F: 0202 (desde el sur) y 0137 (más al norte). Las mismas que se usaron en la calibración del juez y en P1.
- Renders: los de R1.5 P1, estado B1 (sala C vecina en perspectiva, una sola cámara Cam 6), con el héroe en el heroAt de cada toma. Si falta el render para alguna de las dos posiciones, CC lo genera con el mismo árbol (e882c5c) y la misma página de P1, y lo declara.

## 2. Elementos
- Exteriores (E): 2–3 elementos más allá de la baranda N de F (sala C, vanos, escaleras, muros), visibles enteros en las dos tomas y presentes en el modelo del render. CC propone la lista; [R] la aprueba en la PARADA 1 antes de medir.
- Control (K): 1 elemento DENTRO de F, visible entero en las dos tomas y presente en el render (p. ej. un pilar o la propia baranda).

## 3. Medida (CC mide; no juzga)
- h(x) = alto aparente en px del elemento x (de su base visible a su tope, en vertical), con la caja dibujada sobre la imagen.
- H = alto en px del héroe que encabeza el grupo (caja del sprite).
- r(x) = h(x) / H, en cada imagen.
- Q(x) = r(x en la posición 0137) / r(x en la posición 0202), por separado en las tomas (Q_toma) y en los renders (Q_render).

## 4. Predicciones
- G4-M1 (la hipótesis de [U]): en la mayoría de los elementos exteriores (≥ 2 de 2, o ≥ 2 de 3), Q_toma está más cerca de 1 que Q_render: |ln Q_toma| < |ln Q_render|.
- G4-M2 (control): para K, Q_toma y Q_render difieren ≤ 15 % (0,85 ≤ Q_toma/Q_render ≤ 1,15).
- G4-M3: H en px es igual en las dos tomas (±10 %). Si no lo es, se informa la razón H(0137)/H(0202) y se usa r (que ya normaliza por el héroe).

## 5. Firma de [R] antes de ver medidas
Mi apuesta: M2 se cumple; M1 falla (≈ 60 %): creo que el fondo de DQ3 es la misma perspectiva y que el efecto que ve [U] viene del cambio de altura y distancia de cámara entre tomas. M3: creo que falla (las tomas ya dieron 0,08 contra 0,12).

## 6. Decisión
- M1 y M2 → hay evidencia de un fondo con otra proyección: [R] escribe G4-C (dos cámaras) con su propio juez ciego.
- M1 falla y M2 se cumple → la hipótesis de dos cámaras no se apoya en estas tomas; G4 se cierra sin construir y se pasa a consolidar R1.5.
- M2 falla → la medida no vale (el render no reproduce ni lo de dentro de F): se informa sin conclusión sobre M1.

## 7. Límites
2 tomas, 2–3 elementos, medidas a mano sobre cajas; el render es un modelo del remake, no el juego; ningún juicio de composición en este pase.

## Enmienda 1 (2026-11-17 01:30, antes de ver la PARADA 1 de CC; por objeción de [U]: «instrucciones simplistas»)
Se añade una segunda medida, más directa, y se detalla qué se busca. M1–M3 no cambian.
- Qué se busca, en palabras: si lo que se ve más allá de la baranda N de F está dibujado con la MISMA cámara en perspectiva que la sala, o con otra proyección (ortográfica o FOV distinto). Una sola cámara en perspectiva deja una huella geométrica: todas las líneas del mundo que corren en Z (hacia el fondo) convergen en UN mismo punto de fuga, dentro y fuera de la sala. Una segunda cámara ortográfica deja esas líneas paralelas (sin punto de fuga) solo en la zona exterior; una con otro FOV las hace converger en OTRO punto.
- Medida M4 (punto de fuga): en cada imagen, ≥ 2 aristas en Z dentro de F y ≥ 2 en el exterior (juntas de baldosa, lados de pasillos, bordes de escaleras, cantos de muro), cada una ≥ 80 px, marcadas a mano por sus dos extremos. Se calcula el punto de fuga de cada grupo (intersección por mínimos cuadrados) y el ángulo entre las aristas del grupo.
- G4-M4 (predicción de [U]): en las tomas, el punto de fuga exterior se separa del interior en más del 15 % del alto del cuadro, o las aristas exteriores son paralelas (ángulo entre ellas < 1°) mientras las interiores convergen. En los renders (una sola cámara) los dos puntos coinciden (≤ 5 % del alto): eso valida el método.
- Medida M5 (anchos): para los elementos exteriores aprobados se mide también el ANCHO aparente (más estable que el alto cuando la baranda tapa la base). En ortográfica el ancho relativo al héroe no cambia entre 0202 y 0137 solo por la distancia en Z; en perspectiva sí. Se reporta Q_ancho igual que Q.
- Decisión ampliada: M4 manda sobre M1 si se contradicen (es la huella directa; M1 depende de cuánto se movió la cámara). M4 sin validar en el render → la medida de punto de fuga no vale.
- Firma de [R] sobre M4: creo que falla (≈ 60 %): un solo punto de fuga.

## Enmienda 2 (2026-11-17 02:50, tras la PARADA 1 de CC y ANTES de medir nada)
Hecho de CC: (a) ningún elemento exterior está entero en las dos tomas y presente en el modelo → M1 y M2 NO SE PUEDEN MEDIR con 0202/0137; (b) aristas en Z exteriores ≥ 80 px solo en el render 0137 → M4 tampoco se puede medir en las tomas.
Decisión de [R]: G4-M1, M2, M4 y M5 quedan NO MEDIBLES con estas tomas (no cuentan como falla ni como apoyo). Se mide lo que existe y se añade una huella que sí existe en 0137.
- M3 (héroe) sigue igual.
- M6 (nueva) · Convergencia de VERTICALES. Con una sola cámara en perspectiva y picado, todas las aristas verticales del mundo convergen en UN punto de fuga vertical (muy por debajo del cuadro), dentro y fuera de la sala; su inclinación en pantalla crece con la distancia horizontal al centro. Con una segunda cámara ortográfica las verticales exteriores quedan paralelas (inclinación ≈ 0°) aunque estén lejos del centro.
  Medida: en cada imagen, ≥ 2 verticales DENTRO de F y ≥ 2 AFUERA (cantos de muro, marcos de la ventana, pilares, postes de la escalera lejana), cada una ≥ 80 px (si no hay, ≥ 60 px declarado), preferentemente con |x − 640| ≥ 250 px. Punto de fuga vertical del grupo interior por mínimos cuadrados; para cada vertical exterior: inclinación medida contra la inclinación que predice el punto interior en su x (en grados), y su error por ±5 px en los extremos.
- G4-M6 (predicción de [U]): en la toma 0137, las verticales exteriores con |x − 640| ≥ 250 px están más cerca de 0° que de la inclinación que predice el punto interior (|medida| < |predicha| / 2), con la diferencia mayor que su error.
- Control: en el render 0137 (una sola cámara) las verticales exteriores coinciden con la predicha (diferencia ≤ su error). Si no, el método no vale.
- Firma de [R]: creo que M6 falla (≈ 65 %): una sola cámara.
- Decisión: M6 se cumple y el control pasa → evidencia de otra proyección y se escribe G4-C. M6 falla con control válido → la hipótesis no se apoya en 0137. Sin verticales exteriores medibles → G4-M queda NULO con estas tomas y se cierra; reabrirlo exige otra toma (no se abre ninguna toma nueva del piso ciego).

## Enmienda 3 (2026-11-17 02:55, PARADA 2 de CC, antes de cualquier medida)
- M6 solo se evalúa en la toma 0137. La 0202 no tiene verticales exteriores (lo de afuera mide ≈ 43 px): M6 no medible en 0202.
- Vo1–Vo3 de la toma 0137 se aceptan como EXTERIORES (nacen detrás del balaustre izquierdo; su base no se ve). Se informan por separado, con la nota «base no visible».
- Las interiores Vi1–Vi4 de la 0137 miden ≈ 65 px (≥ 60, declarado); Vi3 y Vi4 son las únicas lejanas del centro.
- Control: en el render 0137 hay una sola vertical exterior (Vo1, 66 px). El control se hace con ella y se declara DÉBIL (n = 1). Si esa vertical no coincide con la predicha por el punto interior del render, el método no vale y M6 queda nulo.
- La regla de decisión de la Enmienda 2 no cambia.

## Enmienda 3 (2026-11-17 03:00, tras la PARADA 2 de CC y ANTES de medir)
- 0202 (toma y render) sin verticales exteriores ≥ 60 px: M6 se mide SOLO en la toma 0137.
- [R] acepta Vo1–Vo3 de la toma 0137 como exteriores (pilares que nacen detrás del balaustre izquierdo, en el salón de abajo; lectura de CC confirmada a vista por [R], declarada como lectura). Verticales interiores de 60–80 px aceptadas (la regla lo permitía, declarado).
- Control del método en el render 0137: con una sola Vo (66 px), se compara contra el punto de fuga vertical ANALÍTICO de la cámara (640, 3241), no contra el grupo interior.
- Precisión: cada recta se ajusta por mínimos cuadrados a los puntos de borde a lo largo de toda su longitud (no por dos extremos a mano); se informa σ del ángulo.
- Tercer resultado posible: si para una Vo el error (2σ) es ≥ la mitad de su inclinación predicha, esa Vo es NO CONCLUYENTE. Si todas las Vo son no concluyentes, G4-M queda NULO y G4 se cierra sin construir.
- Cálculo previo de [R] (para fijar expectativas, no es dato): con pitch ≈ 23–25° y FOV 30°, una vertical a 220–256 px del centro debe inclinarse ≈ 4° en perspectiva; ortográfica, 0°. Con ±5 px en 91 px el error sería ≈ 4°: probablemente NO CONCLUYENTE salvo que el ajuste por borde baje σ a ≲ 1°.
