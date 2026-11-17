# Protocolo de pruebas de trucos (v322)

Estado: propuesto por [R] tras la pasada única (A376–A382), pedido por [U] el 2026-11-17. Reemplaza la §5 de `INFORME_METODO_TRUCOS.md` (pasada única) y la secuencia de G1–G3. No toca el Ancla.

## 0. Por qué cambia
La pasada única no midió los trucos:
- las salas DAC no tenían sus precondiciones (A378);
- no había control positivo (A381);
- el juez decidió por piezas que imitaban objetos de R (A377);
- la referencia era de otra sala.

Ninguno de esos fallos se detectaba antes de correr. Este protocolo los detecta antes con la verificación 1, y después con la verificación 2.

## 1. Secuencia

```
Metodología → Base → Verificación 1 → Pruebas → Juicios → Verificación 2 → Resultado
 (criterios)  (escenario)  (¿se puede?)                       (¿igual que V1?)
```

Si la verificación 1 falla, no se corre ninguna prueba: se informa qué falló y se vuelve a Base o a Metodología. Si la verificación 2 falla, los juicios de esa tanda son INVÁLIDOS, no negativos.

### 1.1 Metodología (provee los criterios)
- Las fichas de 11 campos (`INFORME_METODO_TRUCOS.md` §4).
- Los criterios de la §2.
- Las predicciones de [R], congeladas con hash antes de abrir cualquier render.

### 1.2 Base (provee el escenario)
Por sala se entregan tres estados:
- **TECHO**: la sala construida con todos los trucos que muestra su toma, cada uno con su intención (prueba de Capacidad). Es el control positivo.
- **SUELO**: la misma sala con las reglas por defecto, sin trucos.
- **PLACEBO**: TECHO más un objeto que imita una pieza de R (un panel claro, una mancha en el suelo) puesto donde no cumple función de composición.

Los tres estados cumplen lo siguiente:
- la misma máscara transitable, el mismo camino y la misma meta;
- 9 posiciones (k0…k8) más las posiciones propias de cada truco;
- hashes ×2.

### 1.3 Verificación 1 (¿puede ser juzgado? ¿se puede hacer la prueba?)
Puerta de paso: TODO tiene que cumplirse.

| # | Pregunta | Cumple si |
|---|---|---|
| V1.1 | ¿La referencia es de esta sala? | toma de la MISMA sala (§2, C1); hashes ×2 iguales |
| V1.2 | ¿El juez distingue? | TECHO gana a SUELO en ≥ 8 de 9 posiciones (≥ 2 de 3 jueces cada una), y la nota absoluta media de TECHO supera a la de SUELO en ≥ 1 punto (escala 1–5) |
| V1.3 | ¿El juez lee composición y no objetos? | PLACEBO gana a TECHO en ≤ 3 de 9 |
| V1.4 | ¿Cada truco se puede probar? | en TECHO su puerta da PRESENTE en ≥ 5 de 9 posiciones; quitarlo no toca `src/`; el diff de quitarlo cae solo dentro de su caja (± 2 % del cuadro). El truco que falle sale de la lista ANTES de correr, con su motivo |
| V1.5 | ¿Queda algo que probar? | quedan ≥ 2 trucos tras V1.4 |
| V1.6 | ¿Las medidas existen? | cada medida de las fichas y de la §2 tiene su guion y corrió en seco sobre TECHO |

V1.2 y V1.3 usan los mismos jueces y el mismo texto que las pruebas. Sus resultados quedan congelados con hash: son la línea de base de V2.

### 1.4 Pruebas (quita-uno)
- Por cada truco X que pasó V1.4: el estado TECHO − X, en las posiciones donde X está PRESENTE en TECHO.
- Un truco por estado. Nada más cambia (diff fuera de su caja = 0).

