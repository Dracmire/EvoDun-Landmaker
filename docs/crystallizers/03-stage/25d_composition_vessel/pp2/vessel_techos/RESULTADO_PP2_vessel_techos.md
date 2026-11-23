# PP2 paso 5e · el vessel con muros = solo techos, bordes rectos y puentes fuera

Base `e04c227`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/` y `alturas/` contra `HASHES_E.txt` y `HASHES_alturas.txt`: coinciden. Script y entorno quedan fuera del repo. Dos corridas completas dan los mismos hashes (`HASHES_vessel_techos.txt`). Unidad = celda de 8 px de la guía E; muro mínimo = 2 celdas = distancia de Chebyshev ≥ 3 entre pisos. El método v2 de [R] no está en el repo: lo reconstruí de la descripción del encargo, así que lo que sigue es mi lectura, no una copia.

## Qué hice

**Los tres elementos** (`0_solo_techos.png`, `vessel_techos.json` → `extraccion`).
- **Wrapping:** fachada, fuera y cielo conectados al borde de la imagen (1234 celdas). Ocho celdas de fachada que quedan encerradas dentro del muro no tocan el borde y las leí como muro.
- **Muro:** solo `tope` y `borde` (1812 celdas) más los pilares y objetos que no tocan una cara y esas 8 celdas.
- **Piso:** los grupos, los gates, y la cara. Las 651 celdas de cara pasan a **espacio libre** (hueco que ocupa la sala al crecer). Pilares y objetos con una cara pegada (vecindad de 8) se extraen con ella: **49 pilares y 61 objetos** (110 celdas); los que no tienen cara pegada quedan como muro: **127 pilares y 76 objetos** (203 celdas). Las 26 celdas de suelo sin grupo también pasan a espacio libre.
- **Puentes:** Y12, Y13, Y14, Y15 y X9 (171 celdas) y los 50 tiles de gate que los tocan salen; su hueco es muro. De la agrupación de gates 83+84+85 sale solo la fila y = 42 (la de Y13); la tira vertical del F4 entre X6 y el grupo 11 se queda.

**Empuje de bordes** (`1_muro_minimo.png`, `2_*.png`). Rondas simultáneas: en cada ronda cada sala avanza una celda por cada tramo recto de borde (tramo = rachas de celdas pegadas a un lado). Un tramo avanza si todas sus celdas dejan ≥ 2 celdas de muro (distancia ≥ 3) con el piso de cualquier otro grupo, mide ≥ 2 celdas y ≥ la mitad del borde del que sale. Nunca hay contacto diagonal nuevo (la distancia ≥ 3 lo impide). Aplico las propuestas de un grupo a la vez en orden rotativo y re-verifico, de modo que si dos salas pedían la misma franja gana la primera de la ronda. Límite externo: las celdas a distancia de Chebyshev ≥ 3 del wrapping (la imagen cuenta como wrapping fuera de sus bordes); la capa a distancia exacta 3 se toma celda por celda, sin la regla del tramo, para seguir la escalera. Pilares y objetos no son obstáculo (son muro); los gates sí.

**Tope ×1,38.** Cada grupo para en la vuelta cuyo área queda más cerca de 1,38 × la original (se detiene si la siguiente vuelta se aleja más; el par espejo se detiene con él). `1_muro_minimo.png` es el mismo empuje sin tope y sin puentes (todas las salas a la vez).

**Imágenes aisladas** (`2_herradura.png`, `2_norte.png`, `2_islas.png`): cada zona del perfil 1 crece sola en su imagen.

**Composición** (`3_compuesto.png`). Orden herradura → norte → islas; como no hay desplazamiento en este paso, cada zona crece con todo lo demás (lo ya crecido y lo que aún está en su sitio original) como obstáculo con muro mínimo. Además, durante la composición, el carril de cada puente (huella original más 2 celdas a cada lado) no lo ocupan las salas que ese puente no une, para que el puente pueda volver con muro mínimo (sin eso, el grupo 11 dejaba a Y13 a 1 celda).

**Puentes de vuelta.** Cada uno en sus columnas o filas originales, entre las dos salas ya crecidas, con las celdas de los extremos marcadas como gate (blanco). En las columnas donde una sala no llega (Y13 sobre la tira del F4) llena hasta el final de su huella original sin correr junto a un gate ajeno.

**Paso 5, celda (45, 48).** En la guía E es suelo del grupo 11 (clase suelo, no es gate) y toca en diagonal a X6 en (44, 47). Sobre el mapa SNES (`snes_overlay` de trabajo, no se entrega) esa celda es suelo continuo del grupo 11 (mismo ladrillo, sin escalón ni puerta); el gate son las celdas (45–46, 43–47) y termina en la fila 47. No es parte del gate: la dejé y la reporto. Hay otro contacto diagonal igual en la guía E, entre Y16 y hub 23 (una celda), que tampoco toqué.

## Lecturas que tomé

**Condiciones:** pasan todas.
- **Contactos diagonales nuevos: 0.** Los únicos diagonales de las salas son los de la guía E: X6 ↔ grupo 11 y Y16 ↔ hub 23 (una celda cada uno).
- **Muro mínimo de 2 celdas:** ninguna pareja nueva queda por debajo de min(guía, 3); ninguna celda nueva queda a menos de 3 del wrapping. Heredado de la guía E, y sin cambio: hub 17 y hub 18 con X0 (tocan sin gate), X1 con 17 y X2 con 18 (tocan), X4 con X5 y X6, X5 con Y10, X6 con grupo 11, Y16 con 23 (distancia 1) y Y10 con 23 y grupo 11 con 24 (distancia 2); y 170 celdas de piso de Y10, grupo 11 y X0 que ya estaban a menos de 3 del wrapping.
- **Islas sin superponerse:** sí. **Cada puente une las mismas dos salas:** sí (toca a las dos).
- Extra: los tres A\* de D siguen la misma secuencia de grupos (114 / 210 / 140 pasos) y G sigue cerrada.

**Piso y razones.** Piso de las salas 1774 → 2490 (×1,40); con los puentes 1945 → 2667. Sin tope las salas llegan a 3440 de piso total (con puentes fuera). Razón por grupo (con tope): X0 1,43, X1 1,41, X2 1,37, X3 1,57, X4 1,36, X5 1,46, X6 1,35, Y10 1,39, grupo 11 1,41, Y16 1,58, hub 17 1,41, hub 18 1,34, hub 19 1,37, hub 20 1,36, hub 23 1,32, hub 24 1,40, hub 25 1,48 (rango 1,32 a 1,58; las vueltas son de una celda, por eso no clavan 1,38). Sin tope: X1 3,59, X2 3,37, X0 2,78, hub 25 2,38, hub 24 2,47, X5 2,02, hub 19 2,21, Y10 1,14, grupo 11 1,43.

**Muro muerto** (techos a más de 3 celdas de un piso, dentro del wrapping): 578 → **379**. Espacio libre (caras extraídas) a más de 3 celdas de un piso: 204 → 28. (La cifra de v2, 782 → 388, no es comparable: no sé qué contaba como muro.)

**Dientes** (tramos de 1 celda de ancho que sobresalen, abriendo cada grupo con 2 × 2): 25 → **14**; en el borde externo (a ≤ 4 del wrapping) 3 → 3 (original: grupo 11, hub 23, hub 24; ahora: X0 con 2 y grupo 11 con 1). Los de X0 son las muescas de pilar que ya tenía.

**Error de espejo** (celdas que no coinciden con el reflejo; guía → compuesto): X5 ↔ X6 96 → 145; hub 23 ↔ 24 9 → 17; Y10 ↔ grupo 11 89 → 132 (no son espejo); hub 19 ↔ 20 10 → 13; hub 17 ↔ 18 8 → 20; X1 ↔ X2 7 → 8; X0 10 → 22; X3 12 → 12; X4 6 → 6; hub 25 8 → 14; Y12 ↔ Y13 2 → 9; Y14 ↔ Y15 0 → 4.

**Puentes** (largo = celdas entre las dos salas; antes → después): Y12 13 → 13 (por columna 13, 13, 11, 10; 49 → 47 celdas); Y13 13 → 14 (12, 14, 14, 12; 49 → 52); Y14 6 → 6 (6, 6, 5, 5; 24 → 22); Y15 6 → 7 (7, 7, 6, 6; 24 → 26); X9 7 × 4 → 8 × 5 de caja (25 → 30 celdas). Los extremos son escalonados porque los bordes de las salas lo son.

**Perfil 2** (una corrida): **difiere** del 1 en 38 celdas, en X0, hub 17, hub 18 y el puente Y12 (con X0 en la herradura, X0 queda en ×1,30; hub 17 ×1,28 y hub 18 ×1,32); piso total 2642 (el 1: 2667).

## Qué no calzó con la predicción de [R]

- **«El muro muerto baja de 388»:** baja a 379 con la definición de este paso (y partiendo de 578), pero la cifra de v2 no es comparable.
- **«No quedan dientes externos en el borde superior»:** quedan 3 externos en total (los de X0 son muescas de pilar de la guía E que el empuje no rellena). El total baja de 25 a 14.
- **«Y12 y Y13 más cortos que en v2 (44 y 48 celdas)»:** quedan en 47 y 52 celdas; no sé cómo contó v2.
- **«P2 = P1»:** difiere en 38 celdas.
- **Espejo:** no baja: sube en casi todos los pares. Los empujes por rondas con tope paran en vueltas distintas a cada lado y el contorno del wrapping no es simétrico.
- **Lo que dependió de mis lecturas:** reconstruir v2 desde la descripción; que la cara y los pilares pegados se vuelven espacio libre en vez de piso; el carril de cada puente reservado durante la composición; que la composición use los grupos aún sin crecer como obstáculo; el orden rotativo en vez de simultaneidad estricta; el criterio de «tramo de al menos la mitad del borde» medido sobre el tramo contiguo del que sale.

## Archivos (en `pp2/vessel_techos/`)

`0_solo_techos.png`, `1_muro_minimo.png`, `2_herradura.png`, `2_norte.png`, `2_islas.png`, `3_compuesto.png`, `reconocimiento.png`, `gris.png`, `vessel_techos.json`, `HASHES_vessel_techos.txt` y este informe. No hay guías de comparación en este paso.

Para aquí: el estiramiento del wrapping va en otro paso.
