# Pedido a CC — R1.5 Pase 1: vistazo deducido en DQ3 sala F (v312)
Repo solo lectura (e882c5c); nada de `src/`; todo en tu copia de trabajo, como en el 4h. CC construye, renderiza y mide; NO juzga composición. Las predicciones ya están congeladas por [R] (PREDICCION_R15_P1_v312.md); no las necesitas.
Material de terceros (tomas, recortes del mapa): solo local, nunca al repo.
Definiciones de banda, vistazo y V(p): claude/DEFINICIONES_T26_v311.md (te la pasa [U]).

## Paso 0 — contorno de la sala vecina C (PARADA obligatoria)
1. Reproduce A: sala F con dato fa55de91e696f y los renders de 0137 (21faf449…) y 0202 (a92b3b48…) del 4h, 2 corridas. Si no se reproducen: PARA.
2. Del recorte del mapa 4F (escala 11,4 px por tile, mismo origen que F), toma la sala C: la que queda al N de F, más allá de la baranda N, en la dirección de la cámara (rotulada «vecina C (por el mapa 4F: sin dato)» en tu Cam 5 del 4h). Lee su contorno transitable y sus aberturas.
3. Entrega `r15_C_contorno.png` (recorte del mapa con tu contorno superpuesto y la rejilla de tiles) y la lista de vértices en tiles del visor. PARA y espera el OK de [R]. No renderices nada con C antes del OK.

## Paso 1 — estados (tras el OK)
- A: sin cambios.
- B1: A + C con el contorno aprobado, suelo al MISMO nivel que F (Δ = 0), bordes y `planes` con las reglas por defecto del generador, como F. Sin props, sin volúmenes a mano, sin decoración. Nada de F cambia.
- B2: B1 con el suelo de C elevado Δ, el menor de {0; 0,5; 1,0; 1,5; 2,0; 2,5; 3,0; 3,5; 4,0} H tal que V(hotspot de 0137) ≥ 15 % del cuadro. Prueba los Δ en orden y para en el primero que cumple; informa V de cada Δ probado. Si ninguno cumple, usa 4,0 y dilo. Si Δ = 0, B2 = B1: dilo y no lo renderices aparte.
- No cambies cámara, `heroAt`, `heroFrac`, `heroScreen`, `vScale`, `exag`, `tilesPerH` ni yaw.

## Paso 2 — medidas
1. Renders de la cámara principal de 0137 y 0202 para A, B1 y B2: PNG limpios (sin rótulos, sin bandas, sin hotspot), 1280×720, 2 corridas con el mismo hash.
2. V(p) para A, B1 y B2 en 0137 y 0202: hotspot y 4 posiciones a ±2 tiles (N, S, E, O). Método: render de ids (superficie de C contra todo lo demás), % del cuadro.
3. V de las tomas 0137 y 0202: % del cuadro con terreno que no es de la sala F (tu lectura, declarada; sin juicio).
4. Control A → B1: diff de dato (debe tocar solo C); % de píxeles que cambian dentro de la silueta de F en los dos encuadres.
5. Hojas para [U] (aparte de los PNG limpios): toma | A | B1 | B2 con bandas y V anotados.

## Entrega
`r15_p1.zip` con los PNG limpios (nombres neutros: `f0137_A.png`, `f0137_B1.png`, …), las hojas, `r15_p1_medidas.txt` (hashes de dato y de render, Δ elegido, tabla de V, control) y sha256 de todo.

## Paradas
- A no se reproduce.
- Paso 0 (siempre).
- Añadir C exige tocar `src/` o cambiar algo de F.
- Un hash difiere entre corridas.
Informe: cada paso HECHO / NO HECHO con evidencia; sin «se parece» ni notas de composición. Si el entorno añade un pie de atribución o un enlace de sesión, dilo.
