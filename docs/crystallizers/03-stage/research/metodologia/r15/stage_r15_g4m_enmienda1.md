# Enmienda 1 al pedido G4-M (v317) — dársela a CC en la PARADA 1, antes de medir
Predicción congelada: PREDICCION_R15_G4M_v317 (Enmienda 1). CC mide; no juzga.

## Qué estamos buscando (léelo antes de elegir elementos)
[U] sospecha que en DQ3 HD-2D lo que se ve más allá de la baranda norte de la sala F NO está dibujado con la misma cámara que la sala: la sala usa perspectiva, el dungeon de abajo se vería «plano», como con una cámara ortográfica o de otro FOV. Eso deja dos huellas que se pueden medir sin opinar:
1. Puntos de fuga: con una sola cámara, todas las líneas que en el mundo van hacia el fondo (eje Z) convergen en el MISMO punto, dentro y fuera de la sala. Con una segunda cámara, las líneas de afuera convergen en otro punto, o quedan paralelas.
2. Tamaños: en perspectiva, lo de afuera crece al acercarse la cámara; en ortográfica, no. Por eso se mide el tamaño relativo al héroe en 0202 (lejos) y 0137 (cerca).

## Paso 1 (amplía la lista de candidatos)
Además de los elementos de la PARADA 1, marca en las 4 imágenes (toma 0202, toma 0137, render 0202, render 0137):
- Aristas en Z DENTRO de F: ≥ 2 (juntas del suelo que van al fondo, lados de la alfombra o del pasillo, bordes laterales de escaleras, canto inferior de muros laterales).
- Aristas en Z AFUERA (más allá de la baranda): ≥ 2, del mismo tipo.
Reglas: rectas reales del mundo (no sombras, no bordes de sprites), cada una ≥ 80 px de largo visible, sin cruzar la baranda. Si afuera no hay 2 aristas en Z en alguna toma, dilo: esa toma no sirve para M4. Pon las aristas numeradas en `g4m_candidatos.png` junto con los elementos. PARA igual que antes.

## Paso 2 (tras la aprobación; además de lo ya pedido)
1. Para cada arista: (x1,y1),(x2,y2) en px, con la recta dibujada y prolongada en `g4m_fuga_*.png`.
2. Por grupo (interior / exterior) y por imagen: punto de fuga por mínimos cuadrados (x, y), residuo medio en px y ángulo máximo entre aristas del grupo.
3. Separación entre punto de fuga interior y exterior, en % del alto del cuadro. Si un grupo tiene aristas casi paralelas (ángulo < 1°), escribe «paralelas» en vez de un punto.
4. Ancho aparente w de cada elemento exterior aprobado (borde izquierdo a derecho a la misma altura), r_w = w/H, y Q_ancho = r_w(0137)/r_w(0202), en tomas y renders.
5. Héroe: H = de los pies a la coronilla del sprite que encabeza, sin arma ni efectos; si el sprite está en un cuadro de animación distinto entre tomas, dilo.

## Control obligatorio
En los renders (una sola cámara, Cam 6) el punto de fuga interior y el exterior deben coincidir (≤ 5 % del alto). Si no coinciden, el método de aristas falla: PARA y entrega lo medido.

## Entrega adicional
`g4m_fuga_*.png` (4), y en `g4m_medidas.txt` una sección «fuga» y otra «anchos».
