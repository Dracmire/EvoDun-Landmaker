# PP2 paso 5f · el vessel con SDF real y un tope propio por zona

Base `46a8be5`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/` y `alturas/` contra `HASHES_E.txt` y `HASHES_alturas.txt`: coinciden. Script y entorno quedan fuera del repo. Dos corridas completas dan los mismos hashes (`HASHES_vessel_zonas.txt`). Unidad = celda de 8 px de la guía E; las imágenes y las medidas usan un mapa con 14 celdas de relleno por lado (el `recorte` del json lo dice); las coordenadas de abajo van sin ese relleno. Muro mínimo = 2 celdas = distancia de Chebyshev ≥ 3 entre pisos.

## Qué hice

**Elementos (forma 2 de [U]).** Muro = el techo (`tope`, `borde`) donde está, más pilares y objetos que no tocan una cara. La cara (651 celdas) no es estructura: cada celda de cara pasa a ser piso de la sala que tiene **delante**, que leí como la primera sala que aparece al bajar (hacia el sur) por la misma columna a través de caras. Los pilares y objetos pegados a una cara (110 celdas) toman la sala de las caras absorbidas de su vecindad (mayoría; empate: el id menor). Resultado, **piso por defecto** de las salas: 1774 (guía E) → 2396. Caras absorbidas por sala: X0 71, X1 28, X2 25, X3 40, X4 60, X5 64, X6 25, grupo 11 35, hub 17 25, hub 18 27, hub 19 44, hub 20 49, hub 23 41, hub 24 47, hub 25 41, Y10 0, Y16 0. **Sin sala delante: 133 celdas de cara y 6 de pilar / objeto** (frente a puentes, gates o muro): quedan como espacio libre. Wrapping como en el 5e (el exterior conectado al borde; ocho celdas de fachada encerradas en el muro las leí como muro).

**S1 · SDF por zona.** Cada sala crece con una caja de Chebyshev `d` (las 4 direcciones a la vez, sin regla de tramo) desde su piso por defecto, dentro de su región. **S2:** la zona crece junta y para en la vuelta `d` cuyo piso total queda más cerca de 1,38 × su área por defecto.

**S3 · un solo muro mínimo.** El espacio se reparte entre las salas por Voronoi de Chebyshev de sus pisos por defecto; la línea media es el muro: se carvan las celdas de cada región que tocan (8 vecinos) a otra región, o sea 1 celda por lado = 2 celdas de muro, y las celdas del piso por defecto nunca se carvan. Así entre dos salas que se acercan queda un solo muro en la línea media. **S4 · recto:** donde varias salas están a ≤ 4 celdas de la más cercana, la celda va a la sala más cercana en el eje en que las dos están más separadas (empate: más piso en esa fila o columna, luego el id menor), para que la línea media sea recta y gire en ángulo recto.

**S5 · muro externo empujado.** El límite ya no es una caja fija: las salas pueden crecer sobre el wrapping. Para cada celda de piso se toma el grosor que el SNES tenía en el punto de borde más cercano (celdas de muro entre el piso por defecto y el wrapping, solo si ≤ 6) y se pasan a muro las celdas del wrapping que quedarían más cerca; el wrapping se corre con ellas (171 celdas pasaron de wrapping a muro).

**S6 · espejo.** Toda la zona usa la misma `d`, así que los pares comparten vuelta. **S7 · composición.** Cada zona se calcula en su imagen sin las otras (`P1_herradura.png`, `P1_norte.png`, `P1_islas.png`, `P2_herradura.png`, `P2_islas.png`); se compone con el Voronoi de todas las salas, sin orden de prioridad. Los puentes salen durante el crecimiento y vuelven en sus columnas originales entre las dos salas, con un gate en cada extremo; para que puedan volver con muro mínimo, el carril de cada puente (su huella y 2 celdas) no lo ocupan las salas que ese puente no une.

## Lecturas que tomé

**Condiciones.**
- **0 dobles muros de 1 pegados:** 0. Defino un doble muro como un tramo de 4 o más celdas de muro entre dos salas cuyos pisos están pegados a la línea media de su par. Hay **15 escalones de 1 celda** (tramos de 3 celdas donde la línea media cambia de columna o de fila; detalle en `vessel_zonas.json`).
- **0 contactos diagonales nuevos:** los dos de la guía E (X6 ↔ grupo 11, Y16 ↔ hub 23) siguen.
- **Ningún muro externo más delgado que en el SNES:** ninguna sala (mínimos por sala en el json).
- **Ninguna isla se superpone; cada puente une las mismas dos salas:** sí.
- **Muro mínimo:** ninguna pareja baja de su distancia por defecto o de 3, salvo las heredadas, que se quedan igual: X0 con 17 y 18, X1 con 17, X2 con 18, X4 con X5 y X6, X5 con Y10, X6 con el grupo 11, Y16 con 23 (distancia 1), Y10 con 23 y grupo 11 con 24 (distancia 2). **Dos parejas nuevas bajan de 3 ya en el tamaño por defecto, por las caras absorbidas: X5 ↔ hub 19 y X6 ↔ hub 20 (la distancia entre pisos pasa de 7 a 2, o sea 1 celda de muro).** Siguen así en el compuesto.
- Extra: A\* de D con las mismas secuencias (114 / 214 / 140 pasos) y G cerrada.

**Zonas** (piso por defecto → solo → compuesta; razón sobre el por defecto; vuelta `d`): herradura 1266 → 1669 (×1,32) → 1629 (×1,29), `d` = 1; norte 654 → 837 (×1,28) → 827 (×1,26), `d` = 1; islas 476 → 690 (×1,45) → 661 (×1,39), `d` = 1. Piso por vuelta de la herradura 1266, 1669, 2032, 2367 (la vuelta 2 ya da ×1,60, más lejos de 1,38). En P2: herradura 1554 → 2065 (×1,33), islas 842 → 1175 (×1,40), también `d` = 1. Piso total de las salas: 1774 → 2396 por defecto → **3117** (con puentes 3281; ×1,76 sobre la guía E, ×1,30 sobre el por defecto).

**Salas** (razón sobre el piso por defecto): X0 1,28, X1 1,31, X2 1,39, X3 1,31, X4 1,05, X5 1,24, X6 1,30, Y10 1,32, grupo 11 1,28, Y16 1,84, hub 17 1,17, hub 18 1,20, hub 19 1,39, hub 20 1,34, hub 23 1,33, hub 24 1,47, hub 25 1,48. Ninguna queda por debajo de 1.

**Muros mínimos:** 582 celdas en 27 tramos; por largo de muro entre pisos, 108 recorridos de exactamente 2 celdas, de los cuales dentro de la herradura 36, dentro del norte 30, herradura ↔ islas 20, entre islas 16 (19 ↔ 20 solos: 16), herradura ↔ norte 6.

**Muro externo y silueta:** 0 salas con el muro más delgado (por ejemplo X1, X2, Y16, hub 17, 18, 23, 24, 25: 3 celdas antes y después; X0, Y10, grupo 11: 0 y 0). Silueta (extensión de todo lo que no es wrapping): 104 → 105 filas (filas 4–107 → 3–107) y 56 → 58 columnas (1–56 → 0–57), o sea 1 fila al norte y 1 columna por cada lado.

**Dientes** (1 celda de ancho, apertura 2 × 2): 25 → 29.

**Error de espejo** (guía E → compuesto): X5 ↔ X6 96 → 168; hub 23 ↔ 24 9 → 34; Y10 ↔ grupo 11 (sin espejo) 89 → 163; hub 19 ↔ 20 10 → 22; hub 17 ↔ 18 8 → 16; X1 ↔ X2 7 → 17; X0 10 → 12; X3 12 → 12; X4 6 → 6; hub 25 8 → 14; Y12 ↔ Y13 2 → 15; Y14 ↔ Y15 0 → 11.

**Puentes** (largo por columna antes → después): Y12 13 → 9 / 14 / 13 / 11 (49 → 47 celdas); Y13 13 → 14 / 14 / 11 / 11 (49 → 50); Y14 6 → 3 / 7 / 6 / 5 (24 → 21); Y15 6 → 4 / 7 / 5 / 4 (24 → 20); X9 25 → 26 celdas. Todos tocan sus dos salas.

**Muro muerto** (techo a más de 3 celdas de un piso): 578 → 169; caras sin sala a más de 3 celdas de un piso: 0.

**P2 contra P1:** idéntico (0 celdas distintas): con el tope por zona los dos perfiles paran en la vuelta 1.

## Qué no calzó con la predicción de [R]

- **«Arriba siguen la escalera sin dientes»:** los dientes pasan de 25 a 29, y no medí cuántos están en el borde externo; el borde de arriba (X0, hub 17 y 18) sí queda pegado al muro externo empujado en la imagen.
- **«0 dobles muros»:** 0, pero con 15 escalones de 1 celda donde el muro mide 3.
- **«Las salas crecen hacia los 4 lados»:** las que están contra otra sala o contra el borde de su región crecen menos de un lado (X4 sube solo 1,05 sobre su tamaño por defecto).
- **«P1 y P2 difieren en el norte»:** no difieren.
- **«Los muros mínimos aparecen sobre todo dentro de la herradura y entre 19 y 20»:** calza en parte: herradura 36 y 19 ↔ 20 16, pero el norte tiene 30.
- **Espejo:** sube en casi todos los pares; con el Voronoi, la línea media entre salas que no eran simétricas queda en lugares asimétricos.
- **Lo que dependió de mis lecturas:** la sala «de delante» como la de abajo (sur); los pilares y objetos que toman la sala de sus caras vecinas; el reparto por eje de mayor separación con la ventana de 4 celdas; que el tope se mide sobre la zona sola y no sobre la compuesta; el grosor externo por el punto de borde más cercano; la definición de doble muro (4 o más con ambos pisos pegados).
- **Lo que no resolví:** los dos pares X5 ↔ hub 19 y X6 ↔ hub 20 ya empiezan a 1 celda de muro por las caras que absorben las dos salas; la regla S4 deja 15 escalones de 1 celda en la línea media.

## Archivos (en `pp2/vessel_zonas/`)

`0_tamano_por_defecto.png`, `P1_herradura.png`, `P1_norte.png`, `P1_islas.png`, `P1_compuesto.png`, `P1_reconocimiento.png`, `P2_herradura.png`, `P2_islas.png`, `P2_compuesto.png`, `P2_reconocimiento.png`, `vessel_zonas.json`, `HASHES_vessel_zonas.txt` y este informe.

Para aquí: el estiramiento × 1,17, la escala × 2 y las alturas van en otros pasos.
