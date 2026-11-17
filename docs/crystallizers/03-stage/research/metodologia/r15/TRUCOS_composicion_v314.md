# Catálogo de trucos de composición (16 bits → 2D-HD) — v314, [R], 2026-11-16
Estado de cada truco: PROBADO (pase con juez ciego), REGLA (ya existe en el visor), DATO [U] (lo dijo [U]), VISTO (aparece en tomas o mapas del proyecto, lectura de [R]), HIPÓTESIS (oficio conocido, sin verificar en DQ3).
«Generable» = se puede producir por regla desde el mapa y la cámara, sin mirar la toma.

## A. Profundidad por planos (bandas B1–B5)
| # | Truco | Qué hace | Ejemplo | Generable | Estado |
|---|---|---|---|---|---|
| A1 | Vistazo / mirador | se ve otra sala por encima del cierre | Torre del Soñador | sí (vecina + Δ) | PROBADO (R1.5 P1, P2) |
| A2 | Cierre en dos planos | barrera baja cerca + masa alta lejos | 0137 baranda + salón | sí | PROBADO indirecto (P2: gana a muro alto 9-0) |
| A3 | Obstructor de primer plano | pilar, arco o estatua en B1 que enmarca y tapa en parte | 0137 dragón; 0149 pilares | sí (rojo con pie en azul) | VISTO; regla de overlay rojo existe (v259) sin probar con juez |
| A4 | Fondo falso | plano lejano construido, no transitable (pared con vano, paisaje) | 0137 ventana luminosa | sí | VISTO |
| A5 | Punto focal al fondo | vano, puerta o luz en B4–B5 sobre el eje | 0137 ventana; meta del visor | sí | REGLA (meta en cuadro) |
| A6 | Línea de baranda | parapeto que marca el paso de banda y de nivel | 0137, 0156 | sí | VISTO |
| A7 | Corte del lado de cámara | sin techo y sin muro cercano (cutaway); la sala se ve como diorama | DQ3 trono (muro sur no se ve) | sí | VISTO (catálogo v24) |
| A8 | Paso por detrás | el héroe pasa detrás de copas, dinteles o bordes de muro (bit de prioridad del SNES) | árboles del bosque | sí | HIPÓTESIS |

## B. Altura y verticalidad
| # | Truco | Qué hace | Ejemplo | Generable | Estado |
|---|---|---|---|---|---|
| B1 | Escalera sobre el eje | escalinata en Z que lleva al destino | 0202 | sí | VISTO |
| B2 | Relieve concentrado | desniveles en un solo grupo (tarima, escalinata), suelo plano en el resto | trono, 0202 | sí | VISTO; J3 lo pedía pero castigaba A1 |
| B3 | Altura fingida | bloque no transitable presentado como elevación | v259 rojo decorativo | sí | DATO [U] |
| B4 | Exagerar la arquitectura, no el suelo | muros, pilares y obstructores más altos; escaleras normales | 4d-2 (exag) | sí (`exag`) | VISTO, sin probar aislado |
| B5 | Cara de caída visible | se ve el borde de la sala sobre un nivel inferior | faja oscura del mapa 4F | sí | VISTO; ligado a T44 |
| B6 | Profundidad comprimida | la toma tiene menos profundidad en Z que el mapa (0,31–0,67) | A223 | sí (escala en Z) | VISTO, sin verificar |

## C. Encuadre y guía
| # | Truco | Qué hace | Ejemplo | Generable | Estado |
|---|---|---|---|---|---|
| C1 | Eje y simetría | camino central, alfombra | trono | sí | VISTO |
| C2 | Pares que flanquean el eje | dos pilares a los lados del paso | 0202 búhos, 0204 | sí | VISTO |
| C3 | Calcomanía guía | pentagrama, alfombra o baldosa que marca el hotspot o el camino sin geometría | 0137, 0206 | sí | VISTO; cinta = T43 |
| C4 | Pasillo ancho | 1 tile del mapa pasa a ~4 héroes de ancho | A182 | sí | DATO [U] |
| C5 | Dos escalas de héroe | interiores con héroe más pequeño o cámara más cerca | v33 | sí (heroFrac por sala) | HIPÓTESIS (tutorial sin verificar) |
| C6 | Cámara casi ortográfica | FOV bajo (teleobjetivo): menos convergencia, lectura «isométrica» | Cam 6 FOV 30 | sí | REGLA |
| C7 | Encuadre por sala | la cámara cambia de altura y ángulo por escena, no solo sigue | OT2 «variety of camerawork» | parcial | HIPÓTESIS (fuente: NintendoLife) |

## D. Fuera del Ancla (aspecto; se anotan, no se prueban aquí)
D1 desenfoque de B1 y B5 (tilt-shift, «diorama») · D2 luz guía (antorchas, haz de la ventana) · D3 niebla y gradiente de fondo · D4 sprites con iluminación.

## Fuentes
- Proyecto: v24 (catálogo SFC ↔ remake), v33, v236, v259, v284, A182, A223, R1.5 P1 y P2.
- NintendoLife, oct. 2022 (Octopath Traveler II: cámara variada, personajes más altos, «picture-perfect»).

## Enmienda 1 (2026-11-17, tras la objeción de [U])
- C6 «cámara casi ortográfica» queda DESCARTADO. Era propuesta de [R], no de los jueces. Va contra el Ancla: el 2D-HD gana profundidad por perspectiva; una cámara ortográfica (o casi) la aplana y solo da lectura isométrica. Ningún 2D-HD conocido usa ortográfica. Cam 6 (FOV 30, perspectiva) se mantiene.
- Los jueces de G1 y G2 premiaron lo contrario: «ver más lejos» y capas de profundidad.
