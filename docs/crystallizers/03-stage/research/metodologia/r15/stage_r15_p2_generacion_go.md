# Pedido a CC — R1.5 Pase 2: el vistazo en una sala DAC no usada (prueba de Generación) — v313
Árbol congelado e882c5c (`/tmp/m6n/wtC`); nada de `src/`; repo sin cambios. CC construye, renderiza y mide; NO juzga composición. Las predicciones ya están congeladas por [R]; no las necesitas.
Te pasa [U]: claude/DEFINICIONES_T26_v311.md (banda, vistazo, V(p): % del cuadro con superficie de la sala vecina, con el héroe en p).

## Paso 0 — elección de la sala (por regla; sin renderizar)
1. En `dac_stage`, lista las salas con 250–600 tiles transitables (definición estricta: `!block && !void && region >= 0 && !nowalk`), excluidas 84 y 65.
2. Para cada una: dirección de cámara que elige `orient` (yaw) y si hay otra sala cuyo suelo transitable empiece a ≤ 10 tiles más allá del borde de fondo, en esa dirección. Da la distancia.
3. Elige la de id más bajo que cumpla. Entrega la tabla de candidatas y la elegida. Si ninguna cumple: PARA.
4. No hay parada para esperar a [R]: sigue.

## Paso 1 — estados
- A: sala por defecto como la BASE de v305 (muros y columnas de `planes` 3 H, margen de ventana 24, orient/planes/props ON, volumes/objects OFF, `vScale` 1, `exag` 1, Cam 6 por defecto).
- K: A con `HYP.wallH` y `HYP.colH` = 5 H (la misma constante de T42), en tu copia de trabajo. Nada más.
- B (una regla, pasos fijos):
  1. El cierre de `planes` del lado de fondo (el lado que mira la cámara con el yaw de `orient`) pasa a baranda de 1 H. Los otros lados como en A.
  2. Margen de ventana: el menor que incluya entera la sala vecina del Paso 0.
  3. Δ: sube el suelo de la vecina por el menor de {0; 0,5; 1,0; …; 4,0} H con V(hotspot) ≥ 20 %. Hotspot = la posición k4 de abajo. Prueba en orden; informa V de cada Δ probado. Si ninguno llega: 4,0 H y dilo.
  Si algún paso exige tocar `src/` y no se puede hacer en la copia de trabajo: PARA.
- Control: hash de la máscara transitable de la sala, del camino y de la meta, iguales en A, K y B. Si difieren: PARA.

## Paso 2 — posiciones, renders y medidas
1. Camino de props de la sala, 9 posiciones como en T42; usa k0, k4 y k8. Cámara por defecto que sigue al héroe.
2. Por estado y posición: PNG limpio 1280×720 (sin rótulos, bandas ni hotspot), 2 corridas con el mismo hash. Nombres neutros: `g_k0_A.png`, `g_k0_K.png`, `g_k0_B.png`, …
3. V(p) en las 3 posiciones para A, K y B (render de ids, superficie de cualquier sala que no sea la elegida; informa también solo la vecina).
4. Altura renderizada de la baranda y del cierre en cada estado; Δ elegido.
5. Hojas para [U] aparte: por posición, A | K | B con bandas y V anotados.

## Entrega
`r15_p2.zip` (PNG limpios, hojas, `r15_p2_medidas.txt` con la tabla de candidatas, la sala elegida, hashes de dato y render, Δ, V, control) + SHA256SUMS.

## Paradas
- Ninguna sala cumple el Paso 0.
- La regla B exige tocar `src/`.
- El control de máscara, camino o meta falla.
- Un hash difiere entre corridas.
Informe: cada paso HECHO / NO HECHO con evidencia; sin «se parece». Si el entorno añade un pie de atribución o un enlace de sesión, dilo.
