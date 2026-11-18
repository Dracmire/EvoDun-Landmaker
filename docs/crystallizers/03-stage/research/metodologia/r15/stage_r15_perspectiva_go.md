# Pedido a CC · R1.5 · Último intento: medir la perspectiva telescópica (v326)

Mecánica de [U] (2026-11-18), la que hay que medir:
1. **A la altura del héroe**, todo tiene su tamaño normal (escala 1).
2. **Al sur del héroe**, todo tiene su tamaño normal o difuminado; no se ha visto que crezca. Hay que comprobarlo (la cabeza de búho).
3. **Al norte del héroe**, las cosas se achican gradualmente, con un límite (hipótesis: no menos del ~50 %). Entre los pilares y la baranda del fondo, el horizonte crece del 20–25 % al ~50 % de la pantalla.
4. **El flujo de norte a sur:** las cosas crecen hasta el tamaño normal al llegar a la banda del héroe. El flujo se detiene donde la cámara no puede avanzar.
5. **Bloqueo suave** (A434): ante un obstáculo que no se puede cruzar (baranda, puerta), la cámara deja de avanzar ~1 héroe antes y el héroe la alcanza (~½ héroe en pantalla). Al llegar a la banda del horizonte, el norte queda estático y la perspectiva telescópica se debilita o desaparece (por comprobar).

Objetivo: obtener los parámetros con números reales y comprobar que nuestra escena hace la misma transición. No juzgas; [U] juzga las hojas. Sin jueces automáticos.

## 0. Base
- **Sala:** T3 (tu entrega), con dos cambios:
  - (a) pilares de ~5 H desde la base de la escalera (no 11 H): tienen que DESAPARECER por perspectiva hacia los 3/4 del recorrido;
  - (b) calcomanías: hexagramas cuadrados de igual tamaño (por ejemplo 6×6 tiles) en 4–5 profundidades: al sur de la escalera, en la posición inicial del héroe (como 0202), a mitad de camino, junto a la baranda norte y, si cabe, más allá.
- **Camino:** el de 0137. El héroe pasa por el LADO IZQUIERDO del pilar izquierdo (por su sombra) y sigue hasta media banda por debajo de la baranda norte. No va por el centro.
- **Referencias:**
  - c_bc55 (0202);
  - c_1320 (0137);
  - la toma «Lord Fenton» (0137 desde otra captura), que [U] adjunta.

  Todas son de terceros y no se commitean.

## 1. Medir las referencias (sobre la superficie del suelo)
- **Escala por profundidad:** el tamaño aparente de objetos conocidos dividido por el alto del héroe en su banda. Objetos:
  - pentagrama (ancho);
  - postes de la balaustrada lejana (1,56 H, A210);
  - balaustrada de 0202 (1,10 H);
  - ventana;
  - hacia el sur, la cabeza de búho y el ancho del pilar.

  Resultado: una curva «escala contra y de pantalla» por toma. Indica si al sur algo supera 1 y cuál es la escala mínima al norte.
- **Pentagrama como cuadrado:** la razón fondo/ancho en pantalla (≈ K · sen(pitch), A435).
- **Líneas de fuga sobre el suelo:** usa las de [U] (bordes de plataformas y juntas: rojo y amarillo en `Dq3_bands5.png`), marcadas a mano si hace falta. Resultado: el punto de fuga.
- **Bandas:** el borde inferior del horizonte y los pies del héroe, en las 3 tomas.

## 2. Ajustar los parámetros
- FOV 30 está fijo (A425). `heroFrac` 0,108.
- **Libres:** pitch ∈ {25; 28; 31; 34} y K (`zScale`) ∈ {1; 0,85; 0,7}.
- Si cambiar el pitch exige `src/`, PARADA: propón el cambio (como `zScale` en el PR #94) y sigue solo con K.
- **Error por combinación:** la diferencia media contra 0202 en la curva de escala, la razón del pentagrama, el punto de fuga y las bandas.
- **Resultado:** la tabla completa y la mejor combinación por cifras.

## 3. Caminata con bloqueo suave
- Con la mejor combinación, haz la caminata del camino de 0137, 8–10 posiciones desde la posición de 0202 hasta la de 0137.
- **Bloqueo:** la cámara deja de avanzar en Z cuando el héroe está a L de la baranda norte, con L ∈ {0,5; 1; 1,5} H. Después solo avanza el héroe. En X la cámara sigue como siempre.
- **Por posición:**
  - borde inferior del horizonte (%);
  - pies del héroe (y);
  - escala de cada hexagrama respecto del héroe;
  - si los pilares están en cuadro.
- **Objetivos de [U]:**
  - inicio con horizonte en 20–25 % (como 0202);
  - final con horizonte en ~50 % y el héroe media banda por debajo de la baranda (como 0137);
  - pilares fuera de cuadro hacia los 3/4 del recorrido;
  - al final, la escala alrededor del héroe ≈ 1 (sin efecto telescópico).

## 4. Entrega (hojas para [U])
- **Hoja 1:** 0202, la toma Lord Fenton y 0137 | nuestro mejor ajuste en las mismas posiciones, con las líneas de suelo y los hexagramas.
- **Hoja 2:** la curva de escala contra profundidad (referencias contra nuestro ajuste), para comprobar el límite de ~50 %.
- **Hoja 3:** las tiras de la caminata para L = 0,5, 1 y 1,5 H, con las bandas pintadas.
- **`medidas_perspectiva.txt`,** con todas las cifras y lo que se marcó a mano.
- **`SHA256SUMS`** y un zip.
- Ningún juicio.

## PARADAS
- El pitch u otro parámetro exige `src/`.
- Ninguna combinación baja el error de la de partida (pitch 25, K 1).
- El mismo fallo se repite dos veces.
