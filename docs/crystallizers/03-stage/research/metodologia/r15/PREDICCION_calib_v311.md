# Calibración del juez — predicciones y protocolo (P0), [R], v311, 2026-11-16
Congeladas ANTES de exportar ni ver ningún cuadro. Solo se añaden enmiendas al final.

## 1. Material (lo exporta CC; brief claude/stage_calib_juez_go.md)
Cinco ítems, el mismo cuadro que [U] puntuó (si hay varios, todos):
- V2 del desierto (≈ 9,5/10, [U] 2026-11-15 12:42; v302 §1 y §3)
- V1 del desierto (≈ 7/10, mismo mensaje)
- DAC 84 por defecto (1/10, mismo mensaje; render por defecto de v302, NO la BASE de v305)
- toma DQ3 0202 (referencia de la rúbrica)
- toma DQ3 0137 (referencia de la rúbrica)
Sin rótulos, nombres al azar, mismo tamaño. El mapa nombre → ítem lo guarda CC en un archivo aparte con sha256; no lo ve el juez.

## 2. Jueces
- Dos subagentes independientes, sin contexto del proyecto (aprobado por [U] 04:22). Cada uno recibe SOLO el texto de §3 y los cuadros.
- [R] no juzga: ya vio hojas rotuladas (A315).

## 3. Texto que recibe cada juez (único input además de las imágenes)
«Vas a calificar cuadros de juegos o maquetas con vista desde arriba en ángulo, con un personaje (héroe). Para CADA cuadro, decide cumple / no cumple en tres criterios y explica en una línea qué ves:
J1 EJE LEGIBLE: desde los pies del héroe se ve una franja transitable continua hasta un destino distinguible POR FORMA (escalera, plinto, puerta), no solo por color.
J2 VOLÚMENES DE ENCUADRE: hay masa vertical clara de al menos ~3 alturas del héroe a AMBOS lados del eje, formando marco. Solo cuenta la masa que se ELEVA por encima del suelo por donde camina el héroe; los acantilados o caídas por debajo del borde del suelo no cuentan.
J3 SUELO PLANO CON RELIEVE CONCENTRADO: el suelo transitable visible tiene como máximo 2 niveles y el relieve se concentra en como máximo 1 grupo de peldaños legible, no en escalones de contorno por toda la escena. Un nivel cuenta solo si ocupa ≳ 10 % del suelo visible; un grupo único de peldaños es relieve concentrado, no niveles extra.
No compares los cuadros entre sí ni adivines de qué juego son. Responde en una tabla: archivo | J1 | J2 | J3 | nota de una línea.»

## 4. Puntaje
S(ítem) = nº de J que cumplen (0–3). Si un ítem tiene varios cuadros, S = media.

## 5. Predicciones (juez 1 y juez 2 por separado)
- P1 (control, no es evidencia): S(0202) = 3 y S(0137) = 3.
- P2: S(V2) ≥ S(V1).
- P3: S(V1) > S(DAC 84 por defecto).
- P4: S(DAC 84 por defecto) ≤ 1.
- P5: S(V2) = 3.
- P6 (acuerdo): los dos jueces coinciden en ≥ 12 de las 15 decisiones (5 ítems × 3 J).

## 6. Regla de decisión
- CALIBRA si P2, P3 y P4 se cumplen en los dos jueces: el orden de la rúbrica coincide con el de [U] (9,5 ≥ 7 > 1). J1–J3 pueden usarse en Octopath (siguen sin ratificar por [U]).
- NO CALIBRA si falla P3 o P4 en algún juez, o si todos los ítems sacan 3 (la rúbrica no discrimina): se revisa la rúbrica antes de Octopath, sin recalibrar sobre estos mismos cuadros (quedan quemados).
- P1, P5 y P6 se informan; no deciden.

## 7. Límites declarados
- 5 ítems, un cuadro cada uno: prueba de orden, no de precisión.
- Las tomas DQ3 se distinguen de las maquetas a simple vista (fuga conocida). La prueba que decide es entre renders (V1, V2, DAC).
- La rúbrica se derivó de 0202, 0137 y V2: P1 y P5 son casi circulares.
