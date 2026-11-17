# Resultado R1.5 Pase G1 (masas verticales y planos) — [R], 2026-11-16 ~23:10
Predicciones: PREDICCION_R15_G1_v314.md (7b18af82…). Entrega: r15_g1.zip (872c6b22…). Mapa MAPA_pruebas_g1.json (b22b8216…), abierto tras los votos. 33 pruebas por juez (3 pares idénticos de la sala 3, TODO = −A3, cuentan como «TODO no gana»).

## Calidad del juicio (declarada)
- Los 3 jueces perdieron imágenes de contexto a mitad de las 33 pruebas. B y C dieron razones genéricas en 9 pruebas cada uno; A dejó 8 sin responder.
- Las 8 de A las respondió un juez de reemplazo (A2), sin contexto, de a una, ANTES de abrir el mapa.
- 5–6 pares por juez «se ven iguales» (cambio mínimo del truco): votos a cara o cruz.

## Votos (gana con ≥ 2 de 3; nº de votos para TODO entre paréntesis)
| Comparación | s1 k0/k4/k8 | s3 k0/k4/k8 | s9 k0/k4/k8 | TODO gana |
|---|---|---|---|---|
| TODO vs BASE | B(1) B(0) T(2) | B(1) B(0) B(1) | B(1) T(3) B(1) | 2 de 9 |
| TODO vs −A3 | −(0) −(0) −(0) | idénticos | −(1) T(2) T(2) | 2 de 9 |
| TODO vs −A4 | T(2) −(1) −(0) | −(0) −(1) T(3) | T(3) −(1) T(3) | 4 de 9 |
| TODO vs −C2 | T(2) T(2) T(2) | −(1) −(1) −(0) | T(2) T(3) −(1) | 5 de 9 |

## Predicciones
H1 (principal) FALLA: TODO gana a BASE solo en 2 de 9 (BASE gana 7). H2 (A3 aporta) FALLA: quitar A3 mejora en 4 de 6 casos donde existe (sala 1 unánime). H3 (C2 aporta) 5 de 9 nominal, sin valor porque el grupo falla. H4 (A4) 4 de 9, ruido. H5 (control) cumple.

## Veredicto por la regla congelada
H1 falla → ningún truco de G1 entra en la base de G2. A3 empeora; A4 y C2 sin efecto claro.

## Lectura de [R] (razones de los jueces)
- Ganan los cuadros con el CENTRO abierto (eje despejado de primer plano al fondo) y masas solo en los BORDES del cuadro. Pierden los que tienen un pilar o columna que corta el centro o tapa al personaje (A4 como columna, C2 junto al camino, A3 en el tercio derecho de la sala 1).
- Las reglas se escribieron en coordenadas del mapa (tercios de la sala, ±2 tiles del camino) y caen en el centro de la pantalla. Un obstructor 2D-HD se define por su posición en el CUADRO (borde lateral de B1), no en la sala.
- Para G3 (encuadre) conviene reescribir el obstructor por posición en pantalla.
- El juicio de 33 pruebas por juez se degradó: en los pases siguientes, tandas de ≤ 10 pruebas por juez.