### 1.5 Juicios
- 3 jueces sin contexto, texto exacto, orden y nombres al azar, mapa con sha256 abierto tras los votos.
- Dos preguntas por imagen: el par («¿cuál se parece más a R?») y la nota absoluta 1–5.
- Cada tanda de ≤ 9 lleva tres pares de control mezclados:
  - TECHO contra SUELO;
  - PLACEBO contra TECHO;
  - un par repetido de la misma tanda, para medir la constancia del juez.

### 1.6 Verificación 2 (compara contra la verificación 1)

| # | Cumple si |
|---|---|
| V2.1 | Los controles de la tanda dan el mismo resultado que V1.2 y V1.3: TECHO gana a SUELO; PLACEBO no gana |
| V2.2 | El par repetido recibe el mismo voto en ≥ 2 de 3 jueces |
| V2.3 | Las puertas de los trucos que quedan, medidas en cada render de prueba, coinciden con V1.4 (± 0,02) |
| V2.4 | Hashes ×2 iguales; ningún par idéntico |

Si V2.1, V2.2 o V2.4 fallan, la tanda es INVÁLIDA y se repite con jueces nuevos (una vez). Si falla V2.3 en un render, ese par sale del conteo.

### 1.7 Resultado
Solo con V1 y V2 cumplidas.
- **Aporta:** quitar X pierde contra TECHO en ≥ 2/3 de sus posiciones PRESENTES.
- **No aporta:** quitar X empata o gana.
- **No probado:** X salió en V1.4, con su motivo.
- Además se informa cuántas razones de los jueces nombran una sola pieza en lugar de franjas o planos (auditoría; no decide).

## 2. Criterios que cambian

| # | Antes | Ahora |
|---|---|---|
| C1 | Referencia 0137 o 0202 para cualquier sala | La toma de la MISMA sala. Sin toma de la sala, no hay juicio de parecido |
| C2 | Trucos sumados a una sala desnuda (BASE + X) | Quita-uno desde TECHO (TECHO − X contra TECHO) |
| C3 | Sin control positivo | TECHO contra SUELO es la puerta del juez (V1.2) |
| C4 | Sin control del juez | PLACEBO (V1.3) y par repetido (V2.2) |
| C5 | Presencia medida después de correr | Presencia medida en V1.4, antes; el que no pasa no se corre |
| C6 | Solo par | Par + nota absoluta 1–5 (T52) |
| C7 | TODO dibujaba trucos con la puerta fallida (A379) | No hay TODO: TECHO es la combinación, y en cada posición solo cuenta lo PRESENTE |
| C8 | Cualquier sala generada | La sala se elige por su toma y por tener las precondiciones; DAC solo si su sala las cumple |

Se mantiene: predicciones congeladas con hash; [R] firma antes de abrir; CC construye y mide, no juzga; la nota de [U] no entra en el juicio.

## 3. Elección de la sala (lo óptimo para la prueba)

| Candidata | A favor | En contra |
|---|---|---|
| **Torre del Soñador, sala F** (tomas 0137 + 0202, M6) | Las fichas se escribieron desde ESAS dos tomas: todos los trucos están en su referencia. Hay dos tomas de la misma sala (dos posiciones del juez). P1 ya dio positivo ahí (A332) | Su TECHO actual (reparaciones del paso 4e de M6) no lo he verificado; los datos viven en la rama del PR #92 |
| **Desierto** (mapa viejo + toma, v301) | Ya tiene SUELO (V1, ≈ 7/10 de [U]) y TECHO (V2, ≈ 9,5/10): V1.2 se comprueba enseguida contra la nota de [U] | Una sola toma; los trucos de las fichas salen de 0137/0202 y hay que releer cuáles muestra la toma del desierto |

Recomendación: la **sala F** para esta prueba, porque C1 y las fichas apuntan a ella, y el **desierto** como segunda sala cuando haya que ver si un truco generaliza. Si el TECHO de F no pasa V1.2, se cambia al desierto sin correr nada.

## 4. Límites
- Jueces del mismo modelo.
- La nota absoluta es nueva y no está calibrada; V1.2 es su primera calibración.
- TECHO lo hace una mano, así que prueba Capacidad y qué truco sostiene el parecido, no Generación.
