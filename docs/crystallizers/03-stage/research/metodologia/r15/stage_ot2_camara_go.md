# Pedido a CC — lectura de cámara de Octopath Traveler II (P3, v311) — CC mide, [R] supervisa y juzga
Repo solo lectura. Nada de `src/`. Material de terceros: solo local, nunca al repo ni al Proyecto (igual que las tomas DQ3).
Fuente: https://youtu.be/GjwOo97HeW0 (selección de 5 juegos 2D-HD). Solo el tramo de Octopath Traveler II, 8:37–11:13.

## 0. Acceso (PARADA)
- Si tu entorno no puede bajar el video o extraer fotogramas con las herramientas permitidas, PARA y dilo. No uses rodeos (mirrors, proxies, otra herramienta para saltar un bloqueo). [U] puede pasarte los fotogramas.

## 1. Tramos (índice de [U])
| Tramo | Contenido según [U] | Uso |
|---|---|---|
| 8:37–9:09 | presentación, refinamiento visual | medir |
| 9:09–9:27 | iluminación, día y noche | solo cámara (la luz queda fuera del Ancla) |
| 9:27–9:53 | entornos y verticalidad | medir, PRIORIDAD |
| 9:53–10:21 | cinematografía y detalles | marcar cada toma: juego / cinemática |
| 10:21–10:49 | sin índice | clasificar; si es combate, fuera |
| 10:49–11:13 | conclusión | medir solo si hay exploración |

## 2. Extracción
- 2 fotogramas por segundo en todo el tramo; nombre con el tiempo (`ot2_09m31s5.png`).
- Clasifica cada fotograma: EXPLORACIÓN (héroe controlable en el mapa) · COMBATE · CINEMÁTICA/MENÚ · TRANSICIÓN. Combate y menú se descartan sin medir. Cinemática: se lista, no se mide.
- Agrupa la exploración en TOMAS (secuencia continua sin corte). Informa cuántas tomas y fotogramas hay por tramo.

## 3. Medidas por toma de exploración (números, sin opinión de composición)
1. Héroe: pies en pantalla (fx, fy) y alto del héroe / alto del cuadro (M5a), en el primer y último fotograma.
2. Seguimiento: ¿la cámara sigue al héroe (fx, fy casi constantes mientras se mueve) o queda fija (el héroe se mueve en pantalla)?
3. Yaw: ¿cambia dentro de la toma? (sí / no; si sí, en qué fotogramas).
4. Pitch: estimado por el escorzo de una baldosa o rejilla del suelo cerca del héroe (relación alto/ancho aparente) y, si hay líneas paralelas del suelo, su punto de fuga. Declara el método y el error.
5. Perspectiva: ¿las verticales y paralelas convergen (perspectiva) o casi no (casi ortográfica)? Da el ángulo entre dos aristas verticales separadas en pantalla.
6. Horizonte o cielo visible: sí / no, y fracción del alto.
7. Paralaje: entre dos fotogramas con el héroe desplazado, cuánto se mueven (px) un objeto cercano, uno a media distancia y uno lejano.
8. Bandas: en un fotograma por toma, divide la profundidad en 5 bandas (definición congelada en `claude/DEFINICIONES_T26_v311.md` §1, te la paso aparte) y lista qué hay en cada una (suelo, muro, obstructor, fondo, otra zona).
9. Solape y vistazo: fotogramas donde algo cercano tapa al héroe o a otra banda; fotogramas donde se ve terreno de otra zona por encima del cierre (V(p) a ojo, en %).

## 4. Entregables
- `ot2_tomas.json` (toma → tiempos, clase, medidas 1–9), `ot2_hojas/` con una hoja por toma (primer y último fotograma, bandas dibujadas aparte, no sobre el original), sha256 de todo.
- Informe: tomas encontradas, qué no se pudo medir y por qué. Sin juicio de composición: el juicio lo hace [R].

## 5. Paradas
- Sin acceso al video (§0).
- Menos de 3 tomas de exploración en todo el tramo: PARA y reporta los tiempos, antes de medir.
