# Pedido a CC — R1.5 Pasada única, Paso 0: medir antes de congelar (v321)
Solo lectura y medida; nada se juzga ni se construye todavía. Árbol congelado e882c5c (`/tmp/m6n/wtC`); nada de `src/`. Las fichas que este paso prepara están en `INFORME_METODO_TRUCOS.md` (repo: `docs/crystallizers/03-stage/research/metodologia/`, rama docs/stage-metodologia-v319; o el Proyecto). [R] congela la pasada con hash DESPUÉS de este paso, con tus cifras.

## 1. Re-medir las tomas (Anexo F del informe integrado)
En 0137 (sha256 8235f171…) y 0202 (fe2b7b85…), con cajas dibujadas y coordenadas en fracción del cuadro (x, y de 0 a 1, del cuadro sin bordes):
- héroe que encabeza: caja de pies a coronilla (la figura completa) → alto en fracción; en 0202, los dos sprites visibles por separado.
- línea de nivel media (baranda / pretil): y del borde superior y de la base, x de inicio y fin.
- columnas y masas de borde (0137: columnas con farol a la izquierda, estatua del dragón; 0202: columnas-búho, plintos de esquina): caja de cada una y si sale por arriba o por el borde.
- ventana luminosa de 0137 (caja), pentagramas (caja), escalera del eje de 0202 (caja).
Entrega una tabla «Anexo F de [R]» contra «CC», con la diferencia por valor. Lo que difiera > 0,03 se marca.

## 2. heroFrac de la posición 0202
Con la figura completa del líder, ¿qué heroFrac reproduce en el render de P1 la fracción medida en la toma 0202? (Un paso de corrección: nuevo = usado × objetivo ÷ medido; si cae fuera del rango del visor, dilo.) Igual para 0137.

## 3. Capacidad del visor que las fichas necesitan (sí / no, con evidencia; sin tocar `src/`)
a. ¿Se puede poner un volumen rojo (overlay con pie en azul) sobre tiles FUERA de la sala, en el frente cortado por `noFront`? (fichas A3a, A3b)
b. ¿Admite un volumen con base elevada sobre tiles verdes (dintel) vía `volumeOnWalkable` u otro hook de página? (ficha A8)
c. ¿Puede una cinta pintar una figura (anillo + estrella) de 4×4–6×6 tiles centrada en el hotspot? (ficha C3)
d. ¿Puede un billboard plano claro ir detrás del cierre lejano sin `always`, y recortarse un hueco de 2–3 tiles en una pared de `planes`/volumen? (ficha A4)
e. ¿Puede el arnés transformar el pack en tiempo de ejecución (alturas por componente) para la ficha B2?
f. ¿Puede `heroScreen` fy moverse en [0,45; 0,80] por posición y medirse en el render de ids el y de una pieza? (ficha A6)

## 4. Salas candidatas con la puerta del vistazo
Terreno `dac_stage`, terraces 3, subs 2. Salas de 250–600 tiles con vecina a ≤ 10 tiles en la dirección de `orient`, por id. Para cada una, regla del vistazo con Δ ∈ {−4 … +4} H en pasos de 0,5: V(k4) y el Δ mínimo con V(k4) ≥ 10 %. Lista las 3 primeras que cumplen y las descartadas con su V máximo. Calcula también k_mir (tile del eje a 2–4 tiles del borde de fondo con V máximo).

## Entrega
`pasada_paso0.txt` (tablas 1–4), hojas `paso0_tomas.png` (cajas) y `paso0_salas.png` (V por sala), SHA256SUMS.
## Paradas
Solo las de siempre (`src/`, hashes). Un «no» en el punto 3 NO es parada: se informa y [R] ajusta las fichas. Sin «se parece».

## Enmienda 1 (2026-11-17 04:10, decisión de [U] antes de correr)
- Punto 3: [U] responde «sí» a las seis capacidades (a–f). No las investigues aparte; si al construir alguna falla, PARA y dilo.
- Terreno nuevo de la pasada (reemplaza a terraces 3, subs 2): `terraces` 3, **`subs` 1** (DQ3 es piso plano con estructuras, nunca terreno irregular) y **salto de terraza ≥ 1 H, objetivo 1,25 H** (en 0202 la escalera entre los búhos baja al menos la altura del héroe). Fíjalo con `terH` («Measures in H» como haga falta) y MIDE en el render el salto real entre terrazas en H y el alto de la escalera; si no se puede llegar a 1–1,25 H sin tocar `src/`, PARA.
- Punto 4 se hace sobre ESTE terreno: informa el hash del terreno, cuántas salas hay y, por sala candidata, niveles transitables visibles y salto máximo.
