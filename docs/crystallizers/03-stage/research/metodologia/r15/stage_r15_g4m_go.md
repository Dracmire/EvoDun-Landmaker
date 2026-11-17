# Pedido a CC — R1.5 Pase G4-M: medir tamaños aparentes en las tomas 0202 y 0137 (v317)
Predicciones ya congeladas (PREDICCION_R15_G4M_v317). CC mide; NO juzga composición. No se construye nada nuevo. Árbol congelado e882c5c (`/tmp/m6n/wtC`); nada de `src/`.

## Material
- Tomas DQ3 de la sala F: 0202 y 0137 (las de la calibración y de P1).
- Renders de R1.5 P1, estado B1 (sala C en perspectiva, Cam 6), con el héroe en el heroAt de 0202 y de 0137. Si falta alguno, generarlo con la página de P1 y declararlo; debe reproducir el hash de P1 si ya existía.

## Paso 1 — lista de elementos → PARADA 1
- Lista los elementos de afuera de F (más allá de la baranda N: sala C, vanos, escaleras, muros) visibles ENTEROS en las dos tomas y que existan en el modelo del render. Para cada uno: nombre, recorte de cada toma y del render.
- Propón 1 elemento de control DENTRO de F con la misma condición.
- Entrega una hoja `g4m_candidatos.png` (toma 0202 | toma 0137 | render 0202 | render 0137, con cada candidato numerado) y PARA. [R] aprueba 2–3 exteriores y 1 control.

## Paso 2 — medidas (tras la aprobación)
Para cada elemento aprobado y en cada una de las 4 imágenes:
1. h = alto aparente en px (de la base visible al tope, vertical), con la caja dibujada.
2. H = alto en px del héroe que encabeza el grupo (caja del sprite).
3. r = h / H.
4. Q = r(0137) / r(0202), por separado en tomas y en renders; también Q_toma/Q_render y |ln Q|.
5. H(0137)/H(0202) en las tomas y en los renders.
Si una caja no se puede trazar (elemento tapado, cortado por el cuadro): no se estima; se informa.

## Entrega
`g4m_candidatos.png`, `g4m_cajas_*.png` (las 4 imágenes con todas las cajas), `g4m_medidas.txt` (tabla con h, H, r, Q, cocientes), SHA256SUMS.

## Paradas
PARADA 1 (obligatoria) · un elemento aprobado no existe en el modelo del render · hace falta tocar `src/` · un render no reproduce su hash de P1.
Sin «se parece». Si el entorno añade un pie de atribución o un enlace de sesión, dilo.
