# Brief HT1-R: ¿los transformadores se replican en el mapa que no se usó?

[R], 2026-11-20. Una sola pregunta. Hipótesis: **HT1** (A591, A610–A613), nivel actual lv2; si pasa, lv3.
Leer antes: `docs/crystallizers/03-stage/TRANSFORMADORES.md` (entero) y `MARCO.md` §6.
Entrega: UN PR con su ficha `docs/crystallizers/03-stage/entregas/PR-<n>.md` (cuatro tablas). Sin firmas. Presupuesto ~90 min.

## Reglas
- Una transformación se demuestra **replicando lo que cambia**. **Nada se compara baldosa por baldosa**: la unidad es
  una estructura (zona, banda transversal al eje, borde caminable / no caminable, eje entrada → meta).
- La lectura del mapa (color → clase, zonas) es ENTRADA: se reutiliza tal como la hacen los tres `derive_roles.py`,
  no se mide ni se mejora.
- Prohibido ajustar parámetros por mapa para que pase. Saltos de altura enteros y relativos («un salto sobre su
  vecina»), iguales para los tres mapas.
- Solo `tools/ht1/` (Python con numpy; scipy si ya está instalado) y docs. **No se toca `src/` ni `data/`.** Las tomas
  cargan los PNG generados por el ejemplo de modo 3 «Your images (PNG + roles)» desde un script de `tools/ui/`.
- Si un paso falla dos veces: parar e informar.

## Paso 0 · Tablas de verdad: HECHO por [R] (A615), congeladas en `tools/ht1/truth_*.json`; CC NO las edita
Si una fila parece mal, se reporta en la ficha (tabla d); no se corrige. Lo que sigue es la especificación original del paso, como referencia.

## (Especificación original del Paso 0)
Para cada mapa (trono `refs/dq3/throne_aliahan/`, Aurhea `refs/dq3/aurheas_fountain/`, bosque
`refs/dq3/forest_plains/`) una tabla `tools/ht1/truth_<mapa>.json` con una fila por unidad del mapa plano:
unidad, vecina de referencia, cambio en el remake (sube / baja / igual, en saltos; borde cerrado sí / no; hito arriba
sí / no) y **la imagen del remake que lo muestra** (`refs/dq3/pairs/`, `refs/dq3/remake/`, `shots/m4/photo_readings.json`).
El pack hecho a mano va en otra columna, como apoyo, nunca como verdad. Donde el remake no muestra la unidad: «sin dato».
Este commit queda congelado antes del paso 2; [R] lo revisa en la ficha.

## Paso 1 · Mapas planos
`tools/ht1/flat.py`: para los tres mapas, el mismo JSON: grilla de clases (agua, piso, camino, muro, pilar, árbol,
hito sólido), zonas (piezas conectadas), máscara de camino, meta (POI) y **entrada declarada** (dato a mano, una línea
por mapa, con su razón: trono = borde sur de la alfombra, puerta detrás de la cámara; Aurhea y bosque = donde el sendero
entra al mapa). Sin ninguna altura.

## Paso 2 · Transformadores
`tools/ht1/ops.py`: T-A a T-F de `TRANSFORMADORES.md` §3, cada uno una función sobre unidades, en el orden de §4, que
devuelve el salto relativo de cada unidad y los bordes cerrados.

## Paso 3 · Dejar un mapa fuera (tres corridas)
Por cada mapa M fuera: elegir el conjunto de transformadores (cuáles encendidos, y A o F cuando chocan) con los OTROS
dos mapas, por la mayor cantidad de unidades acertadas; aplicarlo al plano de M; tabla unidad por unidad contra
`truth_M.json`. Veredicto por mapa con el descarte de `TRANSFORMADORES.md` §5 (mayoría de unidades).
**Contradicciones (§7):** cuando el conjunto elegido con dos mapas falla en el tercero, probar el conjunto alternativo
(por ejemplo F en vez de A) y anotar qué atributo del plano separa los mapas donde gana cada uno (interior / exterior,
cerrado / abierto, agua, meta arriba o no). Es un tipo candidato; no se fuerza un solo conjunto.

## Paso 4 · Escena (solo para mirar)
Los saltos → PNG de alturas (un salto = una terraza) → modo 3, Cam 6, k0 y k4, al lado del par o la foto del remake.
Láminas en `docs/crystallizers/03-stage/shots/ht1/`. Las capturas de terceros, solo en `tools/ui/out/ht1/` (no se commitean).

## Ficha
Tabla (a) con las tres corridas (unidades acertadas / total, veredicto), la tabla de contradicciones con el atributo que
separa, y la lista de unidades «sin dato». Qué no se corrió.
