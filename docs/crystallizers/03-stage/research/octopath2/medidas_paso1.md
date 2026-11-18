# Octopath Traveler 2 · medidas del paso 1 (6 capturas × 4 números)

Solo medición. No se tocó `src/`, no hay jueces ni ajustes. Las capturas son de un tercero (referencia, ya en `refs/oct2/`); aquí no se copia ninguna imagen.
Modelo de lectura: `research/metodologia/MODELO_ACTUAL.md` v2.1 (§2 cámara, §3 escala); método de pitch de la DQ3 (A450, A454).

## 1. Tabla

Coordenadas en píxeles de la captura original; el cuadro es el vídeo dentro de la captura (sin márgenes blancos ni esquinas redondeadas). Marcas a mano sobre cuadrículas de 10 px, error ±4 px. «H» = alto del héroe (cabeza a pies). `fx, fy` = pies en fracción del cuadro (0,0 = arriba izquierda).

| Captura | 1. Pitch (rango; central) | 2. heroFrac alto / ancho | 3. Pies (fx, fy) | 4. Profundidad útil (H), pies → cierre; rango por el rango de pitch |
|---|---|---|---|---|
| oct2_01 | 11–18°; ~14° (confianza baja) | 0,134 / 0,047 (*proxy*, ver nota) | (0,50; 0,64) | sin cierre (campo abierto, tiendas y colinas al fondo): ≥ 34 H, ~89 H con 14°; con 11° el fondo queda sobre el horizonte (indefinido) |
| oct2_03 | 22–29°; ~25° | 0,183 / 0,043 | (0,50; 0,71) | 4,6 H (3,9–5,3): base de la pared del fondo, y 300 |
| oct2_09 | 5–16°; ~10° (confianza baja) | 0,151 / 0,051 | (0,50; 0,78) | 3,3 H (2,3–4,9) hasta el pie del estrado (y 497); el muro del fondo está sobre el estrado (no medible con el modelo de suelo plano) |
| oct2_13 | 15–30°; ~20° (confianza baja) | hombre 0,150 / 0,036; mujer 0,139 / 0,034 (héroe ambiguo) | hombre (0,46; 0,55); mujer (0,53; 0,51) | hombre 1,5 H (1,0–2,1); mujer 0,9 H (0,6–1,2): pie de la escalinata (y 305) |
| oct2_16 | 11–18°; ~14° | 0,117 / 0,045 | (0,50; 0,62) | 3,5 H (2,7–4,3) hasta el pie de las escaleras (y 395); la fuente y el rellano van más arriba |
| oct2_dun_0058 | 15–22°; ~18° | 0,110 / 0,040 | (0,49; 0,61) | 21,5 H (15–31): final del puente (y 95); en la práctica lo cierra la oscuridad antes |

## 2. Método (una línea por captura)

