# PP2 paso 6c · hub 25 sube (la salida) y X9 pasa a ser una escalera lateral

Base `02fb290`. Solo documentos, imágenes y json; nada de `src/`, `tools/` ni otras carpetas de `pp2/`. Antes de empezar comprobé los hashes de `guias/E/`, `alturas/`, `vessel_limites/`, `vessel_altura/` y `vessel_altura_b/` contra sus `HASHES_*.txt`: coinciden. Script y entorno fuera del repo. Sin veredicto: son lecturas.

## Qué hice

La planta del 6b es la base. «Celdas» = «tiles» del brief (héroe = 4 celdas).

- **Hub 25 sube al nivel 1** (el de X4–X5–X6) y se **traslada 4 celdas al norte**: filas 85–94 → 81–90, columnas 24–33, 90 celdas antes y después, misma forma. Por qué 4: al sur de 25 no había ninguna fila libre (su fila inferior, 94, toca el muro externo, fila 95), así que 5 celdas de banda exigirían 5 de desplazamiento y el tope es 4. Con 4 caben 4 celdas de banda al sur y **falta 1**. Al norte no hay más margen que el muro mínimo con h19 / h20.
- **Banda de 25:** misma regla que en la franja (piso decorativo, sobrante y la cara del muro mínimo que mira al hoyo, a ≤ 5 celdas, 8 vecinos); no pisa piso, puente ni gate (0).
- **X9, escalera lateral.** El hueco viejo de X9 (en L, filas 87–93, columnas 31–40, 25 celdas más 14 de gates) arrancaba justo al lado del piso viejo de 25; con el piso 4 filas más arriba ya no lo toca, así que **reencaminé el pasillo en recto**: hueco nuevo en las filas 87–89, columnas 32–36 (15 celdas), una celda de gate plana en (89, 31) para el escalón de la forma de 25, y los gates del lado de hub 24 (filas 87–89, columnas 37–39) se conservan. El hueco y los gates del lado de 25 viejos (32 celdas) vuelven a decorativo. Esto cambia la ruta del puente X9 (el brief preveía cambio de largo, no de trazado); si [U] prefiere otro recorrido, hay que decirlo.
- **Escalera de X9:** filas 87–89, columnas 32–38, **7 de largo × 3 de ancho** (21 celdas), eje horizontal, **baja de oeste (25, nivel 1) a este (hub 24, nivel 0)**; ocupa todo el pasillo, sin descansos (los escalones son transversales). (89, 39) queda como gate plano de nivel 0.
- **Lado norte de 25:** sin gate; la plataforma termina de golpe y en la vista lleva baranda de 2 celdas.
- **Altura (vista):** panel 1: nivel 1 = 6 de estructura + 1 de adornos = 7 celdas, con el adorno del borde en otro tono; panel 2: 7 celdas sin borde extra. Héroes de 4 celdas sobre X5, Y10 y hub 25. Banda en planta de 5 celdas.

## Lecturas

**Pisos.** 80 celdas de piso cambian (40 viejas y 40 nuevas de hub 25); en cualquier otra sala, **0**. Hub 25: 90 → 90. El muro externo (OUTER, WRAP) no cambia.

**Muro mínimo (distancia entre pisos, Chebyshev, antes → después).** Y16 3 → 3; h23 4 → 4; h24 4 → 4; h19 9 → 5; h20 9 → 5. Siempre ≥ 3.

**Banda de 25 por lado.**

| Lado | Aristas con banda | Profundidad | Falta | Por qué |
|---|---|---|---|---|
| Norte | 8 | 4–5 | hasta 1 | h19 / h20: 4 celdas entre 25 y su piso |
| Sur | 7 | 4 | 1 | el muro externo está a 4 celdas del piso nuevo |
| Este | 7 | 1–2 (una arista 5) | hasta 4 | hub 24 queda a 3 celdas; la celda este de ese muro mínimo se queda como muro |
| Oeste | 0 | — | — | Y16: solo muro mínimo |

Banda total 313 → 471 (158 alrededor de 25); piso decorativo restante 695 → 619. Perímetro de 25 cerrado por muro o banda: 85 % (lo abierto: la escalera de X9 y su gate).

**Otras escaleras de 25:** ninguna; X9 es su único gate. Pares de escaleras que se miren o estén pegadas: ninguno; la separación mínima entre cajas es de 6 celdas, y X9 queda a 26 o más de las demás. Escaleras rectangulares, ninguna sobre muro mínimo.

**A\*** (I → 19, J → 25, cofre 2 → 20; G cerrada antes y después). Antes (6b): 116 / 216 / 142 pasos, 2 escaleras por ruta. Después: **116 / 212 / 142**; I y cofre 2 con 2 escaleras, **J con 3 (cruza la de X9)**, 0 cambios de nivel directos. El destino de J (la salida) se mueve con el piso de 25, de (31, 86) a (31, 82); con el destino sin mover serían 208 pasos.

**Espejo de la banda (x = 28,5).** Total 102 → 150 celdas que no coinciden; en la zona de 25 (filas 76 en adelante) 0 → 48. El centro de hub 25 está en la columna 28,09 y su piso frente a su espejo da 20 celdas distintas antes y después (el tramo inferior estrecho era asimétrico). La asimetría nueva viene de X9, que solo está al este.

## Lo que no coincidió con la predicción de [R]

- **Hub 25 sube 2 a 4 celdas y la banda sur cabe con 5, o se acorta 1:** sube 4 (el tope) y la banda sur se acorta 1; no cabe con 5.
- **La escalera de X9 mide 4 a 5 de largo:** mide 7 (el pasillo recto va de la columna 32 a la 38), por 3 de ancho; baja hacia el este, como se esperaba.
- **La ruta a J gana una escalera y suma 1 o 2 pasos:** gana una escalera, pero **pierde 4 pasos** (216 → 212), porque el pasillo recto es más corto y la salida se mueve con el piso.
- **En la vista, hub 25 se lee como estrado de salida al fondo, a la misma altura que la franja:** a la misma altura (7); lo de la lectura queda para [U].

## Archivos

`planta.png` (antes del 6b | después, hub 25 en cian y X9 en magenta), `vista.png` (6 + 1 y 7 celdas, baranda, tres héroes), `detalle_salida.png` (hub 25, X9 y hub 24, en planta y en vista), `vessel_altura_c.json`, `HASHES_vessel_altura_c.txt` (dos corridas idénticas). Con esto queda cerrado el Vessel paso 2; estiramiento, escala × 2 y techo doble van en otros pasos.
