# R1.5 · Pase G3 (encuadre) — predicciones, reglas y juez — [R], v316, 2026-11-17
Congeladas ANTES de pedir nada a CC. Solo se añaden enmiendas al final.
Cambios previos: C6 (cámara casi ortográfica) descartado por [U] (A347); «doble cámara» anotada como T45, fuera de este pase.

## 1. Salas, base, posiciones
- Salas 3, 8 y 9 del terreno de G2 (terraces 3, subs 2). Posiciones k0, k4, k8: los mismos tiles de G2.
- BASE = BASE de G2 en cada sala (vistazo con Δ 4 H, baranda BACK de 1 H, exag 1, vScale 1; hooks de G2). Debe reproducir los PNG BASE de G2 (mismo sha256).

## 2. Trucos (reglas por posición en PANTALLA desde la cámara de k4; volúmenes del visor; nunca sobre tiles transitables)
- E1 · Obstructor de borde: a cada lado, el tile NO transitable más cercano a la cámara cuya proyección en k4 caiga en el 15 % exterior del ancho del cuadro (izquierda o derecha) y en la mitad inferior del alto; ahí un pilar de 2×2 tiles y 6 H (su tope sale por arriba del cuadro en k4; se informa si no sale). Ningún píxel del pilar entra en el 70 % central del ancho en k4; si no hay tile que cumpla, ese lado se omite y se informa.
- E2 · Baranda de franja media: en los bordes donde un tile transitable linda con un tile NO transitable al menos 1 H más bajo (una caída) y cuya proyección en k4 cae entre el 35 % y el 65 % del alto del cuadro, un volumen de 0,6 H sobre el tile no transitable (tope = suelo transitable + 0,6 H). Se informa cuántos tiles y su longitud continua máxima.
- E3 · Cinta guía: la cinta sobre el camino de props de T42 (capa declarada, calcomanía sobre el suelo, mismo color), desde k0 hasta la meta.

## 3. Estados por sala
BASE · TODO (BASE + E1 + E2 + E3) · TODO−E1 · TODO−E2 · TODO−E3.

## 4. Juez
3 jueces × 4 tandas de 9 (subagentes nuevos), referencia R = toma 0137, texto exacto del Pase 2. Comparaciones por sala y posición: TODO vs BASE, TODO vs TODO−E1, TODO vs TODO−E2, TODO vs TODO−E3. Pares idénticos por hash: no se juzgan, cuentan como «TODO no gana». Gana el estado elegido por ≥ 2 de 3. Mapa con sha256, abierto tras los votos.

## 5. Predicciones
- K1 (principal): TODO gana a BASE en ≥ 6 de 9.
- K2: E2 (baranda) aporta (≥ 5 de 9).
- K3: E1 (obstructor de borde) aporta (≥ 5 de 9).
- K4: E3 (cinta) sin predicción.
- K5 (control): máscara transitable, camino y meta iguales en los 5 estados; ningún volumen sobre tile transitable.

## 6. Decisión
K1 y K5 → entran los trucos que aportan; la base final de R1.5 = BASE + esos trucos. K1 falla → la base final de R1.5 = BASE de G2.

## 7. Límites
3 salas, jueces del mismo modelo, referencia de otro juego; E1 y E2 nacen de razones de los jueces de G1 y G2 (se prueban aquí, no se dan por ciertos); umbrales (15 %, 35–65 %, 6 H, 0,6 H) fijados por [R] antes de ver nada.
