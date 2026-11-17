# R1.5 · Pase 1 (vistazo deducido en DQ3 sala F) — predicciones, regla y juez — [R], v312, 2026-11-16
Congeladas ANTES de pedir nada a CC. Solo se añaden enmiendas al final. Definiciones: claude/DEFINICIONES_T26_v311.md (sha256 3eafd0ee…).
Pregunta: ¿añadir la sala vecina que se ve por encima del cierre (el vistazo de T26), producida por regla y no a mano, acerca la composición de la sala F a la toma del remake?

## 1. Estados (una variable por paso)
- A = sala F tal como está (dato fa55de91e696f; 0137 heroAt (23,5; 18,5), 0202 heroAt (29,5; 43,5); variante S1; cámaras congeladas). Detrás de la baranda N hoy hay vacío.
- B1 = A + sala vecina C (la del mapa 4F más allá de la baranda N, en la dirección de la cámara) con su contorno del mapa viejo, suelo AL MISMO NIVEL que F (Δ = 0) y las reglas por defecto del generador (bordes y planes como F; sin props, sin decoración a mano). Variable: presencia de C.
- B2 = B1 con C elevada Δ por la REGLA DEL MIRADOR: Δ = el menor de {0; 0,5; 1,0; … ; 4,0 H} con V(hotspot) ≥ 15 % del cuadro; si ninguno llega, Δ = 4,0 H y se informa. La regla usa solo mapa y cámara, nunca la toma. Si Δ = 0, B2 = B1 y no se juzga aparte. Variable respecto de B1: Δ.

## 2. Medidas (CC)
- V(p) = % del cuadro con superficie de otra sala (C), en la cámara principal de 0137 y de 0202, en el hotspot y en 4 posiciones a ±2 tiles (N, S, E, O) del hotspot.
- V de las tomas 0137 y 0202: % del cuadro con terreno que no es de la sala F, leído por CC (lectura, no juicio).
- Control de A → B1: diff de dato solo en C; % de píxeles que cambian en la zona de F.

## 3. Juez (comparación ciega contra la toma; sin rúbrica)
- 3 subagentes sin contexto, independientes. Cada prueba = la toma de referencia + dos renders sin rótulo en orden al azar (lo arma [R] desde los cuadros de CC; el orden queda en un mapa aparte).
- Pruebas: 0137 A vs B1 · 0202 A vs B1 · (si B2 ≠ B1) 0137 B1 vs B2 · 0202 B1 vs B2.
- Texto exacto que recibe cada juez: «La imagen R es una referencia. Las imágenes 1 y 2 son maquetas sin texturas. ¿Cuál de las dos, 1 o 2, se parece más a R en COMPOSICIÓN: qué se ve en cada franja de profundidad, qué tapa a qué, qué tan lejos se ve y dónde queda el personaje? Ignora color, luz, texturas y detalle. Responde 1 o 2 y una línea con la razón.»
- Gana un estado si lo eligen ≥ 2 de 3 jueces.

## 4. Predicciones
- Q1 (control de la toma): en 0137 la toma muestra terreno de otra sala: V_toma(0137) ∈ [10; 40] %.
- Q2: V(A) < 1 % en las 5 posiciones de 0137 (detrás de la baranda solo hay vacío).
- Q3: V(B1, hotspot 0137) > 0 (con Δ = 0 algo de C ya asoma sobre la baranda).
- Q4 (PRINCIPAL): en 0137, B1 gana a A.
- Q5: en 0202, B1 gana a A o empata en la práctica (no se predice con fuerza: el vistazo de 0202 es menor).
- Q6: si B2 ≠ B1, B2 gana a B1 en 0137.
- Q7 (control): A → B1 no cambia nada de F (diff de dato solo en C; ≤ 0,5 % de píxeles cambiados dentro de la silueta de F).

## 5. Regla de decisión
- POSITIVO si Q4 y Q7 se cumplen: el vistazo por regla es una palanca real; siguiente pase = el mismo truco en una sala DAC NO usada (prueba de Generación), con su propia predicción congelada.
- NEGATIVO si A gana a B1 en 0137: el vistazo, tal como lo produce la regla, no acerca a la toma; se registra y se prueba el siguiente truco (obstructor de primer plano) antes de volver a este.
- NULO si Q7 falla (el cambio tocó F) o falta material: se corrige y se repite, sin juzgar.
- Q6 decide solo si la regla del mirador (Δ) aporta sobre la mera presencia de C.

## 6. Límites declarados
- Dos encuadres, una sala, tres jueces: prueba de dirección, no de magnitud.
- El contorno de C sale del mapa viejo leído por CC y verificado por [R] (Paso 0); su interior es el del generador por defecto, más pobre que el remake.
- El umbral de 15 % y los escalones de Δ son míos (fijados aquí, antes de ver nada).
- [R] conoce las tomas: no juzga; solo arma las pruebas y aplica la regla.
