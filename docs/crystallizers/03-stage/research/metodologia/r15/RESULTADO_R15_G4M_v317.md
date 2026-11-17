# R1.5 · G4-M (cámaras, medición en tomas) — resultado — [R], v317, 2026-11-17
Predicciones: PREDICCION_R15_G4M_v317 con Enmiendas 1–3 (vigente 01281863…). Medidas de CC: g4m_medidas.txt (658a1004…), hojas g4m_cajas_0137/0202 (43098c7a…, 4aed3b34…). Árbol e882c5c, `src/` sin diff, renders de P1 reproducidos (315d6e19…, 1ebcc581…).

## Veredicto por la regla congelada: G4-M NULO → G4 se cierra sin construir
| Predicción | Estado |
|---|---|
| M1, M2 (tamaños) | NO MEDIBLES: ningún elemento exterior entero en las dos tomas y en el modelo (Enm. 2) |
| M4, M5 (fuga en Z exterior, anchos) | NO MEDIBLES en las tomas (sin aristas exteriores; Enm. 2) |
| M6 (verticales, toma 0137) | NO CONCLUYENTE en las 3 Vo: el punto de fuga vertical interior no se pudo fijar (4 bordes de 65 px, signos incoherentes, sd ≈ 1000 px) → 2σ de la predicción 51–57°, mayor que la mitad de la predicha (Enm. 3) |
| Control del método (render 0137) | CUMPLE: fuga vertical de Vi1–Vi4 (641, 3251) contra analítica (640, 3241); fuga Z interior/exterior separadas 1,4 % del alto |
| M3 (héroe) | ver lectura 2 |
Por la regla de la Enmienda 2/3: sin Vo concluyentes, G4-M queda NULO con estas tomas y G4-C (dos cámaras) NO se construye. La hipótesis de [U] no queda refutada ni apoyada por regla.

## Lecturas de [R] (informativas; NO cambian el veredicto)
1. Verticales exteriores de 0137: Vo1–Vo3 están inclinadas +13,4 / +5,8 / +6,0° (σ ≤ 0,7), con el extremo inferior hacia el centro: el signo de una cámara en perspectiva que mira hacia abajo. Una proyección ortográfica dejaría verticales a 0°. Con Cam 6 a pitch 25° se esperaría ≈ 7–11° a esa distancia del centro (cálculo de [R], escala de la toma). Límite: Vo1 y Vo2 son los dos bordes del mismo pilar tallado y difieren 7,6°: el pilar no es un prisma recto, así que sus bordes no son verticales limpias. Inclina contra la idea de un fondo ortográfico, sin decidir.
2. Héroe (M3): en px, 40 (0137) y 42 (0202) — pero las tomas tienen recortes distintos (555×312 y 694×391). Normalizado al alto: 0,128 y 0,107 (0,084 si el que encabeza en 0202 es el azul). Cociente 1,20 (1,52): el héroe NO tiene el mismo tamaño en pantalla en las dos tomas (M3 falla en su forma normalizada). Los renders de P1 lo exageran (0,143 y 0,074, cociente 1,94): el heroFrac 0,08 de P1 para 0202 era bajo; con la figura completa del líder sería ≈ 0,107.
3. Fuga en Z de la toma 0202 (2 rectas, bordes de la escalera): y ≈ −0,03 del alto, contra −0,37 de Cam 6. Una sola cámara con esa fuga implica un picado más plano (≈ 16° con FOV 30) o un FOV más ancho (≈ 47° con pitch 25). Solo 2 rectas; no verificado. En 0137 la fuga Z interior cae dentro del cuadro (2 rectas a 7° entre sí, de escalones laterales): no es fiable.

## Consecuencias
- G4-C no se construye. C5 (dos escalas de héroe), C7 y B6 siguen en HIPÓTESIS.
- Lectura 2 corrige un dato de P1: el heroFrac de la posición 0202 debe re-medirse con la figura completa antes de usarse en pases nuevos.
- Lectura 3 abre una pregunta de cámara (FOV o pitch) que no es la de las dos cámaras; se anota como tangente.
