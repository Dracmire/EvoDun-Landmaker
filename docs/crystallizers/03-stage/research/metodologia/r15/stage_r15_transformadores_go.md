# Pedido a CC · R1.5 · Transformadores 3D → 2D-HD, primer par: B6 y C6 (v323)

Contexto (decisiones de [U], 2026-11-17):
- No hay jueces automáticos ni agentes. CC genera las imágenes y [U] juzga mirando.
- Los trucos de lectura y de encuadre quedan para una fase de pulido. Ahora se prueban solo los que cambian cómo se proyecta el espacio.

TU PAPEL: construyes, renderizas y armas las hojas. No juzgas composición.

## 0. Base
- Sala T con el arnés de `harness_salat/` y `scratch/tuned.json`: SUELO y TECHO′ del grupo B (el de tu entrega `grupoB`). Posiciones s1, m1 y n1, con el encuadre por grupo.
- Si en tu entorno tienes la sala F de la Torre del Soñador (M6, tomas 0137 / 0202, rama del PR #92), úsala también, en las posiciones de esas tomas. Si no la tienes, dilo y sigue solo con la sala T.
- Sin tocar `src/`. Si un truco exige `src/`, PARADA: dilo y propón el cambio, sin hacerlo.

## 1. Los dos trucos
**B6 · profundidad comprimida.** La escena se ve con menos profundidad en Z que el mapa. En el remake, la profundidad de la toma es 0,31–0,67 de la del mapa (A223).
- Factor k sobre Z: 1 (base), 0,67 y 0,5.
- Primero intenta hacerlo en la PROYECCIÓN: escalar Z antes de proyectar, con un gancho en la página que envuelva la cámara. Así la máscara, el camino y la colisión no cambian.
- Si no se puede sin `src/`, la alternativa es remuestrear el pack en Z, avisando que cambia el tamaño de la sala.
- La altura (Y) y el ancho (X) no cambian.

**C6 · cámara casi ortográfica.** Menos convergencia: las verticales quedan casi paralelas.
- FOV 30 (base), 20 y 12.
- La cámara se aleja (dolly) para que el héroe mida lo mismo en pantalla (`heroFrac` del grupo) y su posición en pantalla no cambie.
- Pitch 25 sin cambio.

## 2. Estados
La grilla es k ∈ {1; 0,67; 0,5} × FOV ∈ {30; 20; 12}, 9 combinaciones. Se renderiza para TECHO′ en s1, m1 y n1. Cada truco solo es una fila o una columna de la grilla, y la diagonal es la combinación.

También SUELO en k 1 / FOV 30 y en k 0,5 / FOV 12, para ver el efecto sin piezas.

## 3. Hojas para [U]
Una hoja por posición:
- a la izquierda, la toma real (0202 para s1, 0137 para m1 y n1);
- a la derecha, la grilla de 3×3 con el rótulo «k = … · FOV = …» en cada celda.

Arriba de cada hoja va el texto: «Buscar: ¿la escena deja de leerse como un volumen 3D y pasa a leerse como un plano dibujado (2D-HD)? ¿Las verticales convergen menos? ¿El suelo se ve menos profundo?».

Además, las mismas hojas en las posiciones de la sala F, si la tienes.

## 4. Controles y entrega
- El héroe en pantalla mide lo mismo en las 9 celdas (± 5 %). Informa cada cifra.
- Sin fondo vacío nuevo (≤ 2 %). Si el dolly abre vacío, informa la celda y la cifra.
- Hashes ×2.
- Entrega: las hojas en PNG, los renders sueltos, `medidas_transf.txt` (cifras por celda, la técnica usada para B6 y C6, y si tocaste algo más), `SHA256SUMS` y un zip.
- Ningún juicio.