- **01** · Pitch: gradiente de tamaño de los sprites en filas (≈ 60 px de alto con pies en y 395, ≈ 95 px con pies en y 600 → razón 1,45–1,7 → y_inf −60…+100 → 11–18°). Héroe: no identificable; se midió la figura central roja (top 388, pies 488, x 640–702) como *proxy*, no confirmado. Cierre: base de las tiendas, y ≈ 100 (95–130).
- **03** · Pitch: (a) las dos líneas de base de las paredes laterales convergen hacia y_inf ≈ −330; (b) separación de las juntas de las tablas ∝ (y − y_inf)² → y_inf ≈ −240; los dos dan 22–29°. Héroe: top 397, pies 533, x 645–702 (los pies pueden quedar mezclados con la alfombra). Cierre: base de la pared del fondo, y ≈ 300.
- **09** · Pitch: tres lecturas que no coinciden: elipse del disco de piedra (≈ 253 × 37 px → sin θ ≈ 0,15 → ~8°) y del anillo grande (~5°), rieles de los bancos hacia el punto de fuga (y_inf ≈ 260 → ~5°), rombos del piso (≈ 70 × 19 px → ~15°). Se da el rango completo. Héroe: top 478, pies 590, x 637–705. Cierre: pie del estrado, y ≈ 497.
- **13** · Pitch: el piso solo tiene adoquines, sin líneas largas. Gradiente del tamaño del adoquín (≈ 22 px de ancho a y 370, ≈ 30–35 px a y 590, razón 1,3–1,6 → y_inf −360…0 → 15–30°). Los bordes de la escalinata convergen en y ≈ −1040 pero suben con la escalera: no son líneas del suelo y se descartan (solo dan una cota de 49°). Héroe: dos personajes, no se sabe cuál es: hombre top 258, pies 353, x 592–640; mujer top 242, dobladillo 330, x 680–725. Cierre: pie de la escalinata, y ≈ 305.
- **16** · Pitch: elipse de los anillos del decal circular del piso, menor/mayor ≈ sin θ (anillo interior ≈ 283 × 53 px → ~11°; anillo exterior 442 px de ancho, alto no limpio → hasta ~17°); no depende del FOV. Héroe: top 384 (sombrero), pies 471, x 640–700. Cierre: pie de las escaleras gemelas, y ≈ 395.
- **0058** · Pitch: bordes del puente (barandas) convergen en y_inf ≈ −50 (marcas ±40 px) → 15–22°. Héroe: top 217, pies 265, x 365–396. Cierre: la puerta del final del puente, y ≈ 95 (la oscuridad empieza antes, en y ≈ 140). El cuadro es 770 × 438 (lleva texto superpuesto y barra de desplazamiento).

Cálculo de H-profundidad: sténopé con FOV 30° vertical y punto principal en el centro del cuadro (`f = (alto/2)/tan 15°`). `z = f / alto_héroe_px` (distancia del héroe en H); el rayo de los pies da la altura de la cámara `Hc` y la distancia en suelo; la profundidad útil es `X(y_cierre) − X(y_pies)` con `X = Hc / tan(φ)`, `φ = pitch + atan((y − y_centro)/f)`. Equivale a `s = (y − y_inf)/(y_pies − y_inf)` y `g = (D'/s − D')/cos θ` del §2 del modelo. El dato `s` en el cierre sale entre 0,67 y 0,96 en las salas cerradas (03, 09, 13, 16) y 0,2–0,55 en 01 y 0058.

## 3. Lo que no se pudo medir, y por qué

- **01, héroe**: no hay un personaje identificable como el héroe (filas de soldados, sin marca). Las cifras de héroe son de la figura central, como *proxy*.
- **01, profundidad**: no hay muro ni fachada cercana; el fondo son colinas y tiendas. Con pitch ≤ 12° el fondo cae sobre el horizonte y la distancia sale infinita. Solo se da una cota inferior.
- **01, pitch**: no hay líneas del piso (arena con grietas, sin bordes rectos). Solo el gradiente de tamaño de sprites de distintos tipos (soldados de capucha oscura, de sombrero rojo): el error es grande.
- **09, pitch**: las tres lecturas difieren (5° a 16°). No se reduce el rango sin una medida mejor (hay un desenfoque en primer plano).
- **09, 13, 16, profundidad**: el fondo es una escalera o un estrado. El modelo supone suelo plano; la cifra llega al pie de la escalera, no a la pared de detrás.
- **13, héroe**: dos personajes en el eje de la escalera; no hay forma de leer cuál. Se dan los dos.
- **13, pitch**: sin líneas largas en el piso; el rango (15–30°) viene de contar adoquines.
- **Todas, FOV**: el pitch por punto de fuga (01-sprites, 03, 09-rieles, 13, 0058) depende de suponer FOV 30° y punto principal en el centro; con otro FOV cambia. Solo la lectura por elipses (09, 16) no depende del FOV.
- **Todas, pies**: en 03 las botas se mezclan con la alfombra, en 09 el pie lo cubre en parte la baranda y en 13 la falda tapa los pies de la mujer; los pies cuentan ±4 px.
