# R1.5 · Pase G2 (altura y exageración) — predicciones, reglas y juez — [R], v315, 2026-11-16
Congeladas ANTES de pedir nada a CC. Solo se añaden enmiendas al final. Plan: PLAN_R15_grupos_v314 (G2 ajustado por [U] 23:01).

## 1. Corrección de [U] (23:01), dictada
Las terrazas no estaban bien hechas: primero se reducen a máximo 3 terrazas y 1–2 subterrazas (1 si la vista es muy clara); después se aplican exageración y cámara. Por eso la nueva base lleva `terraces` 3 y `subs` 2, y la cámara queda para G3.

## 2. Salas y posiciones
- Ejemplo `dac_stage`, árbol e882c5c, con `terraces` 3 y `subs` 2. El terreno cambia: se repite el Paso 0 del Pase 2 sobre este terreno (250–600 tiles transitables, vecina a ≤ 10 tiles en la dirección de cámara, sin 84 ni 65) y se toman las 3 primeras candidatas por id.
- Posiciones k0, k4, k8 del camino de props, con la fórmula del Pase 2.

## 3. Estados
- BASE = terreno nuevo + regla del vistazo (baranda de 1 H al fondo, ventana con la vecina, Δ por V ≥ 20 % con tope 4 H, lectura «solo la vecina»). `vScale` 1, `exag` 1.
- TODO = BASE + B2 + B4 + B7:
  - B2 · relieve concentrado: `subs` 1 (la variante «vista muy clara» de [U]).
  - B4 · exagerar la arquitectura: `exag` 1,3 (solo muros, volúmenes y objetos).
  - B7 · exageración vertical general: `vScale` 1,25 (la variante S2 aceptada por [U] en el 4d-2: vScale 1,25 con exag 1,3).
- TODO−B2, TODO−B4, TODO−B7.
- Δ de la vecina se calcula una vez en BASE y se mantiene en los demás estados.

## 4. Juez
- 3 jueces; cada juez = 4 subagentes nuevos con tandas de ≤ 9 pruebas (para que no pierdan contexto). Referencia R = toma 0137. Texto exacto del Pase 2.
- Comparaciones por sala y posición: TODO vs BASE, TODO vs TODO−B2, TODO vs TODO−B4, TODO vs TODO−B7 (36 por juez). Pares idénticos por hash: no se juzgan y cuentan como «TODO no gana».
- Gana una prueba el estado elegido por ≥ 2 de 3. Mapa con sha256, abierto solo tras los votos.

## 5. Predicciones
- I1 (principal): TODO gana a BASE en ≥ 6 de 9.
- I2: B7 (`vScale`) aporta (≥ 5 de 9).
- I3: B4 (`exag`) aporta (≥ 5 de 9).
- I4: B2 (`subs` 1) sin predicción.
- I5 (control): máscara transitable, camino y meta iguales en BASE, TODO−B2 y en los estados con `subs` 1 entre sí; si `subs` cambia la máscara, se declara y no invalida.

## 6. Decisión
- I1 se cumple → entran a la base de G3 los trucos que aportan.
- I1 falla → la base de G3 = BASE de G2 (terreno de [U] + vistazo).
- Hash distinto entre corridas o falta material → nulo.

## 7. Límites
- 3 salas de un generador, jueces del mismo modelo, referencia de otro juego.
- Valores de exag y vScale tomados del 4d-2; subs 1 de [U].
