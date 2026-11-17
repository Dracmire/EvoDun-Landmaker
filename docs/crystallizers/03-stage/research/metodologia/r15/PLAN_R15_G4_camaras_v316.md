# R1.5 · Pase G4 (cámaras) — hipótesis de [U] y plan — [R], v316, 2026-11-17
Se corre DESPUÉS de G3. G3 no cambia (ya congelado). Origen: [U] 00:47; T45.

## Hipótesis de [U] (00:47), tal como la dijo
- En DQ3 el héroe tiene escala constante y está siempre en o cerca del centro, pero el fondo cambia de forma vertiginosa.
- En la sala F (0202 desde el sur, 0137 más al norte), desde el lado sur el fondo se ve distorsionado o lejano; al acercarse recupera su tamaño. La velocidad de cambio entre ese horizonte y el héroe es pequeña dentro de la sala (de un extremo al otro en Z). ¿Salas de proporciones parecidas? ¿FOV mayor sin perjudicar al héroe, como un ojo de pez suavizado o un FOV comprimido?
- Quizá el fondo lejano es el propio dungeon dibujado en ortográfico: dentro de la sala hay FOV y perspectiva; mirando desde la baranda hacia afuera se ve el dungeon más «plano», como con un único FOV constante desde la baranda hasta el fondo, y por eso se lee como fondo. Dos cámaras: perspectiva para la sala, ortográfica para lo que se ve por encima de la baranda. Funciona porque las salas que lo usan están más altas (0202/0137 es un ejemplo).

## Dato ya medido que hay que reconciliar
En el 4h el héroe se emparejó con heroFrac 0,08 en 0202 y 0,1205 en 0137, y en v305 se midió ≈ 0,072 del alto en la toma 0202. O el héroe no es constante entre esas dos tomas, o las tomas tienen distinto zoom o recorte. G4-M lo mide antes de construir nada.

## G4-M · medición en las tomas (primero; sin construir)
1. CC lista elementos del exterior de F (más allá de la baranda N: sala C, vanos, escaleras, muros) visibles en las dos tomas, 0202 y 0137. PARADA para que [R] apruebe 2–3 elementos comunes.
2. Para cada elemento: alto aparente en px ÷ alto del héroe en px, en cada toma. Lo mismo en los renders de R1.5 P1 (B1: sala C en perspectiva) con el héroe en el heroAt de cada toma.
3. Cociente de cambio Q = (tamaño en 0137) / (tamaño en 0202), en la toma y en el render. Lo mismo para un elemento DENTRO de F (control).
Predicción (se congela con hash cuando [U] apruebe este plan):
- G4-M1 (la hipótesis de [U]): para los elementos de afuera, Q_toma está más cerca de 1 que Q_render (el fondo cambia de tamaño menos de lo que daría una sola cámara en perspectiva).
- G4-M2 (control): para el elemento dentro de F, Q_toma ≈ Q_render (±15 %).
- G4-M3: el alto del héroe en px es igual en las dos tomas (±10 %) si el recorte es el mismo; si no, se informa y se normaliza.
Si M1 y M2 se cumplen: hay evidencia de un fondo con otra proyección. Si M1 falla: el fondo de DQ3 es perspectiva normal y la hipótesis de dos cámaras no se apoya en estas tomas.

## G4-C · construcción (solo si G4-M apoya)
- Estados: B1 de G3 (o la base final de R1.5) con la vecina en perspectiva · lo mismo con la vecina en una segunda cámara ortográfica (o con FOV menor) compuesta detrás de la baranda, alineada en la línea de la baranda.
- Juez ciego contra 0137 y 0202, tandas de ≤ 9. Predicción: la versión de dos cámaras gana.
- Riesgo declarado: el horizonte de la capa ortográfica puede no calzar con el punto de fuga de la cámara en perspectiva. Si la composición exige tocar `src/`: PARADA.
- Variante a anotar (no se prueba aún): proyección no lineal (FOV comprimido o «ojo de pez suavizado») que mantiene al héroe y comprime el fondo.
