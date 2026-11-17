# R1.5 · Pase 2 (prueba de Generación del vistazo en DAC) — predicciones, regla y juez — [R], v313, 2026-11-16
Congeladas ANTES de pedir nada a CC. Solo se añaden enmiendas al final. Definiciones: claude/DEFINICIONES_T26_v311.md (3eafd0ee…). Antecedente: RESULTADO_R15_P1_v312 (positivo, con el límite A333).
Pregunta: en un mapa generado que no se usó para desarrollar nada, ¿la regla del vistazo gana a A y, sobre todo, a un simple cierre alto que tape el cielo?

## 1. Sala (elegida por regla, sin mirar renders)
- Ejemplo `dac_stage`, árbol congelado e882c5c. Se excluyen 84 y 65.
- Candidatas: salas con 250–600 tiles transitables (definición estricta del Stage) y con otra sala cuyo suelo transitable empiece a ≤ 10 tiles más allá del borde de fondo de la sala, en la dirección de cámara que elige `orient`.
- Se toma la de id más bajo. Si ninguna cumple: PARADA. CC declara la lista de candidatas antes de renderizar.

## 2. Estados (cada uno cambia UNA cosa respecto de A)
- A = la sala por defecto (como la BASE de v305: muros y columnas de `planes` 3 H, margen de ventana 24, orient/planes/props ON).
- K (control) = A con muros y columnas de `planes` a 5 H (la constante ya probada en T42). Tapa lo que hay detrás.
- B (regla del vistazo, aplicada como UNA regla del generador, con sus pasos fijos):
  1. el cierre de `planes` del lado de fondo (el que mira la cámara) pasa a baranda de 1 H; los otros lados quedan como en A;
  2. el margen de ventana crece lo justo para incluir entera la sala vecina de §1;
  3. el suelo de la vecina sube Δ = el menor de {0; 0,5; …; 4,0} H con V(hotspot) ≥ 20 % del cuadro (si ninguno llega, 4,0 H y se informa). Solo mapa y cámara; nada de tomas.
- Lo transitable de la sala (máscara, niveles, camino, meta) es idéntico en A, K y B.

## 3. Posiciones
Héroe en 3 puntos del camino de props de la sala: k0 (inicio), k4 (medio), k8 (final), con la cámara por defecto (Cam 6). V(p) se mide en las 3.

## 4. Juez (comparación ciega, sin rúbrica)
- Referencia R = toma DQ3 0137 (c_1320 del export de calibración). DAC no tiene toma propia: R sirve de patrón de composición 2D-HD, no de parecido de sala.
- 3 subagentes sin contexto. Pruebas por posición: B vs K, B vs A, K vs A (9 pruebas por juez), orden y nombres al azar, mapa aparte con sha256, abierto solo después de los votos.
- Texto exacto: «La imagen R es una referencia de otro juego y otra sala. Las imágenes 1 y 2 son maquetas sin texturas de una misma sala. ¿Cuál de las dos, 1 o 2, se parece más a R en COMPOSICIÓN: qué se ve en cada franja de profundidad, qué tapa a qué, qué tan lejos se ve y dónde queda el personaje? Ignora color, luz, texturas, detalle y la forma concreta de la sala. Responde 1 o 2 y una línea con la razón.»
- Una prueba la gana el estado elegido por ≥ 2 de 3 jueces.

## 5. Predicciones
- G1 (medida): V(K) ≤ V(A) en las 3 posiciones.
- G2 (medida): V(B, hotspot) ≥ 20 % (por construcción) y V(B) > V(A) en las 3 posiciones.
- G3 (PRINCIPAL): B gana a K en ≥ 2 de las 3 posiciones.
- G4: B gana a A en ≥ 2 de las 3 posiciones.
- G5 (informativa, sin predicción): K contra A.
- G6 (control): hash de la máscara transitable, del camino y de la meta iguales en A, K y B.

## 6. Regla de decisión
- POSITIVO si G3, G4 y G6 se cumplen: el vistazo por regla funciona en un mapa generado y no es solo «tapar el cielo». Siguiente: segundo truco (obstructor de primer plano) o el mapa SNES, a decidir por [U].
- K GANA si K gana a B en ≥ 2 posiciones: el efecto del Pase 1 era cerrar el fondo; el vistazo como tal no está demostrado.
- MIXTO en cualquier otro caso: se informa y se decide con [U] sin reinterpretar.
- NULO si G6 falla o falta material.

## 7. Límites declarados
- Una sala, 3 posiciones, 3 jueces del mismo modelo.
- R es de otro juego y otra sala; puede favorecer a B por tener vistazo (es el objetivo, se declara).
- Umbral 20 %, baranda de 1 H, escalones de Δ y margen «lo justo»: fijados por [R] aquí, antes de ver nada.
