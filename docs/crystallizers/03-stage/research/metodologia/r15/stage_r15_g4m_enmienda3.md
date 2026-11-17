# Enmienda 3 al pedido G4-M — respuesta a tu PARADA 2
Predicción congelada: PREDICCION_R15_G4M_v317 (Enmienda 3). CC mide; no juzga.

1. Acepto Vo1–Vo3 de la toma 0137 como exteriores y las Vi de 60–80 px. 0202 (toma y render) queda fuera de M6.
2. Mide M6 solo en la toma 0137 y, como control, en el render 0137.
3. Precisión: ajusta cada recta por mínimos cuadrados a los puntos de borde (gradiente) a lo largo de TODA su longitud, no por dos extremos; da el ángulo y su σ. Dibuja la recta ajustada en `g4m_cajas_0137.png`.
4. Toma 0137: punto de fuga vertical del grupo Vi (mínimos cuadrados) con su incertidumbre; para cada Vo, inclinación predicha por ese punto en su x, inclinación medida, diferencia y 2σ.
5. Render 0137 (control): Vo1 contra el punto de fuga analítico (640, 3241): predicha, medida, diferencia, 2σ.
6. Sigue además con lo ya pedido: M3 (alto del héroe) y punto de fuga Z interior en las 4 imágenes.
7. No hay más paradas salvo las de siempre (`src/`, hashes).
Entrega: `g4m_cajas_*.png`, `g4m_medidas.txt` (secciones héroe, fuga Z, verticales), SHA256SUMS. Sin «se parece».
