# Enmienda 2 al pedido G4-M (v317) — respuesta a tu PARADA 1
Predicción congelada: PREDICCION_R15_G4M_v317 (Enmienda 2). CC mide; no juzga. No se abre ninguna toma nueva.

## Decisión sobre tu parada
- Aceptado: M1/M2 (tamaños) y M4 (punto de fuga en Z) no se pueden medir en las tomas. No los midas en las tomas.
- Sí mide: M3 (alto del héroe en las 2 tomas y los 2 renders) y el punto de fuga en Z INTERIOR en las 4 imágenes (lo que ya marcaste: Zi1…); el exterior solo en el render 0137 (Zo1, Zo2), como control del método.
- Nuevo: M6, verticales.

## M6 · Verticales (qué se busca)
Con una sola cámara en perspectiva mirando hacia abajo, las aristas verticales del mundo se inclinan en pantalla y todas apuntan a un mismo punto muy por debajo del cuadro; cuanto más lejos del centro horizontal, más inclinadas. Si lo de afuera estuviera dibujado con otra cámara ortográfica, sus verticales quedarían rectas (0°) aunque estén lejos del centro.

## Paso 1 (PARADA corta)
En las 4 imágenes marca:
- Verticales DENTRO de F: ≥ 2 (cantos de muro, pilares, plinto del dragón, postes de la baranda).
- Verticales AFUERA (más allá de la baranda): ≥ 2 (marco de la ventana, cantos de muro del salón de abajo, postes o cantos de la escalera lejana de la derecha).
Reglas: rectas reales del mundo, ≥ 80 px (si no hay, ≥ 60 px y dilo), y prioriza las que estén lejos del centro horizontal (|x − 640| ≥ 250 px). Entrega `g4m_verticales.png` numerada y PARA si alguna toma no tiene 2 verticales exteriores; si las tiene, sigue sin esperar.

## Paso 2 (medidas)
1. Cada vertical: (x1,y1),(x2,y2) en px, ángulo respecto de la vertical de pantalla (grados, + = el extremo inferior hacia el centro).
2. Grupo interior: punto de fuga vertical por mínimos cuadrados y residuo medio.
3. Cada vertical exterior: inclinación predicha por el punto interior en su x, inclinación medida, diferencia, y error de la medida por ±5 px en los extremos (tomas) o ±1 px (renders).
4. Igual en Z: punto de fuga interior en las 4 imágenes; en el render 0137 también Zo1–Zo2 contra el interior.
5. M3: H en px y H(0137)/H(0202) en tomas y renders.
6. Si puedes, el punto de fuga vertical analítico del render (Cam 6) para comprobar el método.

## Entrega
`g4m_verticales.png`, `g4m_cajas_*.png` (con todas las rectas prolongadas), `g4m_medidas.txt` (secciones héroe, fuga Z, verticales), SHA256SUMS.
Sin «se parece». Si el entorno añade un pie de atribución o un enlace de sesión, dilo.
